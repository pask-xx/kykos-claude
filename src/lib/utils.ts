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
 * Generate a random fantasy nickname (not based on real names)
 * Format: adjective.noun.number (e.g., kind.heart.42, happy.sun.123)
 * Used when user doesn't choose their own nickname
 */
export async function generateFantasyNickname(): Promise<string> {
  const adjectives = [
    'kind', 'gentle', 'warm', 'bright', 'soft', 'calm', 'sunny',
    'happy', 'wise', 'bold', 'brave', 'fair', 'pure', 'light',
    'peace', 'grace', 'hope', 'joy', 'trust', 'swift', 'wild',
    'tender', 'loving', 'caring', 'sharing', 'giving', 'noble',
  ];

  const nouns = [
    'heart', 'soul', 'spirit', 'dream', 'hope', 'sun', 'star',
    'moon', 'cloud', 'rain', 'wind', 'flower', 'tree', 'bird',
    'leaf', 'river', 'mountain', 'ocean', 'forest', 'garden',
    'melody', 'harmony', 'wisdom', 'courage', 'peace', 'joy',
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
