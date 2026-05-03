export type Role = 'DONOR' | 'RECIPIENT' | 'INTERMEDIARY' | 'ADMIN';
export type OrgType = 'CHARITY' | 'CHURCH' | 'ASSOCIATION';
export type OperatorRole = 'ADMIN' | 'GESTORE_RICHIESTE' | 'GESTORE_OGGETTI' | 'GESTORE_VOLONTARI' | 'OPERATORE';
export type OperatorPermission = 'RECIPIENT_AUTHORIZE' | 'OBJECT_RECEIVE' | 'OBJECT_DELIVER' | 'VOLUNTEER_MANAGE' | 'REQUEST_PROXY' | 'ORGANIZATION_ADMIN';
export type Category = 'FURNITURE' | 'ELECTRONICS' | 'CLOTHING' | 'BOOKS' | 'KITCHEN' | 'SPORTS' | 'TOYS' | 'OTHER';
export type Condition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'POOR';
export type ObjectStatus = 'AVAILABLE' | 'RESERVED' | 'DEPOSITED' | 'DONATED' | 'CANCELLED' | 'BLOCKED';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
export type GoodsOfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
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

export const OPERATOR_PERMISSION_LABELS: Record<OperatorPermission, string> = {
  RECIPIENT_AUTHORIZE: 'Abilitare utenti Riceventi',
  OBJECT_RECEIVE: 'Gestione entrata oggetti',
  OBJECT_DELIVER: 'Consegna oggetti al destinatario',
  VOLUNTEER_MANAGE: 'Organizzazione volontari',
  REQUEST_PROXY: 'Fare richieste per conto di utenti',
  ORGANIZATION_ADMIN: 'Amministrazione Ente',
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  PENDING: 'In attesa',
  APPROVED: 'Approvata',
  REJECTED: 'Rifiutata',
  EXPIRED: 'Scaduta',
  CANCELLED: 'Cancellata',
};

export const OBJECT_STATUS_LABELS: Record<ObjectStatus, string> = {
  AVAILABLE: 'Disponibile',
  RESERVED: 'Riservato',
  DEPOSITED: 'Depositato',
  DONATED: 'Donato',
  CANCELLED: 'Cancellato',
  BLOCKED: 'Bloccato',
};

export const GOODS_OFFER_STATUS_LABELS: Record<GoodsOfferStatus, string> = {
  PENDING: 'In attesa',
  ACCEPTED: 'Accettata',
  REJECTED: 'Rifiutata',
  CANCELLED: 'Cancellata',
};
