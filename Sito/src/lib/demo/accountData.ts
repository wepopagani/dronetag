import type { Order, OrderItem, UserAccount } from '@/lib/types/account';

const ago = (days: number, hours = 0): string =>
  new Date(Date.now() - days * 86400000 - hours * 3600000).toISOString();

const ahead = (days: number): string =>
  new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

// ─── Demo user (linked to the DEMO_USER in Firebase auth.ts) ────────────────

export const DEMO_USER_ACCOUNT: UserAccount = {
  uid: 'demo-admin',
  email: 'michele@360drone.it',
  firstName: 'Michele',
  lastName: 'Caffagni',
  phone: '+39 340 123 4567',
  address: {
    line1: 'Salita della Resistenza 1',
    line2: '360° Drone',
    city: 'Deiva Marina (SP)',
    postalCode: '19013',
    country: 'Italy',
  },
  createdAt: ago(120),
  updatedAt: ago(5),
};

// ─── Pricing (CHF) ──────────────────────────────────────────────────────────

const PRICE_TESSERA = 19;
const PRICE_RIBBON = 0; // included
const PRICE_POUCH = 0;  // included
const SHIPPING = 8;

// ─── Item builders ──────────────────────────────────────────────────────────

function tessera(
  serial: string,
  batch: string,
  ts: { printed: string; assembled: string; qc: string },
  variant = 'DroneTag · PVC + QR inciso',
): OrderItem {
  return {
    id: `tes-${serial}`,
    name: `Tessera DroneTag · ${variant}`,
    productCode: 'product.tessera',
    quantity: 1,
    unitPrice: PRICE_TESSERA,
    trace: {
      serialNumber: serial,
      batchNumber: batch,
      printedAt: ts.printed,
      printerId: 'Roland LV-290 · laser engraver',
      material: 'PVC ISO/IEC 7810 · Matt White · lot PVC-2611',
      assembledBy: 'A. Rossi',
      assembledAt: ts.assembled,
      qcBy: 'M. Bianchi',
      qcAt: ts.qc,
      notes:
        'QR scan test OK · NFC UID verified · keyring hole ⌀ 3.2 mm · edge polished.',
    },
  };
}

function ribbon(orderNo: string): OrderItem {
  return {
    id: `rib-${orderNo}`,
    name: 'Fiocchetto portachiavi (incluso)',
    productCode: 'product.ribbon',
    quantity: 1,
    unitPrice: PRICE_RIBBON,
    trace: null,
  };
}

function pouch(orderNo: string): OrderItem {
  return {
    id: `pou-${orderNo}`,
    name: 'Sacchettino per portachiavi (incluso)',
    productCode: 'product.pouch',
    quantity: 1,
    unitPrice: PRICE_POUCH,
    trace: null,
  };
}

function totalOf(items: OrderItem[]): number {
  return items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
}

// ─── Demo orders ────────────────────────────────────────────────────────────

const ORDER_1_ITEMS: OrderItem[] = [
  tessera(
    'DT-T-2026-0427-01',
    'BATCH-26W14-T',
    { printed: ago(5, 14), assembled: ago(4, 10), qc: ago(3, 9) },
    'DroneTag · PVC + QR inciso',
  ),
  tessera(
    'DT-T-2026-0427-02',
    'BATCH-26W14-T',
    { printed: ago(5, 13), assembled: ago(4, 10), qc: ago(3, 9) },
    'DroneTag · PVC + QR inciso',
  ),
  tessera(
    'DT-T-2026-0427-03',
    'BATCH-26W14-T',
    { printed: ago(5, 12), assembled: ago(4, 10), qc: ago(3, 9) },
    'DroneTag · PVC + QR inciso',
  ),
  ribbon('0427'),
  pouch('0427'),
];

const ORDER_2_ITEMS: OrderItem[] = [
  tessera(
    'DT-T-2026-0411-01',
    'BATCH-26W11-T',
    { printed: ago(22, 16), assembled: ago(21, 12), qc: ago(21, 9) },
  ),
  tessera(
    'DT-T-2026-0411-02',
    'BATCH-26W11-T',
    { printed: ago(22, 15), assembled: ago(21, 12), qc: ago(21, 9) },
  ),
  ribbon('0411'),
  pouch('0411'),
];

const ORDER_3_ITEMS: OrderItem[] = [
  tessera(
    'DT-T-2026-0395-01',
    'BATCH-26W09-T',
    { printed: ago(48, 14), assembled: ago(47, 10), qc: ago(47, 7) },
  ),
  tessera(
    'DT-T-2026-0395-02',
    'BATCH-26W09-T',
    { printed: ago(48, 13), assembled: ago(47, 10), qc: ago(47, 7) },
  ),
  tessera(
    'DT-T-2026-0395-03',
    'BATCH-26W09-T',
    { printed: ago(48, 12), assembled: ago(47, 10), qc: ago(47, 7) },
  ),
  ribbon('0395'),
  pouch('0395'),
];

const ORDER_4_ITEMS: OrderItem[] = [
  tessera(
    'DT-T-2026-0381-01',
    'BATCH-26W07-T',
    { printed: ago(62, 15), assembled: ago(61, 11), qc: ago(61, 8) },
  ),
  tessera(
    'DT-T-2026-0381-02',
    'BATCH-26W07-T',
    { printed: ago(62, 14), assembled: ago(61, 11), qc: ago(61, 8) },
  ),
  ribbon('0381'),
  pouch('0381'),
];

export const DEMO_ORDERS: Order[] = [
  // ── 1) In transit ─────────────────────────────────────────────────────────
  {
    id: 'ord-001',
    number: 'DT-2026-0427',
    userId: 'demo-admin',
    status: 'in_transit',
    createdAt: ago(6),
    paidAt: ago(6),
    shippedAt: ago(1, 8),
    deliveredAt: '',
    items: ORDER_1_ITEMS,
    shipping: {
      address: DEMO_USER_ACCOUNT.address,
      carrier: 'Poste Italiane · Raccomandata 1',
      trackingNumber: 'RR123456789IT',
      trackingUrl: 'https://www.poste.it/cerca/index.html#/risultati-cerca-spedizioni/RR123456789IT',
      estimatedDelivery: ahead(1),
    },
    totals: {
      subtotal: totalOf(ORDER_1_ITEMS),
      shipping: SHIPPING,
      total: totalOf(ORDER_1_ITEMS) + SHIPPING,
      currency: 'CHF',
    },
    timeline: [
      { at: ago(6), type: 'created', label: 'Ordine creato', note: '', location: 'dronetag.io', by: 'cliente' },
      { at: ago(6), type: 'paid', label: 'Pagamento confermato', note: 'Stripe · card_***4242', location: '', by: 'Stripe' },
      { at: ago(5, 14), type: 'production_started', label: 'Incisione tessere avviata', note: 'Roland LV-290', location: 'Laboratorio · Lugano', by: 'A. Rossi' },
      { at: ago(4, 10), type: 'assembled', label: 'Anelli portachiavi montati', note: '3 tessere assemblate', location: 'Laboratorio · Lugano', by: 'A. Rossi' },
      { at: ago(3, 9), type: 'qc_passed', label: 'Controllo qualità superato', note: 'Scan QR + test NFC OK', location: 'Laboratorio · Lugano', by: 'M. Bianchi' },
      { at: ago(2, 4), type: 'packed', label: 'Imballato', note: 'Sacchettino + fiocchetto inclusi', location: 'Laboratorio · Lugano', by: 'S. Conti' },
      { at: ago(1, 8), type: 'shipped', label: 'Consegnato al corriere', note: 'Poste Italiane · Raccomandata 1', location: 'Lugano 6900', by: 'Poste Italiane' },
      { at: ago(0, 10), type: 'in_transit', label: 'In transito', note: 'Centro smistamento Milano Roserio', location: 'Milano', by: 'Poste Italiane' },
    ],
  },

  // ── 2) Delivered (3 weeks ago) ────────────────────────────────────────────
  {
    id: 'ord-002',
    number: 'DT-2026-0411',
    userId: 'demo-admin',
    status: 'delivered',
    createdAt: ago(23),
    paidAt: ago(23),
    shippedAt: ago(20, 10),
    deliveredAt: ago(18, 14),
    items: ORDER_2_ITEMS,
    shipping: {
      address: DEMO_USER_ACCOUNT.address,
      carrier: 'Poste Italiane · Raccomandata 1',
      trackingNumber: 'RR987654321IT',
      trackingUrl: 'https://www.poste.it/cerca/index.html#/risultati-cerca-spedizioni/RR987654321IT',
      estimatedDelivery: '',
    },
    totals: {
      subtotal: totalOf(ORDER_2_ITEMS),
      shipping: SHIPPING,
      total: totalOf(ORDER_2_ITEMS) + SHIPPING,
      currency: 'CHF',
    },
    timeline: [
      { at: ago(23), type: 'created', label: 'Ordine creato', note: '', location: 'dronetag.io', by: 'cliente' },
      { at: ago(23), type: 'paid', label: 'Pagamento confermato', note: 'Stripe · card_***4242', location: '', by: 'Stripe' },
      { at: ago(22, 16), type: 'production_started', label: 'Incisione tessere avviata', note: '', location: 'Laboratorio · Lugano', by: 'A. Rossi' },
      { at: ago(21, 9), type: 'qc_passed', label: 'Controllo qualità superato', note: '', location: 'Laboratorio · Lugano', by: 'M. Bianchi' },
      { at: ago(21, 4), type: 'packed', label: 'Imballato', note: 'Sacchettino + fiocchetto inclusi', location: 'Laboratorio · Lugano', by: 'S. Conti' },
      { at: ago(20, 10), type: 'shipped', label: 'Consegnato al corriere', note: '', location: 'Lugano 6900', by: 'Poste Italiane' },
      { at: ago(18, 14), type: 'delivered', label: 'Consegnato', note: 'Firmato dal destinatario', location: 'Deiva Marina 19013', by: 'Poste Italiane' },
    ],
  },

  // ── 3) Delivered (~6 weeks ago) ───────────────────────────────────────────
  {
    id: 'ord-003',
    number: 'DT-2026-0395',
    userId: 'demo-admin',
    status: 'delivered',
    createdAt: ago(49),
    paidAt: ago(49),
    shippedAt: ago(46, 9),
    deliveredAt: ago(44, 11),
    items: ORDER_3_ITEMS,
    shipping: {
      address: DEMO_USER_ACCOUNT.address,
      carrier: 'Poste Italiane · Raccomandata 1',
      trackingNumber: 'RR554433221IT',
      trackingUrl: 'https://www.poste.it/cerca/index.html#/risultati-cerca-spedizioni/RR554433221IT',
      estimatedDelivery: '',
    },
    totals: {
      subtotal: totalOf(ORDER_3_ITEMS),
      shipping: SHIPPING,
      total: totalOf(ORDER_3_ITEMS) + SHIPPING,
      currency: 'CHF',
    },
    timeline: [
      { at: ago(49), type: 'created', label: 'Ordine creato', note: '', location: 'dronetag.io', by: 'cliente' },
      { at: ago(49), type: 'paid', label: 'Pagamento confermato', note: 'Stripe · card_***4242', location: '', by: 'Stripe' },
      { at: ago(48, 14), type: 'production_started', label: 'Incisione tessere avviata', note: '', location: 'Laboratorio · Lugano', by: 'A. Rossi' },
      { at: ago(47, 7), type: 'qc_passed', label: 'Controllo qualità superato', note: '', location: 'Laboratorio · Lugano', by: 'M. Bianchi' },
      { at: ago(47, 3), type: 'packed', label: 'Imballato', note: 'Sacchettino + fiocchetto inclusi', location: 'Laboratorio · Lugano', by: 'S. Conti' },
      { at: ago(46, 9), type: 'shipped', label: 'Consegnato al corriere', note: '', location: 'Lugano 6900', by: 'Poste Italiane' },
      { at: ago(44, 11), type: 'delivered', label: 'Consegnato', note: '', location: 'Deiva Marina 19013', by: 'Poste Italiane' },
    ],
  },

  // ── 4) Delivered (~2 months ago) ──────────────────────────────────────────
  {
    id: 'ord-004',
    number: 'DT-2026-0381',
    userId: 'demo-admin',
    status: 'delivered',
    createdAt: ago(63),
    paidAt: ago(63),
    shippedAt: ago(60, 10),
    deliveredAt: ago(58, 12),
    items: ORDER_4_ITEMS,
    shipping: {
      address: DEMO_USER_ACCOUNT.address,
      carrier: 'Poste Italiane · Raccomandata 1',
      trackingNumber: 'RR112233445IT',
      trackingUrl: 'https://www.poste.it/cerca/index.html#/risultati-cerca-spedizioni/RR112233445IT',
      estimatedDelivery: '',
    },
    totals: {
      subtotal: totalOf(ORDER_4_ITEMS),
      shipping: SHIPPING,
      total: totalOf(ORDER_4_ITEMS) + SHIPPING,
      currency: 'CHF',
    },
    timeline: [
      { at: ago(63), type: 'created', label: 'Ordine creato', note: '', location: 'dronetag.io', by: 'cliente' },
      { at: ago(63), type: 'paid', label: 'Pagamento confermato', note: 'Stripe · card_***4242', location: '', by: 'Stripe' },
      { at: ago(62, 15), type: 'production_started', label: 'Incisione tessere avviata', note: '', location: 'Laboratorio · Lugano', by: 'A. Rossi' },
      { at: ago(61, 8), type: 'qc_passed', label: 'Controllo qualità superato', note: '', location: 'Laboratorio · Lugano', by: 'M. Bianchi' },
      { at: ago(61, 4), type: 'packed', label: 'Imballato', note: 'Sacchettino + fiocchetto inclusi', location: 'Laboratorio · Lugano', by: 'S. Conti' },
      { at: ago(60, 10), type: 'shipped', label: 'Consegnato al corriere', note: '', location: 'Lugano 6900', by: 'Poste Italiane' },
      { at: ago(58, 12), type: 'delivered', label: 'Consegnato', note: '', location: 'Deiva Marina 19013', by: 'Poste Italiane' },
    ],
  },
];
