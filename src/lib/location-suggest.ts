import { prisma } from '@/lib/prisma';
import { calculateDistance } from '@/lib/geo';
import type { LocationHours } from '@/types';
import { normalizeLocationHours } from '@/lib/location-validation';

/**
 * Fase C: suggerimento sede "ottimale" per una transazione.
 *
 * Strategia: data la coppia (donatore, beneficiario), si sceglie la sede
 * che minimizza la somma delle distanze:
 *
 *   dist(donatore, sede) + dist(beneficiario, sede)
 *
 * È una stima euristica del costo totale di spostamento per entrambi.
 * NON è un ottimo globale (es. non considera capacità, orari, traffico),
 * ma è intuitiva, calcolabile a runtime con un singolo scan delle sedi,
 * e produce un suggerimento "fair" (non favorisce sistematicamente uno
 * dei due).
 *
 * Tie-break deterministico: in caso di parità, vince la sede con id
 * lessicograficamente minore (test riproducibili).
 *
 * Per Fase C: NON filtriamo per orari di apertura. Il donatore sceglie
 * implicitamente recandosi fisicamente — se va in una sede chiusa, se ne
 * accorge. Filtrare per orari richiede timezone-aware logic che è out
 * scope per il pilota. TODO futuro: filtrare per "aperta in questo momento".
 *
 * La sede principale (Organization) viene inclusa nel calcolo come fosse
 * una Location fittizia con kind="MAIN". In questo modo, anche enti che
 * non hanno ancora configurato Location aggiuntive ottengono un
 * suggerimento (= la sede principale).
 */

export interface LocationSuggestion {
  /** Identificativo "kind:id" per main sede (es. "main:org-X") o "loc:loc-Y" */
  id: string;
  kind: 'MAIN' | 'COLLECTION_POINT';
  /** Nome visualizzato: indirizzo + città */
  displayName: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  /** Orari di apertura (null = sede principale, che usa hoursInfo testuale) */
  hours: LocationHours | null;
  /** Note libere sulla sede (es. "Suonare il campanello"). Null se assenti. */
  notes: string | null;
  /** Distanza dal donatore in km */
  distanceFromDonorKm: number;
  /** Distanza dal beneficiario in km */
  distanceFromBeneficiaryKm: number;
  /** Score: somma delle 2 distanze (più basso = migliore) */
  totalScoreKm: number;
}

export interface SuggestLocationResult {
  /** Sede suggerita (miglior score). Null se l'ente non ha né main né sedi. */
  suggested: LocationSuggestion | null;
  /** TUTTE le sedi dell'ente ordinate per score (sempre la sede principale inclusa se esistente) */
  allLocations: LocationSuggestion[];
  /** Per retrocompatibilità: numero totale di sedi */
  totalCount: number;
}

interface SuggestLocationInput {
  organizationId: string;
  /** Coordinate del donatore (lat/lng). Se null, la sede principale è suggerita di default. */
  donorLat: number | null;
  donorLng: number | null;
  /** Coordinate del beneficiario. Stesso comportamento se null. */
  beneficiaryLat: number | null;
  beneficiaryLng: number | null;
}

/**
 * Calcola la sede suggerita + l'elenco completo delle sedi dell'ente.
 * Usato da:
 *   - POST /api/requests (Donation)
 *   - POST /api/donor/offers (Goods offer)
 *   - UI QR (donor e recipient)
 */
export async function suggestLocationForTransaction(
  input: SuggestLocationInput
): Promise<SuggestLocationResult> {
  // 1. Carica ente (sede principale) + sedi aggiuntive in parallelo
  const [organization, additionalLocations] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: input.organizationId },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        latitude: true,
        longitude: true,
        hoursInfo: true, // legacy TipTap (mantenuto per fallback)
        hours: true, // v2 multi-slot orari strutturati
        notes: true, // v2 note libere sulla sede principale
      },
    }),
    prisma.location.findMany({
      where: { organizationId: input.organizationId, isActive: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  // 2. Costruisci la lista unificata di "candidates"
  //    La sede principale è inclusa SOLO se ha coordinate valide.
  //    Se non le ha, viene mostrata nella lista "allLocations" ma è l'ultima
  //    scelta per il suggerimento (è una sede "non geolocalizzata").
  const candidates: LocationSuggestion[] = [];

  if (
    organization &&
    organization.address &&
    organization.city &&
    organization.latitude != null &&
    organization.longitude != null
  ) {
    candidates.push({
      id: `main:${organization.id}`,
      kind: 'MAIN',
      displayName: `${organization.address}, ${organization.city}`,
      address: organization.address,
      city: organization.city,
      latitude: organization.latitude,
      longitude: organization.longitude,
      hours: normalizeLocationHours(organization.hours), // v2 multi-slot (retro-compat)
      notes: organization.notes ?? null, // v2 note libere
      distanceFromDonorKm: 0,
      distanceFromBeneficiaryKm: 0,
      totalScoreKm: 0,
    });
  }

  for (const loc of additionalLocations) {
    candidates.push({
      id: `loc:${loc.id}`,
      kind: loc.kind,
      displayName: `${loc.address}, ${loc.city}`,
      address: loc.address,
      city: loc.city,
      latitude: loc.latitude,
      longitude: loc.longitude,
      hours: normalizeLocationHours(loc.hours), // v2 multi-slot (retro-compat single-slot legacy)
      notes: loc.notes ?? null, // v2 note libere
      distanceFromDonorKm: 0,
      distanceFromBeneficiaryKm: 0,
      totalScoreKm: 0,
    });
  }

  // 3. Edge case: nessuna sede → suggerimento nullo
  if (candidates.length === 0) {
    return { suggested: null, allLocations: [], totalCount: 0 };
  }

  // 4. Calcola distanze per ogni candidato
  const donorHasCoords = input.donorLat != null && input.donorLng != null;
  const beneficiaryHasCoords = input.beneficiaryLat != null && input.beneficiaryLng != null;

  for (const c of candidates) {
    c.distanceFromDonorKm = donorHasCoords
      ? calculateDistance(input.donorLat!, input.donorLng!, c.latitude, c.longitude)
      : Number.POSITIVE_INFINITY;
    c.distanceFromBeneficiaryKm = beneficiaryHasCoords
      ? calculateDistance(input.beneficiaryLat!, input.beneficiaryLng!, c.latitude, c.longitude)
      : Number.POSITIVE_INFINITY;
    // Score: se una delle coordinate manca, usa solo l'altra distanza
    if (!donorHasCoords && beneficiaryHasCoords) {
      c.totalScoreKm = c.distanceFromBeneficiaryKm;
    } else if (donorHasCoords && !beneficiaryHasCoords) {
      c.totalScoreKm = c.distanceFromDonorKm;
    } else {
      c.totalScoreKm = c.distanceFromDonorKm + c.distanceFromBeneficiaryKm;
    }
  }

  // 5. Ordina per score ascendente, tie-break deterministico per id
  candidates.sort((a, b) => {
    if (a.totalScoreKm !== b.totalScoreKm) return a.totalScoreKm - b.totalScoreKm;
    return a.id.localeCompare(b.id);
  });

  return {
    suggested: candidates[0] ?? null,
    allLocations: candidates,
    totalCount: candidates.length,
  };
}
