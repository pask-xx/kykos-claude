import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getDonorLevel(donations: number): string {
  if (donations >= 50) return 'DIAMOND';
  if (donations >= 31) return 'PLATINUM';
  if (donations >= 16) return 'GOLD';
  if (donations >= 6) return 'SILVER';
  return 'BRONZE';
}

export function generateOrgCode(): string {
  // 6 hex digits = ~16.7 million combinations, essentially zero collision probability
  return Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0');
}

/**
 * Generate a random fantasy nickname in Italian (not based on real names)
 * Format: aggettivo.sostantivo.numero (e.g., cuore.buono.42, anima.calda.128)
 */
export async function generateFantasyNickname(): Promise<string> {
  const adjectives = [
    'buono', 'gentile', 'caldo', 'luminoso', 'mite', 'sereno', 'solare',
    'felice', 'saggio', 'ardito', 'coraggioso', 'giusto', 'puro', 'lucente',
    'pacifico', 'grazioso', 'speranzoso', 'allegro', 'fiducioso', 'rapido', 'selvaggio',
    'delicato', 'amorevole', 'premuroso', 'generoso', 'nobile', 'sereno',
  ];

  const nouns = [
    'cuore', 'anima', 'spirito', 'sogno', 'speranza', 'sole', 'stella',
    'luna', 'nuvola', 'pioggia', 'vento', 'fiore', 'albero', 'uccello',
    'foglia', 'fiume', 'montagna', 'oceano', 'foresta', 'giardino',
    'melodia', 'armonia', 'sapienza', 'coraggio', 'pace', 'gioia',
  ];

  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  const adj = pick(adjectives);
  const noun = pick(nouns);
  const num = Math.floor(Math.random() * 999) + 1;

  return `${adj}.${noun}.${num}`;
}

/**
 * Generate operator username from firstName and lastName
 * Format: nome.cognome (e.g., mario.rossi)
 * If duplicate exists, append org code suffix: mario.rossi.ABCD12
 */
export function generateOperatorUsername(
  firstName: string,
  lastName: string,
  orgCode?: string
): string {
  const normalize = (s: string) =>
    s.toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '') // Remove accents
      .replace(/[^a-z]/g, ''); // Keep only letters

  const normalizedFirst = normalize(firstName);
  const normalizedLast = normalize(lastName);

  const baseUsername = `${normalizedFirst}.${normalizedLast}`;

  if (orgCode) {
    return `${baseUsername}.${orgCode.toLowerCase()}`;
  }

  return baseUsername;
}
