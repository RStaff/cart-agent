export default function Testimonials() {
  const items = [
    { q: "Recovered revenue in week one.", a: "We plugged in the snippet and saw conversions the same week.", who: "Maya – DTC founder" },
    { q: "Human tone, not spam.", a: "Messages feel like our brand, not bots. Replies went up.", who: "Alex – Growth lead" },
  ];
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {items.map(t => (
        <figure key={t.q} className="rounded-xl border bg-white p-6 shadow-sm">
          <blockquote className="text-slate-800">“{t.a}”</blockquote>
          <figcaption className="mt-3 text-sm text-slate-500">— {t.who}</figcaption>
        </figure>
      ))}
    </div>
  );
}
