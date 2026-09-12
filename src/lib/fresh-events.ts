// =============================================================
// src/lib/fresh-events.ts
// Helper condivisi per la feature "Distribuzione Prodotti Freschi".
// =============================================================
// Logica riusata da:
//   - /api/recipient/fresh-events/* (controlli prenotazione)
//   - /api/operator/fresh-events/* (warning, ammissione, sospensione)
//   - UI pages (verifica sospensione per disabilitare CTA)
//
// Regole KYKOS:
//   - Anonimato: nessun select con donor.name esposto al beneficiario.
//   - Enum tradotti: le label sono in src/types/index.ts.
//   - Retrocompat: nessuna modifica a User.authorized o canRequestGoods.
// =============================================================

import { prisma } from '@/lib/prisma';
import { generateFreshPickupQrCode } from '@/lib/qrcode';

export interface FreshOrgSettings {
  organizationId: string;
  freshWarningThreshold: number;
  freshSuspensionDays: number;
}

export interface FreshSuspensionStatus {
  suspended: boolean;
  until: Date | null;
  warnings: number;
}

/**
 * Verifica se un beneficiario è attualmente sospeso dal "fresco".
 * Se freshSuspendedUntil è nel passato o null, NON è sospeso.
 */
export function getFreshSuspensionStatus(user: {
  freshSuspendedUntil: Date | null;
  freshWarnings: number;
}): FreshSuspensionStatus {
  const now = new Date();
  const suspended = !!user.freshSuspendedUntil && user.freshSuspendedUntil > now;
  return {
    suspended,
    until: user.freshSuspendedUntil,
    warnings: user.freshWarnings,
  };
}

/**
 * Recupera le impostazioni di warning/sospensione di un'ente.
 * Usa i default (2 warning, 30gg) se le colonne non sono valorizzate
 * (es. enti creati prima di questa migration).
 */
export async function getFreshOrgSettings(organizationId: string): Promise<FreshOrgSettings> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      freshWarningThreshold: true,
      freshSuspensionDays: true,
    },
  });
  return {
    organizationId: org?.id ?? organizationId,
    freshWarningThreshold: org?.freshWarningThreshold ?? 2,
    freshSuspensionDays: org?.freshSuspensionDays ?? 30,
  };
}

/**
 * Incrementa il contatore warning fresco di un beneficiario.
 * Se raggiunge la soglia dell'ente, applica la sospensione automatica.
 *
 * Ritorna lo stato aggiornato del beneficiario (warnings + suspendedUntil).
 * Idempotente solo per il chiamante: ogni chiamata = 1 warning.
 */
export async function incrementFreshWarnings(
  beneficiaryId: string,
  organizationId: string,
): Promise<{ warnings: number; suspendedUntil: Date | null; justSuspended: boolean }> {
  const settings = await getFreshOrgSettings(organizationId);

  // Aggiorna in transazione: incrementa + controlla soglia
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: beneficiaryId },
      select: { freshWarnings: true, freshSuspendedUntil: true },
    });
    if (!user) {
      throw new Error(`Beneficiario ${beneficiaryId} non trovato`);
    }
    const newWarnings = user.freshWarnings + 1;
    const now = new Date();

    // Se è GIÀ sospeso e il periodo è passato, NON si sospende di nuovo.
    // Altrimenti applica sospensione solo se raggiunge soglia.
    const alreadySuspended = user.freshSuspendedUntil && user.freshSuspendedUntil > now;
    const shouldSuspend = newWarnings >= settings.freshWarningThreshold && !alreadySuspended;
    const suspendedUntil = shouldSuspend
      ? new Date(now.getTime() + settings.freshSuspensionDays * 24 * 60 * 60 * 1000)
      : user.freshSuspendedUntil;

    const updated = await tx.user.update({
      where: { id: beneficiaryId },
      data: {
        freshWarnings: newWarnings,
        freshSuspendedUntil: suspendedUntil,
      },
      select: { freshWarnings: true, freshSuspendedUntil: true },
    });

    return {
      warnings: updated.freshWarnings,
      suspendedUntil: updated.freshSuspendedUntil,
      justSuspended: shouldSuspend,
    };
  });

  return result;
}

/**
 * Recupera la posizione successiva in waiting list per uno slot.
 * Usato quando un beneficiario prenota e va in WAITING.
 */
export async function getNextWaitingPosition(freshEventId: string): Promise<number> {
  const last = await prisma.freshEventReservation.findFirst({
    where: { freshEventId, status: 'WAITING' },
    orderBy: { position: 'desc' },
    select: { position: true },
  });
  return (last?.position ?? 0) + 1;
}

/**
 * Helper per generare QR di una prenotazione fresca.
 * Wrapper su generateFreshPickupQrCode per nascondere il formato al chiamante.
 */
export function makeFreshReservationQrCode(reservationId: string, beneficiaryId: string): string {
  return generateFreshPickupQrCode(reservationId, beneficiaryId);
}

/**
 * Controlla se un beneficiario può prenotare uno slot fresco.
 * Verifica: authorized, non deactivated, non sospeso, slot in stato corretto.
 */
export interface CanReserveCheck {
  ok: boolean;
  reason?: 'NOT_AUTHORIZED' | 'DEACTIVATED' | 'SUSPENDED' | 'SLOT_NOT_PUBLISHED' | 'ALREADY_RESERVED';
  message?: string;
}

export async function canReserveFreshSlot(
  userId: string,
  freshEventId: string,
): Promise<CanReserveCheck> {
  const [user, slot, existing] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        authorized: true,
        deactivatedAt: true,
        freshSuspendedUntil: true,
      },
    }),
    prisma.freshEvent.findUnique({
      where: { id: freshEventId },
      select: { status: true, scheduledStart: true },
    }),
    prisma.freshEventReservation.findUnique({
      where: { freshEventId_beneficiaryId: { freshEventId, beneficiaryId: userId } },
      select: { id: true, status: true },
    }),
  ]);

  if (!user) return { ok: false, reason: 'NOT_AUTHORIZED', message: 'Utente non trovato' };
  if (user.deactivatedAt) return { ok: false, reason: 'DEACTIVATED', message: 'Account disattivato' };
  if (!user.authorized) {
    return { ok: false, reason: 'NOT_AUTHORIZED', message: 'Devi essere autorizzato dall\'ente' };
  }
  if (user.freshSuspendedUntil && user.freshSuspendedUntil > new Date()) {
    return {
      ok: false,
      reason: 'SUSPENDED',
      message: `Sei sospeso dai prodotti freschi fino al ${user.freshSuspendedUntil.toLocaleDateString('it-IT')}`,
    };
  }
  if (!slot || (slot.status !== 'PUBLISHED' && slot.status !== 'FULL')) {
    return { ok: false, reason: 'SLOT_NOT_PUBLISHED', message: 'Slot non disponibile per prenotazioni' };
  }
  if (slot.scheduledStart < new Date()) {
    return { ok: false, reason: 'SLOT_NOT_PUBLISHED', message: 'Slot già iniziato' };
  }
  if (existing && existing.status !== 'CANCELLED') {
    return { ok: false, reason: 'ALREADY_RESERVED', message: 'Hai già una prenotazione per questo slot' };
  }

  return { ok: true };
}
