type AnalyticsPlaceholderCardProps = {
  title: string;
  description: string;
  placeholderNote: string;
};

export function AnalyticsPlaceholderCard({
  title,
  description,
  placeholderNote,
}: AnalyticsPlaceholderCardProps) {
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
      </div>
    </section>
  );
}
