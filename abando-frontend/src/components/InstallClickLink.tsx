"use client";

import { resolveInstallPath, type InstallSurface } from "./installFunnel";

type InstallClickLinkProps = {
  children: React.ReactNode;
  className: string;
  surface: InstallSurface;
  store?: string;
  shop?: string;
};

export function InstallClickLink({
  children,
  className,
  surface,
  store,
  shop,
}: InstallClickLinkProps) {
  async function onClick(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();

    const href = resolveInstallPath({ surface, store, shop });

    try {
      await fetch("/api/install-click", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          store_domain: store || shop || "unknown",
          source: surface,
        }),
      });
    } catch {
      // Keep navigation resilient if analytics logging fails.
    }

    window.location.assign(href);
  }

  return (
    <a href={resolveInstallPath({ surface, store, shop })} className={className} onClick={onClick}>
      {children}
    </a>
  );
}
