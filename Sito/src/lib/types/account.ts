// ─── User account (Firestore: `users/{uid}`) ────────────────────────────────

export interface Address {
  line1: string;
  line2: string;
  city: string;
  postalCode: string;
  country: string;
}

export const EMPTY_ADDRESS: Address = {
  line1: '',
  line2: '',
  city: '',
  postalCode: '',
  country: '',
};

/** Whether this user is a private individual or a company. */
export type AccountType = 'private' | 'company';

export interface UserAccount {
  uid: string;
  email: string;
  /**
   * 'private' for individuals (uses firstName/lastName/dateOfBirth);
   * 'company' for legal entities (uses companyName/companyVat/companyContactPerson).
   * Defaults to 'private' for backward compatibility with pre-M1 accounts.
   */
  accountType: AccountType;
  firstName: string;
  lastName: string;
  /** ISO date (YYYY-MM-DD). Only meaningful when accountType === 'private'. */
  dateOfBirth: string;
  phone: string;
  address: Address;

  // Company-specific fields. Empty strings for private accounts.
  companyName: string;
  companyContactPerson: string;
  companyVat: string;
  /** Optional country-specific company registry number (e.g. REA/CH-UID). */
  companyUniqueNumber: string;

  createdAt: string;
  updatedAt: string;
}

export const EMPTY_USER_ACCOUNT_EXTRAS = {
  accountType: 'private' as AccountType,
  dateOfBirth: '',
  companyName: '',
  companyContactPerson: '',
  companyVat: '',
  companyUniqueNumber: '',
};

// ─── Orders (Firestore: `orders/{id}` with `userId` field) ─────────────────

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'in_production'
  | 'assembled'
  | 'quality_check'
  | 'packed'
  | 'shipped'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export interface OrderItemTrace {
  /** Unique serial printed on the physical item (QR / engraving). */
  serialNumber: string;
  /** Manufacturing batch reference. */
  batchNumber: string;
  /** ISO date the frame/part was 3D-printed. */
  printedAt: string;
  /** Printer identifier (e.g. "Bambu-X1C-03"). */
  printerId: string;
  /** Filament / material batch. */
  material: string;
  /** Operator who assembled the unit. */
  assembledBy: string;
  /** ISO date of assembly completion. */
  assembledAt: string;
  /** QC inspector. */
  qcBy: string;
  /** ISO date QC was signed off. */
  qcAt: string;
  /** Free-text notes (calibration values, runtime, etc). */
  notes: string;
}

export interface OrderItem {
  id: string;
  name: string;
  /** e.g. "bundle.full" | "bundle.drone" | "accessories.pack". */
  productCode: string;
  quantity: number;
  unitPrice: number;
  /** Non-null for physical items that get a serial + trace sheet. */
  trace: OrderItemTrace | null;
}

export type OrderEventType =
  | 'created'
  | 'paid'
  | 'production_started'
  | 'assembled'
  | 'qc_passed'
  | 'packed'
  | 'shipped'
  | 'in_transit'
  | 'delivered'
  | 'note';

export interface OrderEvent {
  at: string; // ISO
  type: OrderEventType;
  label: string;
  note: string;
  location: string;
  /** Operator / courier responsible. */
  by: string;
}

export interface OrderShipping {
  address: Address;
  carrier: string;
  trackingNumber: string;
  trackingUrl: string;
  /** YYYY-MM-DD. */
  estimatedDelivery: string;
}

export interface OrderTotals {
  subtotal: number;
  shipping: number;
  total: number;
  currency: string; // e.g. 'CHF'
}

export interface Order {
  id: string;
  /** Human-readable order number. */
  number: string;
  userId: string;
  status: OrderStatus;
  createdAt: string;
  paidAt: string;
  shippedAt: string;
  deliveredAt: string;
  items: OrderItem[];
  shipping: OrderShipping;
  totals: OrderTotals;
  timeline: OrderEvent[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const ORDER_STATUS_STEPS: OrderStatus[] = [
  'paid',
  'in_production',
  'assembled',
  'quality_check',
  'packed',
  'shipped',
  'in_transit',
  'delivered',
];
