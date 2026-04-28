import Link from "next/link";

const CONTROL_PLANE_ROUTES = [
  { href: "/operator", label: "Console" },
  { href: "/operator/command-center", label: "Command Center" },
  { href: "/operator/capacity", label: "Capacity" },
  { href: "/operator/leads", label: "Leads" },
  { href: "/operator/revenue-command", label: "Revenue Command" },
  { href: "/operator/analytics", label: "Analytics" },
  { href: "/operator/products", label: "Products" },
  { href: "/operator/system-map", label: "System Map" },
] as const;

export function OperatorNav({ activeHref }: { activeHref: string }) {
  return (
    <nav className="row navRow" aria-label="Operator sections">
      {CONTROL_PLANE_ROUTES.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={`chip navChip${route.href === activeHref ? " navChipActive" : ""}`}
        >
          {route.label}
        </Link>
      ))}
    </nav>
  );
}
