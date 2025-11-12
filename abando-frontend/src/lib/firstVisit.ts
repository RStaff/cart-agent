export type Page = "demo" | "dash";
const KEY = { demo: "abando:firstVisit:demo", dash: "abando:firstVisit:dash" };

export function wantTour(page: Page): boolean {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get("tour") === "1") return true;
    const v = localStorage.getItem(KEY[page]);
    return v !== "false"; // default: show once
  } catch { return false; }
}

export function dismissTour(page: Page, _action: "primary" | "skip") {
  try { localStorage.setItem(KEY[page], "false"); } catch {}
}
