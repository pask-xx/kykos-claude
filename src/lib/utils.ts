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
