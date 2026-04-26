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
  return Math.floor(1000 + Math.random() * 9000).toString();
}
