export type Role = 'DONOR' | 'RECIPIENT' | 'INTERMEDIARY' | 'ADMIN';
export type OrgType = 'CHARITY' | 'CHURCH' | 'ASSOCIATION';
export type OperatorRole = 'ADMIN' | 'GESTORE_RICHIESTE' | 'GESTORE_OGGETTI' | 'GESTORE_VOLONTARI' | 'OPERATORE';
export type Category = 'FURNITURE' | 'ELECTRONICS' | 'CLOTHING' | 'BOOKS' | 'KITCHEN' | 'SPORTS' | 'TOYS' | 'OTHER';
export type Condition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'POOR';
export type ObjectStatus = 'AVAILABLE' | 'RESERVED' | 'DONATED' | 'WITHDRAWN';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type DonorLevel = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  type: OrgType;
  address?: string;
  phone?: string;
  email?: string;
  verified: boolean;
  userId: string;
}

export interface Object {
  id: string;
  title: string;
  description?: string;
  category: Category;
  condition: Condition;
  status: ObjectStatus;
  imageUrls?: string[];
  donorId: string;
  intermediaryId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Request {
  id: string;
  status: RequestStatus;
  message?: string;
  objectId: string;
  recipientId: string;
  intermediaryId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Donation {
  id: string;
  amount: number;
  currency: string;
  objectId: string;
  donorId: string;
  recipientId: string;
  requestId: string;
  paymentId?: string;
  createdAt: Date;
}

export interface DonorProfile {
  id: string;
  totalDonations: number;
  totalObjects: number;
  level: DonorLevel;
  userId: string;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  FURNITURE: 'Arredamento',
  ELECTRONICS: 'Elettronica',
  CLOTHING: 'Abbigliamento',
  BOOKS: 'Libri',
  KITCHEN: 'Cucina',
  SPORTS: 'Sport',
  TOYS: 'Giocattoli',
  OTHER: 'Altro',
};

export const CONDITION_LABELS: Record<Condition, string> = {
  NEW: 'Nuovo',
  LIKE_NEW: 'Come nuovo',
  GOOD: 'Buono',
  FAIR: 'Discreto',
  POOR: 'Usurato',
};

export const DONOR_LEVEL_LABELS: Record<DonorLevel, string> = {
  BRONZE: 'Bronzo',
  SILVER: 'Argento',
  GOLD: 'Oro',
  PLATINUM: 'Platino',
  DIAMOND: 'Diamante',
};

export const ORG_TYPE_LABELS: Record<OrgType, string> = {
  CHARITY: 'Centro Caritas',
  CHURCH: 'Parrocchia',
  ASSOCIATION: 'Associazione',
};

export const OPERATOR_ROLE_LABELS: Record<OperatorRole, string> = {
  ADMIN: 'Amministratore',
  GESTORE_RICHIESTE: 'Gestore Richieste',
  GESTORE_OGGETTI: 'Gestore Oggetti',
  GESTORE_VOLONTARI: 'Gestore Volontari',
  OPERATORE: 'Operatore',
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  PENDING: 'In attesa',
  APPROVED: 'Approvata',
  REJECTED: 'Rifiutata',
  EXPIRED: 'Scaduta',
};
