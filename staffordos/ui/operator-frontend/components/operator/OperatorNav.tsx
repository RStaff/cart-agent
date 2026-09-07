import Link from "next/link";

const CAREEROS_ROUTES = [
  { href: "/operator/careeros/beta-users", label: "CareerOS Operations" },
  { href: "/operator/careeros/missions/CAREEROS_V1_P1_OUTCOME_TRACKING_AND_DAILY_TRIAGE", label: "CareerOS Missions" },
] as const;

export function OperatorNav({ activeHref }: { activeHref: string }) {
  if (!activeHref.startsWith("/operator/careeros/")) return null;

  return (
    <nav className="row navRow" aria-label="CareerOS navigation">
      {CAREEROS_ROUTES.map((route) => (
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
