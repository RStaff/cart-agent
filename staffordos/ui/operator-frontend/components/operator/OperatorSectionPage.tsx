import { OperatorNav } from "./OperatorNav";

type OperatorSectionPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  activeHref: string;
  status: string;
  focus: string[];
};

export function OperatorSectionPage({
  eyebrow,
  title,
  description,
  activeHref,
  status,
  focus,
}: OperatorSectionPageProps) {
  return (
    <main className="shell">
      <div className="container">
        <section className="panel">
          <div className="panelInner">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="title">{title}</h1>
            <p className="subtitle">{description}</p>

            <OperatorNav activeHref={activeHref} />
          </div>
        </section>

        <section className="panel">
          <div className="panelInner">
            <h2 className="sectionTitle">Status</h2>
            <p className="subtitle" style={{ marginTop: 0 }}>
              {status}
            </p>
          </div>
        </section>

        <section className="panel">
          <div className="panelInner">
            <h2 className="sectionTitle">Control-Plane Focus</h2>
            <div className="kv">
              {focus.map((item) => (
                <div key={item}>{item}</div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
