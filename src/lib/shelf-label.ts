/**
 * Etichette scaffale — parsing e formattazione.
 *
 * L'etichetta scaffale è un QR stampato dall'ente (`/operator/shelf-label`)
 * con questo payload:
 *
 *     `${stanza}\n${scaffale}\n${piano}`
 *
 * NOTA: non è un token `kykos:` — è testo puro. I campi sono separati da
 * newline, quindi un campo può contenere spazi ("MAGAZZINO NORD").
 *
 * Il parser è condiviso da:
 * - il flusso deposito beni (`/operator/goods-deposit/[requestId]`)
 * - la form di pubblicazione delle disponibilità dell'ente
 *   (`/operator/entity-availability`)
 *
 * Retrocompatibilità: le etichette già stampate continuano a essere lette
 * esattamente come prima. Il parsing è stato reso più robusto (split su
 * newline PRIMA dello split su spazi): con il vecchio parser un campo con
 * degli spazi ("MAGAZZINO NORD") veniva spezzato in due; ora viene letto
 * correttamente. Per i payload a parola singola il risultato è identico.
 */

export interface ShelfPosition {
  stanza: string;
  scaffale: string;
  piano: string;
}

/**
 * Estrae stanza/scaffale/piano da un payload QR etichetta scaffale.
 *
 * @returns `null` se il payload non contiene 3 campi riconoscibili.
 */
export function parseShelfQr(data: string | null | undefined): ShelfPosition | null {
  if (!data) return null;

  const raw = data.trim();
  if (!raw) return null;

  // Formato con newline (generato da /operator/shelf-label): ogni riga è un
  // campo e può contenere spazi.
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length >= 3) {
    return { stanza: lines[0], scaffale: lines[1], piano: lines[2] };
  }

  // Fallback legacy: separatori di spazio (etichette stampate su una riga).
  const parts = raw.split(/[\s]+/).filter((p) => p.trim().length > 0);
  if (parts.length >= 3) {
    return { stanza: parts[0], scaffale: parts[1], piano: parts[2] };
  }

  return null;
}

/**
 * Formatta una posizione scaffale nel formato mostrato all'operatore:
 * `(S): <stanza> - (S): <scaffale> - (P): <piano>`.
 *
 * Se il payload non è riconoscibile restituisce il testo originale (il
 * chiamante può così mostrare un valore grezzo invece di perderlo).
 */
export function formatShelfLocation(data: string | null | undefined): string {
  if (!data) return '';

  const parsed = parseShelfQr(data);
  if (!parsed) return data;

  return `(S): ${parsed.stanza} - (S): ${parsed.scaffale} - (P): ${parsed.piano}`;
}

/**
 * Costruisce il payload QR di un'etichetta scaffale.
 * Usato dal generatore di etichette e come riferimento del formato.
 */
export function buildShelfQrData(position: ShelfPosition): string {
  return `${position.stanza}\n${position.scaffale}\n${position.piano}`;
}
