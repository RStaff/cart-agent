"use client";
import * as React from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import Explainer from "@/components/Explainer";
import { cfg } from "@/lib/config";

type Page = "demo" | "dash" | "none";

function pageFromPath(path: string): Page {
  if (path.startsWith("/demo")) return "demo";
  if (path.startsWith("/dashboard")) return "dash";
  return "none";
}
function wantTour(page: Page): boolean {
  if (typeof window === "undefined" || page === "none") return false;
  const url = new URL(window.location.href);
  if (url.searchParams.get(cfg.tours.query) === "1") return true;
  const key = page === "demo" ? cfg.tours.demoKey : cfg.tours.dashKey;
  return localStorage.getItem(key) !== "false"; // default: show once
}
function dismiss(page: Page) {
  const key = page === "demo" ? cfg.tours.demoKey : cfg.tours.dashKey;
  try {
    localStorage.setItem(key, "false");
  } catch {}
}

export default function TourProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const search = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [page, setPage] = React.useState<Page>("none");

  React.useEffect(() => {
    const p = pageFromPath(pathname || "/");
    setPage(p);
    setOpen(wantTour(p));
  }, [pathname, search]);

  function onClose(action: "primary" | "skip") {
    if (page === "none") return;
    dismiss(page);
    setOpen(false);
    if (action === "primary") {
      if (page === "dash") router.push("/demo/playground?tour=1");
      if (page === "demo") {
        setTimeout(() => {
          const el = document.querySelector(
            "main input, main select, main textarea",
          ) as HTMLInputElement | null;
          el?.focus();
        }, 0);
      }
    }
  }

  return (
    <>
      {children}
      {page !== "none" && (
        <Explainer page={page} open={open} onClose={onClose} />
      )}
    </>
  );
}
