export default function Section(props: {
  id?: string;
  title?: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={props.id} className="container py-16 sm:py-24">
      {props.eyebrow && (
        <div className="mb-2 text-sm font-medium text-brand-700">
          {props.eyebrow}
        </div>
      )}
      {props.title && <h2 className="h-section mb-6">{props.title}</h2>}
      <div>{props.children}</div>
    </section>
  );
}
