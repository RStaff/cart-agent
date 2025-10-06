export const LS_KEYS = {
  lastMessage: "abando:lastMessage",
  lastVariants: "abando:lastVariants",
  lastImage: "abando:lastImageUrl",
  firstVisitDemo: "abando:firstVisit:demo",
  firstVisitDash: "abando:firstVisit:dash",
} as const;

export type Variant = { id: string; text: string };

export type SavedPayload = {
  message: string;
  variants: Variant[];
  imageUrl?: string;
  ts: number;
};

/** Safe localStorage access on client only */
export const safeStorage = {
  get<T = unknown>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set<T = unknown>(key: string, value: T) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
  setString(key: string, value: string) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, value);
    } catch {}
  },
  getString(key: string, fallback = ""): string {
    if (typeof window === "undefined") return fallback;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ?? fallback;
    } catch {
      return fallback;
    }
  },
};
