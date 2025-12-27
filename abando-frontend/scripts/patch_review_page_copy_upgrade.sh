#!/usr/bin/env bash
set -euo pipefail

# Run from repo root OR inside abando-frontend
if [[ -d "abando-frontend" && -f "abando-frontend/app/embedded/review/page.tsx" ]]; then
  ROOT="abando-frontend"
elif [[ -f "app/embedded/review/page.tsx" ]]; then
  ROOT="."
else
  echo "❌ Can't find app/embedded/review/page.tsx (run from repo root or abando-frontend)."
  exit 1
fi

PAGE="$ROOT/app/embedded/review/page.tsx"
TS="$(date +%s)"
cp "$PAGE" "$PAGE.bak_$TS"

echo "🛠️ Patching: $PAGE"
echo "📦 Backup:  $PAGE.bak_$TS"

# 1) Soften "next-best action" language where it appears
perl -0777 -i -pe '
  s/Next-best action suggestions/Suggested responses by hesitation type/g;
  s/Next-best action suggestions/Suggested responses by hesitation type/g;
  s/next-best action suggestions/suggested responses by hesitation type/g;
' "$PAGE"

# 2) Insert a "What happens after install" + "Example insight" section after hero paragraph block.
# We anchor on the hero sentence you currently have:
ANCHOR='Abando helps merchants understand why shoppers pause'

python - << PY
import pathlib, re

page = pathlib.Path("$PAGE")
txt = page.read_text(encoding="utf-8")

anchor = "$ANCHOR"
idx = txt.find(anchor)
if idx == -1:
  print("⚠️ Anchor not found; no insert performed. (Your copy may differ.)")
  raise SystemExit(0)

# Find the end of the paragraph containing the anchor:
# We look for the next closing </p> after the anchor.
m = re.search(rf"{re.escape(anchor)}.*?</p>", txt[idx:], flags=re.S)
if not m:
  print("⚠️ Couldn't find closing </p> for hero paragraph; no insert performed.")
  raise SystemExit(0)

end = idx + m.end()

insert = r'''

      {/* Post-install mental model (review-safe, no claims) */}
      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
          <div className="text-sm font-semibold">What happens after install</div>
          <div className="mt-2 space-y-2 text-sm text-white/70 leading-relaxed">
            <div className="flex gap-2">
              <span className="mt-1.5 h-2 w-2 rounded-full bg-emerald-300/70 flex-none" />
              <span>Abando begins observing checkout behavior patterns.</span>
            </div>
            <div className="flex gap-2">
              <span className="mt-1.5 h-2 w-2 rounded-full bg-emerald-300/70 flex-none" />
              <span>Sessions are grouped by hesitation signals (e.g., sizing, timing, friction).</span>
            </div>
            <div className="flex gap-2">
              <span className="mt-1.5 h-2 w-2 rounded-full bg-emerald-300/70 flex-none" />
              <span>Suggested responses appear alongside each hesitation type.</span>
            </div>
            <div className="flex gap-2">
              <span className="mt-1.5 h-2 w-2 rounded-full bg-emerald-300/70 flex-none" />
              <span>Merchants stay in control of messaging and timing.</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
          <div className="text-sm font-semibold">Example insight (abstract)</div>
          <div className="mt-2 text-sm text-white/70 leading-relaxed">
            <div className="text-white/60">Hesitation detected:</div>
            <div className="mt-1 font-medium">Extended pause during shipping step</div>
            <div className="mt-3 text-white/60">Possible response:</div>
            <div className="mt-1 font-medium">
              Surface shipping expectations earlier in the flow
            </div>
          </div>
          <div className="mt-4 text-xs text-white/45">
            Example only • Real activity populates after install
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
          <div className="text-sm font-semibold">Why this reduces hesitation</div>
          <div className="mt-2 text-sm text-white/70 leading-relaxed">
            Instead of guessing, you get clearer signals about <span className="text-white/85">why</span> shoppers pause—
            so follow-ups can match intent without adding tabs, tools, or manual digging.
          </div>
        </div>
      </section>
'''

new_txt = txt[:end] + insert + txt[end:]
page.write_text(new_txt, encoding="utf-8")
print("✅ Inserted post-install + example insight section.")
PY

echo "✅ Done."
echo "Next:"
echo "  cd $ROOT"
echo "  npm run dev"
echo "  open http://localhost:3000/embedded/review"
