import Link from "next/link";

type ProductSummaryPlaceholderCardProps = {
  title: string;
  description: string;
  placeholderNote: string;
  actionHref?: string;
  actionLabel?: string;
};

export function ProductSummaryPlaceholderCard({
  title,
  description,
  placeholderNote,
  actionHref,
  actionLabel,
}: ProductSummaryPlaceholderCardProps) {
  return (
    <section className="panel">
      <div className="panelInner">
        <h2 className="sectionTitle">{title}</h2>
        <p className="subtitle" style={{ marginTop: 0 }}>
          {description}
        </p>
        <div className="emptyState">
          <p className="emptyStateLabel">Placeholder</p>
          <p className="emptyStateText">{placeholderNote}</p>
        </div>
        {actionHref && actionLabel ? (
          <div className="row" style={{ marginTop: 14 }}>
            <Link href={actionHref} className="button buttonPrimary">
              {actionLabel}
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
