import fs from "fs";
import path from "path";

const FILE = path.join("app", "embedded", "page.tsx");

let src = fs.readFileSync(FILE, "utf8");

// Target the FOLLOW-UPS SENT marker to inject before it
const marker = 'FOLLOW-UPS SENT';
const idx = src.indexOf(marker);

if (idx === -1) {
  console.log("⚠️ Could not find FOLLOW-UPS SENT in app/embedded/page.tsx.");
  process.exit(0);
}

// Find heading end
const headingStart = src.lastIndexOf("<p", idx);
const closeHeading = src.indexOf("</p>", headingStart) + 4;

const before = src.slice(0, headingStart);
const after = src.slice(headingStart);

// The injected block
const injection = `
                  {/* Abando Response & Why */}
                  <p className="mt-6 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-emerald-400">
                    Abando Response & Why
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-100/90">
                    <li>• AI detected hesitation signals and chose the lowest-friction nudge.</li>
                    <li>• Selected urgency vs. reassurance based on shopper browsing patterns.</li>
                    <li>• Picked channels based on what this shopper has historically responded to.</li>
                  </ul>

                  {/* Existing FOLLOW-UPS SENT block follows */}
`;

const updated = before + injection + after;

fs.writeFileSync(FILE, updated, "utf8");
console.log("✅ 'Abando Response & Why' block added successfully.");
