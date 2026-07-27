/**
 * Test per `src/lib/location-format.ts`.
 *
 * Focus:
 * - `formatLocationHoursCompact` su shape v2 (array di slot per giorno),
 *   `null`, `[]` (array vuoto per un giorno), giorni null espliciti.
 * - `formatLocationNotesHtml` su escape HTML (`&`, `<`, `>`, `"`) e
 *   newline → `<br>`. Ritorna stringa vuota se null/undefined/vuoto.
 */
import { describe, it, expect } from 'vitest';
import {
  formatLocationHoursCompact,
  formatLocationNotesHtml,
} from '@/lib/location-format';

describe('formatLocationHoursCompact', () => {
  it('ritorna null per input null', () => {
    expect(formatLocationHoursCompact(null)).toBeNull();
  });

  it('ritorna stringa con "chiuso" per giorni null espliciti', () => {
    const result = formatLocationHoursCompact({
      monday: [{ open: '09:00', close: '18:00' }],
      sunday: null,
    });
    expect(result).toContain('Lun 09:00-18:00');
    expect(result).toContain('Dom chiuso');
  });

  it('concatena più fasce dello stesso giorno separate da virgola (multi-slot)', () => {
    const result = formatLocationHoursCompact({
      monday: [
        { open: '09:00', close: '12:00' },
        { open: '15:00', close: '18:00' },
      ],
    });
    expect(result).toContain('Lun 09:00-12:00, 15:00-18:00');
  });

  it('se un giorno è array vuoto [], viene marcato come chiuso', () => {
    const result = formatLocationHoursCompact({
      monday: [],
    });
    expect(result).toContain('Lun chiuso');
  });

  it('compone tutti i 7 giorni con labels short e separatore " / "', () => {
    const result = formatLocationHoursCompact({
      monday: [{ open: '09:00', close: '18:00' }],
      tuesday: [{ open: '09:00', close: '18:00' }],
      wednesday: [{ open: '09:00', close: '18:00' }],
      thursday: [{ open: '09:00', close: '18:00' }],
      friday: [{ open: '09:00', close: '18:00' }],
      saturday: [{ open: '09:00', close: '13:00' }],
      sunday: null,
    });
    expect(result).toBe(
      'Lun 09:00-18:00 / Mar 09:00-18:00 / Mer 09:00-18:00 / Gio 09:00-18:00 / Ven 09:00-18:00 / Sab 09:00-13:00 / Dom chiuso'
    );
  });

  it('tutti i giorni null: ritorna stringa con tutti "chiuso" (mai null)', () => {
    const result = formatLocationHoursCompact({
      monday: null,
      tuesday: null,
      wednesday: null,
    });
    expect(result).toBe(
      'Lun chiuso / Mar chiuso / Mer chiuso / Gio chiuso / Ven chiuso / Sab chiuso / Dom chiuso'
    );
  });
});

describe('formatLocationNotesHtml', () => {
  it('ritorna stringa vuota per null/undefined/stringa vuota', () => {
    expect(formatLocationNotesHtml(null)).toBe('');
    expect(formatLocationNotesHtml(undefined)).toBe('');
    expect(formatLocationNotesHtml('')).toBe('');
    expect(formatLocationNotesHtml('   ')).toBe('');
  });

  it('passa attraverso testo plain senza alterazioni', () => {
    expect(formatLocationNotesHtml('Suonare il campanello')).toBe(
      'Suonare il campanello'
    );
  });

  it('esegue escape di < > & "', () => {
    expect(formatLocationNotesHtml('<script>alert("x")</script> & co.')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; co.'
    );
  });

  it('converte newline in <br>', () => {
    expect(formatLocationNotesHtml('riga 1\nriga 2')).toBe('riga 1<br>riga 2');
    expect(formatLocationNotesHtml('a\nb\nc')).toBe('a<br>b<br>c');
  });

  it('escape + newline combinati', () => {
    expect(formatLocationNotesHtml('<b>hello</b>\nworld & you')).toBe(
      '&lt;b&gt;hello&lt;/b&gt;<br>world &amp; you'
    );
  });
});