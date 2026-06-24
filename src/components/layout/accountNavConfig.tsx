import type { NavIconKey } from '@/components/layout/navIcons';

export type AccountNavItem = {
  href: string;
  labelKey: string;
  icon: NavIconKey;
  prefix: string;
  /** Bottom bar on mobile (max 4 + More). */
  mobilePrimary?: boolean;
};

export const ACCOUNT_NAV_ITEMS: AccountNavItem[] = [
  { href: '/account', labelKey: 'account.nav.home', icon: 'home', prefix: '/account', mobilePrimary: true },
  { href: '/account/certificates', labelKey: 'account.tab.certificates', icon: 'certificates', prefix: '/account/certificates', mobilePrimary: true },
  { href: '/account/drones', labelKey: 'account.tab.drones', icon: 'drones', prefix: '/account/drones', mobilePrimary: true },
  { href: '/account/insurances', labelKey: 'account.tab.insurances', icon: 'insurances', prefix: '/account/insurances', mobilePrimary: true },
  { href: '/account/profile', labelKey: 'account.tabProfile', icon: 'profile', prefix: '/account/profile' },
  { href: '/account/operators', labelKey: 'account.tab.operators', icon: 'operators', prefix: '/account/operators' },
  { href: '/account/documents', labelKey: 'account.tab.documents', icon: 'documents', prefix: '/account/documents' },
  { href: '/account/permits', labelKey: 'account.tab.permits', icon: 'documents', prefix: '/account/permits' },
  { href: '/account/archive', labelKey: 'account.tab.archive', icon: 'documents', prefix: '/account/archive' },
  { href: '/account/orders', labelKey: 'account.tabOrders', icon: 'orders', prefix: '/account/orders' },
  { href: '/account/inbox', labelKey: 'inbox.tab', icon: 'inbox', prefix: '/account/inbox' },
  { href: '/account/billing', labelKey: 'account.tab.billing', icon: 'billing', prefix: '/account/billing' },
];

export function isAccountNavActive(pathname: string, item: AccountNavItem): boolean {
  if (item.href === '/account') {
    return pathname === '/account';
  }
  return pathname === item.href || pathname.startsWith(`${item.prefix}/`);
}
