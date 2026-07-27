/**
 * Helper per formattare LocationSuggestion in vari contesti.
 *
 * Usato da:
 *  - src/lib/email.ts (template email donatore/beneficiario con sedi)
 *  - src/components/qr/QrPage.tsx e QrDialog.tsx (sede suggerita + lista completa)
 *
 * Fase C+multi-slot: il format è HTML inline (stile email-table) per coerenza con
 * gli altri template email KYKOS. Le UI React possono usare la stessa
 * logica testuale (displayName, hoursString) senza dover parsare HTML.
 */
import type { LocationHours, OrganizationHours, LocationDayKey } from '@/types';
import { LOCATION_DAY_KEYS, LOCATION_DAY_LABELS_SHORT, LOCATION_KIND_LABELS } from '@/types';
import type { LocationSuggestion } from '@/lib/location-suggest';

/**
 * Converte LocationHours in una stringa compatta "Lun 9-12, 15-18 / Mar chiuso / ...".
 * Utile sia per le email (HTML semplice) sia per le UI (testo).
 *
 * Se hours è null o tutti i giorni sono null/vuoti, ritorna null.
 *
 * Multi-slot (v2): se un giorno ha più fasce (es. mattina + pomeriggio), vengono
 * concatenate separate da virgola.
 */
export function formatLocationHoursCompact(
  hours: LocationHours | OrganizationHours | null
): string | null {
  if (!hours) return null;
  const parts: string[] = [];
  for (const day of LOCATION_DAY_KEYS as LocationDayKey[]) {
    const slots = hours[day];
    const dayLabel = LOCATION_DAY_LABELS_SHORT[day];
    if (!slots || slots.length === 0) {
      parts.push(`${dayLabel} chiuso`);
      continue;
    }
    const ranges = slots.map((s) => `${s.open}-${s.close}`).join(', ');
    parts.push(`${dayLabel} ${ranges}`);
  }
  const out = parts.join(' / ');
  return out.length > 0 ? out : null;
}

/**
 * Renderizza le note libere di una sede come HTML sicuro (escape &, <, >, ").
 * Coerente con il pattern "Suonare il campanello" (no markup).
 *
 * Coesiste con `formatLocationHoursCompact`: le note vanno sotto gli orari
 * come paragrafo italicato, separate visivamente.
 *
 * Ritorna SEMPRE una stringa (stringa vuota se note assenti/vuote) per
 * ergonomia con `dangerouslySetInnerHTML` di React, che accetta solo stringa.
 */
export function formatLocationNotesHtml(notes: string | null | undefined): string {
  if (!notes || !notes.trim()) return '';
  const escaped = notes
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  return escaped.replace(/\n/g, '<br>');
}

/**
 * Formatta una singola LocationSuggestion come HTML inline (stile email).
 * Usato sia per la "sede consigliata" (con sfondo evidenziato) sia per la
 * lista compatta delle altre sedi.
 *
 * @param loc     location da formattare
 * @param opts.highlight se true, usa un box con bordo blu (sede consigliata)
 */
export function formatLocationHtml(
  loc: LocationSuggestion,
  opts: { highlight?: boolean } = {}
): string {
  const bg = opts.highlight ? '#eff6ff' : '#f9fafb';
  const borderColor = opts.highlight ? '#2563eb' : '#e5e7eb';
  const kindLabel = loc.kind === 'MAIN' ? 'Sede principale' : LOCATION_KIND_LABELS[loc.kind];
  const hoursCompact = formatLocationHoursCompact(loc.hours);
  const distanceNote =
    loc.distanceFromDonorKm < 1e8 && loc.distanceFromBeneficiaryKm < 1e8
      ? `~${loc.distanceFromDonorKm.toFixed(1)} km da te`
      : loc.distanceFromDonorKm < 1e8
        ? `~${loc.distanceFromDonorKm.toFixed(1)} km da te`
        : loc.distanceFromBeneficiaryKm < 1e8
          ? `~${loc.distanceFromBeneficiaryKm.toFixed(1)} km dal beneficiario`
          : '';

  const notesHtml = formatLocationNotesHtml(loc.notes);

  return `
    <div style="margin: 12px 0; padding: 12px 16px; background: ${bg}; border-left: 4px solid ${borderColor}; border-radius: 6px;">
      <p style="font-size: 12px; color: #6b7280; margin: 0 0 4px;">${kindLabel}${distanceNote ? ` · ${distanceNote}` : ''}</p>
      <p style="font-size: 14px; color: #1f2937; font-weight: 600; margin: 0 0 4px;">${loc.displayName}</p>
      ${hoursCompact ? `<p style="font-size: 12px; color: #4b5563; margin: 0;">${hoursCompact}</p>` : ''}
      ${notesHtml ? `<p style="font-size: 11px; color: #6b7280; font-style: italic; margin: 4px 0 0;">${notesHtml}</p>` : ''}
    </div>
  `;
}

/**
 * Ritorna un blocco HTML compatto che mostra la sede consigliata in alto
 * (evidenziata) seguita dall'elenco compatto delle altre sedi.
 *
 * Se l'ente ha una sola sede, ritorna il blocco di quella sede (evidenziata).
 * Se l'ente non ha sedi, ritorna stringa vuota.
 */
export function formatLocationSuggestionBlock(
  suggested: LocationSuggestion | null,
  allLocations: LocationSuggestion[]
): string {
  if (!suggested && allLocations.length === 0) return '';
  // Caso degenere: nessuna sede suggerita ma esiste una lista (es. tutte
  // senza coordinate) — mostriamo solo la lista.
  if (!suggested) {
    const items = allLocations.map((l) => formatLocationHtml(l)).join('');
    return `
      <div style="margin: 24px 0; padding: 16px; background: #f9fafb; border-radius: 8px;">
        <p style="font-size: 14px; color: #1f2937; font-weight: 600; margin: 0 0 8px;">Sedi disponibili</p>
        ${items}
      </div>
    `;
  }

  const otherLocations = allLocations.filter((l) => l.id !== suggested.id);
  const othersBlock = otherLocations.length
    ? `
      <div style="margin-top: 16px;">
        <p style="font-size: 12px; color: #6b7280; margin: 0 0 4px;">Altre sedi disponibili</p>
        ${otherLocations.map((l) => formatLocationHtml(l)).join('')}
      </div>
    `
    : '';

  return `
    <div style="margin: 24px 0; padding: 16px; background: #f0f9ff; border-radius: 8px;">
      <p style="font-size: 14px; color: #1e40af; font-weight: 600; margin: 0 0 8px;">📍 Sede consigliata</p>
      ${formatLocationHtml(suggested, { highlight: true })}
      ${othersBlock}
      <p style="font-size: 12px; color: #6b7280; margin: 12px 0 0;">Il QR code è valido per <strong>tutte le sedi</strong> dell'ente. Recati fisicamente in quella più comoda per te.</p>
    </div>
  `;
}
