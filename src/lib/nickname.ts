// Generazione e normalizzazione nickname anonimo KYKOS.
// Stesso formato usato in operator/street-beneficiaries/* e in auth/register:
// "aggettivo.nome.123" (tutto lowercase, separatori punto).
// Vedi [[kykos-anonimity]] per il contesto di anonimato.

const ADJECTIVES = [
  'buono', 'gentile', 'caldo', 'luminoso', 'mite',
  'sereno', 'solare', 'felice', 'saggio', 'ardito',
] as const;

const NOUNS = [
  'cuore', 'anima', 'spirito', 'sogno', 'sole',
  'stella', 'luna', 'fiore', 'albero', 'vento',
] as const;

/**
 * Genera un nickname casuale nel formato "aggettivo.nome.123".
 * NON garantisce unicità: l'unicità è responsabilità del backend
 * (unique constraint su User.nickname nel Prisma schema).
 * Se la generazione collide, il chiamante riceve l'errore dal server.
 */
export function generateNickname(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 999) + 1;
  return `${adj}.${noun}.${num}`;
}

/**
 * Normalizza input utente: lowercase + rimuove caratteri non [a-z0-9.].
 * Da usare come onChange handler per il campo nickname per evitare
 * caratteri non ammessi (spazi, accenti, simboli).
 */
export function normalizeNickname(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9.]/g, '');
}
