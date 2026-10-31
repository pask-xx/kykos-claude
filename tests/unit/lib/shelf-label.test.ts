import { describe, it, expect } from 'vitest';
import {
  parseShelfQr,
  formatShelfLocation,
  buildShelfQrData,
} from '@/lib/shelf-label';

/**
 * L'etichetta scaffale è un QR con payload testo puro:
 *   `${stanza}\n${scaffale}\n${piano}`
 * generato da /operator/shelf-label.
 */
describe('parseShelfQr', () => {
  it('parsa il formato newline standard (3 campi)', () => {
    expect(parseShelfQr('A\nB\n1')).toEqual({ stanza: 'A', scaffale: 'B', piano: '1' });
  });

  it('parsa il formato con CRLF', () => {
    expect(parseShelfQr('A\r\nB\r\n1')).toEqual({ stanza: 'A', scaffale: 'B', piano: '1' });
  });

  it('NON spezza i campi che contengono spazi (fix del parser legacy)', () => {
    // Il vecchio parser splittava su whitespace: "MAGAZZINO NORD" diventava
    // stanza="MAGAZZINO", scaffale="NORD".
    expect(parseShelfQr('MAGAZZINO NORD\nA-12\n1')).toEqual({
      stanza: 'MAGAZZINO NORD',
      scaffale: 'A-12',
      piano: '1',
    });
  });

  it('ignora righe vuote', () => {
    expect(parseShelfQr('\nA\n\nB\n\n1\n')).toEqual({ stanza: 'A', scaffale: 'B', piano: '1' });
  });

  it('fallback legacy: campi separati da spazi su una riga', () => {
    expect(parseShelfQr('A B 1')).toEqual({ stanza: 'A', scaffale: 'B', piano: '1' });
  });

  it('prende i primi 3 campi se ce ne sono di più', () => {
    expect(parseShelfQr('A\nB\n1\n2')).toEqual({ stanza: 'A', scaffale: 'B', piano: '1' });
  });

  it.each([
    ['stringa vuota', ''],
    ['solo spazi', '   '],
    ['un solo campo', 'A'],
    ['due campi', 'A B'],
    ['null', null],
    ['undefined', undefined],
  ])('restituisce null per %s', (_label, value) => {
    expect(parseShelfQr(value as unknown as string)).toBeNull();
  });
});

describe('formatShelfLocation', () => {
  it('formatta nel formato (S)/(S)/(P)', () => {
    expect(formatShelfLocation('A\nB\n1')).toBe('(S): A - (S): B - (P): 1');
  });

  it('formattia correttamente i campi con spazi', () => {
    expect(formatShelfLocation('MAGAZZINO NORD\nA-12\n1')).toBe(
      '(S): MAGAZZINO NORD - (S): A-12 - (P): 1'
    );
  });

  it('restituisce il testo originale se non riconoscibile (non perde il dato)', () => {
    expect(formatShelfLocation('MAGAZZINO')).toBe('MAGAZZINO');
  });

  it('restituisce stringa vuota per input vuoto', () => {
    expect(formatShelfLocation('')).toBe('');
    expect(formatShelfLocation(null)).toBe('');
  });
});

describe('buildShelfQrData', () => {
  it('costruisce il payload newline atteso da /operator/shelf-label', () => {
    expect(buildShelfQrData({ stanza: 'A', scaffale: 'B', piano: '1' })).toBe('A\nB\n1');
  });

  it('round-trip: build → parse restituisce i valori originali', () => {
    const position = { stanza: 'MAGAZZINO NORD', scaffale: 'A-12', piano: '1' };
    expect(parseShelfQr(buildShelfQrData(position))).toEqual(position);
  });
});
