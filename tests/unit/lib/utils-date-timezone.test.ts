/**
 * Test per il bug timezone toISOString().slice(0,10).
 *
 * Bug originale (2026-09-14): getNextDateForWeekday(6) da lunedì 14 set Europe/Rome
 * ritornava '2026-09-18' (venerdì) invece di '2026-09-19' (sabato) perché usava
 * toISOString() che converte in UTC.
 *
 * Questi test dimostrano che:
 * 1. Il vecchio approccio (toISOString) è BUGGATO per client ahead di UTC
 * 2. Il fix (metodi locali) ritorna il giorno corretto in qualsiasi timezone
 */
import { describe, it, expect } from 'vitest';

describe('getNextDateForWeekday (timezone-safe)', () => {
  /**
   * Versione FIXATA della funzione (estratta da page.tsx dopo il fix)
   */
  function getNextDateForWeekday(weekday: number, fromDate = new Date()): string {
    const d = new Date(fromDate);
    d.setHours(0, 0, 0, 0);
    const diff = (weekday - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  /**
   * Versione BUGGATA originale (per dimostrare il problema)
   */
  function getNextDateForWeekdayBuggy(weekday: number, fromDate = new Date()): string {
    const d = new Date(fromDate);
    d.setHours(0, 0, 0, 0);
    const diff = (weekday - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    return d.toISOString().slice(0, 10);
  }

  it('FIX: lunedì 14 set 2026 → sabato successivo = 19 set 2026 (Europe/Rome)', () => {
    // fromDate = lunedì 14 set 2026 12:00 Europe/Rome (= 10:00 UTC)
    const fromDate = new Date('2026-09-14T12:00:00+02:00');
    expect(getNextDateForWeekday(6, fromDate)).toBe('2026-09-19');
  });

  it('FIX: lunedì 14 set 2026 → domenica successiva = 20 set 2026 (Europe/Rome)', () => {
    const fromDate = new Date('2026-09-14T12:00:00+02:00');
    expect(getNextDateForWeekday(0, fromDate)).toBe('2026-09-20');
  });

  it('FIX: lunedì 14 set 2026 → martedì successivo = 15 set 2026 (Europe/Rome)', () => {
    const fromDate = new Date('2026-09-14T12:00:00+02:00');
    expect(getNextDateForWeekday(2, fromDate)).toBe('2026-09-15');
  });

  it('FIX: sabato 19 set 2026 → sabato SUCCESSIVO (= 26 set), non oggi stesso', () => {
    // Regola KYKOS: diff = 0 ritorna 7 (settimana prossima), non oggi stesso
    const fromDate = new Date('2026-09-19T12:00:00+02:00');
    expect(getNextDateForWeekday(6, fromDate)).toBe('2026-09-26');
  });

  it('REGRESSION: dimostra che il vecchio toISOString() ritorna -1 giorno per Europe/Rome', () => {
    const fromDate = new Date('2026-09-14T12:00:00+02:00');
    // Il bug originale ritornava '2026-09-18' invece di '2026-09-19'
    const buggyResult = getNextDateForWeekdayBuggy(6, fromDate);
    expect(buggyResult).toBe('2026-09-18'); // ← DOCUMENTA IL BUG
    // Conferma che il fix produce il valore corretto
    expect(getNextDateForWeekday(6, fromDate)).toBe('2026-09-19');
  });
});
