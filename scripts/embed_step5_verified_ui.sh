#!/usr/bin/env bash
set -euo pipefail

echo "=============================="
echo " Abando – Embed Verified UI   "
echo "=============================="

APP_DIR="abando-frontend/app"
EMBED_PAGE="${APP_DIR}/embedded/page.tsx"

if [ ! -f "${EMBED_PAGE}" ]; then
  echo "❌ ${EMBED_PAGE} not found. Are you on main with embed shell merged?"
  exit 1
fi

TS=$(date +"%Y%m%d_%H%M%S")
BACKUP="${APP_DIR}/embedded/_backup_page_${TS}.tsx"

echo "→ Backing up existing embedded/page.tsx to:"
echo "   ${BACKUP}"
cp "${EMBED_PAGE}" "${BACKUP}"

cat > "${EMBED_PAGE}" <<'TSX'
'use client';

import * as React from 'react';

type VerifyResponse =
  | { ok: true; shop: string | null; host?: string | null }
  | { ok: false; error: string };

export default function EmbeddedApp() {
  const [state, setState] = React.useState<
    'idle' | 'verifying' | 'verified' | 'error'
  >('idle');
  const [shop, setShop] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const run = async () => {
      setState('verifying');
      try {
        // Pass through the query string from the embedded context
        const search = window.location.search || '';
        const url = `/api/shopify/verify-embedded${search}`;
        const res = await fetch(url, { method: 'GET' });

        if (!res.ok) {
          setState('error');
          setError(`HTTP ${res.status}`);
          return;
        }

        const json = (await res.json()) as VerifyResponse;

        if ('ok' in json && json.ok) {
          setShop(json.shop ?? null);
          setState('verified');
        } else {
          setState('error');
          setError(
            'error' in json && json.error
              ? json.error
              : 'Verification failed.'
          );
        }
      } catch (err) {
        console.error('[Abando] verify-embedded failed', err);
        setState('error');
        setError('Network or server error.');
      }
    };

    void run();
  }, []);

  const subtitle =
    state === 'verified'
      ? 'This Abando instance is securely connected to your Shopify admin.'
      : 'This is the placeholder embedded surface for the Shopify admin.';

  return (
    <main
      style={{
        padding: '2.5rem 3rem',
        fontFamily:
          '-apple-system,BlinkMacSystemFont,system-ui,Segoe UI,Roboto,sans-serif',
      }}
    >
      <h1
        style={{
          fontSize: '2.25rem',
          fontWeight: 700,
          marginBottom: '0.75rem',
        }}
      >
        Embedded App (Temp Dev Page)
      </h1>

      <p style={{ fontSize: '1rem', marginBottom: '1.5rem' }}>{subtitle}</p>

      <section
        style={{
          padding: '1.25rem 1.5rem',
          borderRadius: '0.5rem',
          border: '1px solid #e5e7eb',
          maxWidth: '32rem',
          backgroundColor: '#f9fafb',
        }}
      >
        {state === 'verifying' && (
          <p style={{ margin: 0, fontSize: '0.95rem' }}>
            🔐 Verifying Shopify embedded session…
          </p>
        )}

        {state === 'verified' && (
          <div>
            <p style={{ margin: 0, fontSize: '0.95rem' }}>
              ✅ <strong>Verified Shopify context.</strong>
            </p>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.9rem' }}>
              Connected shop:{' '}
              <code style={{ fontSize: '0.85rem' }}>
                {shop ?? '(shop domain unknown)'}
              </code>
            </p>
          </div>
        )}

        {state === 'error' && (
          <div>
            <p style={{ margin: 0, fontSize: '0.95rem', color: '#b91c1c' }}>
              ❌ Could not verify embedded Shopify session.
            </p>
            {error && (
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem' }}>
                Details: <code>{error}</code>
              </p>
            )}
          </div>
        )}

        {state === 'idle' && (
          <p style={{ margin: 0, fontSize: '0.95rem' }}>
            Preparing verification…
          </p>
        )}
      </section>

      <p
        style={{
          marginTop: '1.5rem',
          fontSize: '0.8rem',
          color: '#9ca3af',
        }}
      >
        Abando – internal dev shell. Do not expose this page directly to
        merchants.
      </p>
    </main>
  );
}
TSX

echo
echo "✅ embed_step5_verified_ui.sh complete:"
echo "  - embedded/page.tsx now calls /api/shopify/verify-embedded"
echo "  - UI shows Verified / Error / Loading states"
