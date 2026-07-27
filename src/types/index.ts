export type Role = 'DONOR' | 'RECIPIENT' | 'INTERMEDIARY' | 'ADMIN';
export type OrgType = 'CHARITY' | 'CHURCH' | 'ASSOCIATION';
export type OperatorRole = 'ADMIN' | 'GESTORE_RICHIESTE' | 'GESTORE_OGGETTI' | 'GESTORE_VOLONTARI' | 'OPERATORE';
export type OperatorPermission = 'RECIPIENT_AUTHORIZE' | 'OBJECT_RECEIVE' | 'OBJECT_DELIVER' | 'VOLUNTEER_MANAGE' | 'REQUEST_PROXY' | 'ORGANIZATION_ADMIN';
export type Category = 'FURNITURE' | 'ELECTRONICS' | 'CLOTHING' | 'BOOKS' | 'KITCHEN' | 'SPORTS' | 'TOYS' | 'OTHER';
export type Condition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'POOR';
export type ObjectStatus = 'AVAILABLE' | 'RESERVED' | 'DEPOSITED' | 'DONATED' | 'CANCELLED' | 'BLOCKED';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
export type GoodsOfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
export type GoodsRequestStatus = 'PENDING' | 'APPROVED' | 'FULFILLED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type DonorLevel = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';
export type LocationKind = 'COLLECTION_POINT';

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
  RESERVED: 'Riservata',
  DEPOSITED: 'Depositata',
  DONATED: 'Ritirato',
  CANCELLED: 'Cancellato',
  BLOCKED: 'Bloccato',
};

export const GOODS_OFFER_STATUS_LABELS: Record<GoodsOfferStatus, string> = {
  PENDING: 'In attesa',
  ACCEPTED: 'Accettata',
  REJECTED: 'Rifiutata',
  CANCELLED: 'Cancellata',
};

export const GOODS_REQUEST_STATUS_LABELS: Record<GoodsRequestStatus, string> = {
  PENDING: 'In attesa',
  APPROVED: 'Approvata',
  FULFILLED: 'Soddisfatta',
  DELIVERED: 'Depositata',
  COMPLETED: 'Completata',
  CANCELLED: 'Cancellata',
};

// Need Score helpers
export type NeedScore = number; // 0-100

export const NEED_SCORE_LABELS = (score: number): string => {
  if (score >= 80) return 'Alto bisogno';
  if (score >= 50) return 'Bisogno medio';
  if (score >= 20) return 'Basso bisogno';
  return 'Minimo bisogno';
};

// ================== LOCATIONS (Fase A: schema, Fase B: UI) ==================

/// Orari di apertura di una Location per giorno della settimana.
/// null = chiuso. Le chiavi sono 7 giorni (lun–dom) in italiano.
export type LocationDayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export const LOCATION_DAY_KEYS: LocationDayKey[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export const LOCATION_DAY_LABELS: Record<LocationDayKey, string> = {
  monday: 'Lunedì',
  tuesday: 'Martedì',
  wednesday: 'Mercoledì',
  thursday: 'Giovedì',
  friday: 'Venerdì',
  saturday: 'Sabato',
  sunday: 'Domenica',
};

export const LOCATION_DAY_LABELS_SHORT: Record<LocationDayKey, string> = {
  monday: 'Lun',
  tuesday: 'Mar',
  wednesday: 'Mer',
  thursday: 'Gio',
  friday: 'Ven',
  saturday: 'Sab',
  sunday: 'Dom',
};

/// Fascia oraria di un giorno. Formato 24h "HH:MM".
/// Validato lato form con zod (Fase B + multi-slot v2).
export interface LocationHoursSlot {
  open: string;  // "09:00"
  close: string; // "18:00"
}

/// Orari di una sede (Location O Organization): mappa giorno → fasce orarie.
///
/// Semantica per giorno:
/// - `null`   = giorno **chiuso** esplicitamente (es. domenica)
/// - `[]`     = giorno **non specificato** (stato neutro, mostrato come "—")
/// - `[s1,...]` = 1+ fasce orarie (no overlap, no slot a cavallo mezzanotte)
///
/// Esempio multi-slot (mattina + pomeriggio):
/// ```ts
/// { monday:    [{ open: '09:00', close: '12:00' }, { open: '15:00', close: '18:00' }],
///   tuesday:   [{ open: '09:00', close: '18:00' }],
///   wednesday: null,
///   ... }
/// ```
///
/// Serializzato in DB come JSON nel campo `hours` di Location e Organization.
/// Per retrocompat con record pre-migration single-slot, usare
/// `normalizeLocationHours()` da `@/lib/location-validation`.
export type LocationHours = Partial<Record<LocationDayKey, LocationHoursSlot[] | null>>;

/// Alias riusato da Organization: la shape JSON è identica a Location.
export type OrganizationHours = LocationHours;

export const LOCATION_KIND_LABELS: Record<LocationKind, string> = {
  COLLECTION_POINT: 'Punto di raccolta',
};

/// Sede aggiuntiva (punto di raccolta) di un ente.
/// La sede principale resta sui campi address/coordinates/hoursInfo
/// di Organization. Questa interfaccia modella SOLO sedi extra.
export interface Location {
  id: string;
  organizationId: string;
  kind: LocationKind;
  address: string;
  city: string;
  postalCode: string;
  province?: string;
  country: string;
  latitude: number;
  longitude: number;
  hours?: LocationHours;
  notes?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/// Relazione N-N: quali sedi (Location) l'operatore può gestire.
/// Determina su quali sedi l'operatore vede/transazioni gestisce.
export interface OperatorLocation {
  id: string;
  operatorId: string;
  locationId: string;
  createdAt: Date;
}

/// Helper: data JS Date → LocationDayKey corrispondente
/// (usato per mostrare "Oggi: 09:00–18:00" in dashboard/donazioni).
export function locationDayKeyForDate(date: Date): LocationDayKey {
  // getDay(): 0=Sun, 1=Mon, ..., 6=Sat → mappato a LocationDayKey
  const map: LocationDayKey[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  return map[date.getDay()];
}
