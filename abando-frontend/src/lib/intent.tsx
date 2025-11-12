// Minimal CTA intent tracker (Plausible)
// Tracks only intent clicks; no pageviews.
'use client';

import React from "react";

declare global {
  interface Window {
    plausible?: (event: string, opts?: { props?: Record<string, unknown> }) => void;
  }
}

function matchCTA(el: Element | null): { kind: 'link'|'button', href?: string } | null {
  if (!el) return null;
  const a = el.closest('a') as HTMLAnchorElement | null;
  if (a) {
    const href = a.getAttribute('href') || '';
    if (/^\/(onboarding|pricing|trial|demo)/.test(href) || a.hasAttribute('data-cta')) {
      return { kind: 'link', href };
    }
  }
  const b = el.closest('button') as HTMLButtonElement | null;
  if (b && (b.hasAttribute('data-cta') || /start|try|demo|install/i.test(b.textContent || ''))) {
    return { kind: 'button' };
  }
  return null;
}

export default function IntentTracker() {
  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const m = matchCTA(target);
      if (!m) return;

      const el = (target?.closest('a,button') as HTMLElement | null) || undefined;
      const label =
        (el?.getAttribute('data-cta')) ||
        (el?.textContent?.trim()?.slice(0, 80)) ||
        'cta';
      const href = (el as HTMLAnchorElement | undefined)?.getAttribute?.('href') || undefined;

      if (
        process.env.NEXT_PUBLIC_ANALYTICS === 'plausible' &&
        typeof window !== 'undefined' &&
        typeof window.plausible === 'function'
      ) {
        window.plausible('cta_click', {
          props: {
            label,
            href: href || null,
            kind: m.kind,
            path: typeof location !== 'undefined' ? location.pathname : null,
          },
        });
      }
    };

    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);

  return null;
}
