/**
 * Storico delle disponibilità pubblicate dall'ente: calcolo data di
 * consegna, filtri e raggruppamento per giorno.
 *
 * MODULO PURO: nessun import server-only (`@/lib/qrcode`, `@/lib/email`,
 * `@prisma/client` con side-effect). Viene usato sia dalle route API (Node)
 * sia dalle pagine client: importare qui roba server-only finirebbe nel
 * bundle del browser.
 *
 * Perché un file separato da `src/lib/entity-objects.ts`: quello contiene
 * gli helper che generano/inviano email e QR (import server-only), quindi
 * non può essere importato da una pagina client.
 *
 * Le regole di revoca/ripubblicazione/modifica stanno in
 * `src/lib/entity-object-rules.ts`.
 */

/** Riga dello storico (disponibilità consegnata). */
export interface EntityHistoryItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  condition: string;
  imageUrls: string[] | null;
  depositLocation: string | null;
  createdAt: string;
  /** Data di consegna/ritiro in ISO. */
  deliveredAt: string;
}

/**
 * Data di consegna della disponibilità.
 *
 * `Donation.deliveredAt` è il campo progettato per il ritiro fisico del
 * beneficiario, ma fino a oggi non veniva scritto da nessun flusso: se
 * manca si usa `Object.updatedAt` (timestamp dell'ultima modifica, cioè
 * il passaggio a `DONATED`).
 */
export function resolveEntityDeliveredAt(
  donationDeliveredAt: string | Date | null | undefined,
  updatedAt: string | Date
): string {
  const primary = donationDeliveredAt ? new Date(donationDeliveredAt) : null;
  if (primary && !Number.isNaN(primary.getTime())) {
    return primary.toISOString();
  }
  const fallback = new Date(updatedAt);
  return Number.isNaN(fallback.getTime()) ? new Date(0).toISOString() : fallback.toISOString();
}

/** Periodi selezionabili nei filtri dello storico. */
export type EntityHistoryPeriod = 'ALL' | 'LAST_30_DAYS' | 'LAST_90_DAYS' | 'CURRENT_YEAR';

export const ENTITY_HISTORY_PERIODS: { value: EntityHistoryPeriod; label: string }[] = [
  { value: 'ALL', label: 'Tutto il periodo' },
  { value: 'LAST_30_DAYS', label: 'Ultimi 30 giorni' },
  { value: 'LAST_90_DAYS', label: 'Ultimi 90 giorni' },
  { value: 'CURRENT_YEAR', label: 'Anno corrente' },
];

/**
 * Intervallo [from, to] (orari locali) del periodo selezionato.
 * `null` = nessun limite (tutto il periodo).
 */
export function entityHistoryPeriodRange(
  period: EntityHistoryPeriod | undefined,
  now: Date = new Date()
): { from: Date; to: Date } | null {
  if (!period || period === 'ALL') return null;

  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (period === 'CURRENT_YEAR') {
    return { from: new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0), to };
  }

  const days = period === 'LAST_90_DAYS' ? 90 : 30;
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days, 0, 0, 0, 0);
  return { from, to };
}

/** Filtri applicabili allo storico. */
export interface EntityHistoryFilters {
  /** Testo libero: titolo, descrizione, posizione di deposito. */
  search?: string;
  period?: EntityHistoryPeriod;
  /** Categoria (`'ALL'` o `null` = tutte). */
  category?: string | null;
  /** "Oggi" di riferimento (testabile). */
  now?: Date;
}

/** Applica i filtri allo storico. */
export function filterEntityHistory(
  items: EntityHistoryItem[],
  filters: EntityHistoryFilters = {}
): EntityHistoryItem[] {
  const search = (filters.search ?? '').trim().toLowerCase();
  const category = filters.category && filters.category !== 'ALL' ? filters.category : null;
  const range = entityHistoryPeriodRange(filters.period ?? 'ALL', filters.now);

  return items.filter((item) => {
    if (category && item.category !== category) return false;

    if (range) {
      const time = new Date(item.deliveredAt).getTime();
      if (Number.isNaN(time)) return false;
      if (time < range.from.getTime() || time > range.to.getTime()) return false;
    }

    if (search) {
      const haystack = [item.title, item.description ?? '', item.depositLocation ?? '']
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    return true;
  });
}

/** Gruppo di righe dello storico: un giorno di consegna. */
export interface EntityHistoryGroup {
  /** Chiave locale YYYY-MM-DD del giorno. */
  dateKey: string;
  /** Label leggibile (es. "venerdì 31 ottobre 2026"). */
  label: string;
  items: EntityHistoryItem[];
}

/** Chiave locale YYYY-MM-DD (non UTC: il giorno è quello del fuso dell'ente). */
export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Raggruppa lo storico per giorno di consegna, dal più recente al più
 * vecchio. L'ordine dei gruppi segue l'ordine degli item (che la pagina
 * mantiene già decrescente per data).
 */
export function groupEntityHistoryByDate(items: EntityHistoryItem[]): EntityHistoryGroup[] {
  const sorted = [...items].sort((a, b) => {
    const ta = new Date(a.deliveredAt).getTime();
    const tb = new Date(b.deliveredAt).getTime();
    if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
    if (Number.isNaN(ta)) return 1;
    if (Number.isNaN(tb)) return -1;
    return tb - ta;
  });

  const groups: EntityHistoryGroup[] = [];

  for (const item of sorted) {
    const date = new Date(item.deliveredAt);
    const invalid = Number.isNaN(date.getTime());
    const dateKey = invalid ? 'unknown' : localDateKey(date);
    const label = invalid
      ? 'Data sconosciuta'
      : date.toLocaleDateString('it-IT', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });

    const last = groups[groups.length - 1];
    if (last && last.dateKey === dateKey) {
      last.items.push(item);
    } else {
      groups.push({ dateKey, label, items: [item] });
    }
  }

  return groups;
}

/**
 * Parsa una data `YYYY-MM-DD` come confine locale.
 * `endOfDay=true` → fine giornata (23:59:59.999).
 * Restituisce `null` se il valore non è una data valida.
 */
export function parseLocalDateBoundary(
  value: string | null | undefined,
  endOfDay: boolean
): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0
  );

  return Number.isNaN(date.getTime()) ? null : date;
}
