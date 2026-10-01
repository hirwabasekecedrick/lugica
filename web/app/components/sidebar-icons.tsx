/**
 * Icons for the shared application sidebar.
 *
 * Split out of InventorySidebar so every shell that renders the sidebar draws
 * the same glyphs. Each icon takes an optional `className` so callers can size
 * it consistently.
 */

type IconProps = { className?: string };

export function DashboardIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h4a1 1 0 001-1v-3h2v3a1 1 0 001 1h4a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
    </svg>
  );
}

export function CatalogIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="2" y="3" width="16" height="14" rx="2" />
      <path d="M2 7h16" strokeLinecap="round" />
      <path d="M6 3v4" strokeLinecap="round" />
    </svg>
  );
}

export function ProcurementIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M4 4h12v12H4z" strokeLinecap="round" />
      <path d="M10 2v6m0 0l-2-2m2 2l2-2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 13h6" strokeLinecap="round" />
    </svg>
  );
}

export function StorefrontIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function CheckoutIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
      <path
        fillRule="evenodd"
        d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h3a1 1 0 100-2H9z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function AccountIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 9a3.5 3.5 0 100-7 3.5 3.5 0 000 7zm-7 8a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
  );
}

export function UsersIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M7 9a3 3 0 100-6 3 3 0 000 6zM1 17v-1a5 5 0 0110 0v1H1zm12.5-7.6A2.5 2.5 0 1014.9 4a3 3 0 01-1.4 5.4zM14 17v-1a4.5 4.5 0 013.5-4.4V17H14z" />
    </svg>
  );
}

export function VehicleIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M2 12V7a1 1 0 011-1h9a1 1 0 011 1v5" strokeLinecap="round" />
      <path d="M2 12h16v3a1 1 0 01-1 1h-1.5" strokeLinecap="round" />
      <path d="M4 16H2.5A1.5 1.5 0 011 14.5V12" strokeLinecap="round" />
      <circle cx="6" cy="14" r="1.75" />
      <circle cx="14" cy="14" r="1.75" />
    </svg>
  );
}

export function DeliveryIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M10 17s5-4.6 5-8a5 5 0 10-10 0c0 3.4 5 8 5 8z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="9" r="1.75" />
    </svg>
  );
}

export function OrdersIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M4 2.5h9L17 6v11a1 1 0 01-1 1H4a1 1 0 01-1-1v-13a1 1 0 011-1z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 2.5V6h4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 10h7M6.5 13h5" strokeLinecap="round" />
    </svg>
  );
}

export function TrackingIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="10" cy="10" r="2.5" />
      <path d="M10 1.5v3M10 15.5v3M1.5 10h3M15.5 10h3" strokeLinecap="round" />
      <circle cx="10" cy="10" r="6.5" strokeDasharray="2 2.5" />
    </svg>
  );
}

export function SignOutIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1"
      />
    </svg>
  );
}

export function CreateIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="14" height="14" rx="2" />
      <path d="M10 7v6M7 10h6" strokeLinecap="round" />
    </svg>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export function MenuIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}