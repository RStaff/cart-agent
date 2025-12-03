'use client';

import { useEffect, useState } from 'react';

type Status = 'loading' | 'ok' | 'error';

interface VerifyResponse {
  ok: boolean;
  shop?: string;
  host?: string;
  error?: string;
}

export default function EmbeddedPage() {
  const [status, setStatus] = useState<Status>('loading');
  const [shop, setShop] = useState<string | undefined>();
  const [message, setMessage] = useState<string | undefined>();

  useEffect(() => {
    const search = window.location.search;
    if (!search) {
      setStatus('error');
      setMessage('Missing Shopify query string.');
      return;
    }

    const url = `/api/shopify/verify-embedded${search}`;

    fetch(url)
      .then(async (res) => {
        const data: VerifyResponse = await res.json();
        if (!res.ok || !data.ok) {
          setStatus('error');
          setMessage(data.error || 'Shopify verification failed.');
          return;
        }
        setShop(data.shop);
        setStatus('ok');
      })
      .catch((err: unknown) => {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Network error.');
      });
  }, []);

  if (status === 'loading') {
    return (
      <main style={{ padding: '2rem' }}>
        <h1>Embedded App (Checking Session)</h1>
        <p>Verifying your Shopify session…</p>
      </main>
    );
  }

  if (status === 'error') {
    return (
      <main style={{ padding: '2rem' }}>
        <h1>Embedded App – Auth Error</h1>
        <p style={{ color: 'red' }}>
          {message || 'Unable to verify this request from Shopify.'}
        </p>
        <p style={{ marginTop: '1rem' }}>
          Try re-opening the app from your Shopify admin. If this continues,
          contact support.
        </p>
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Embedded App (Temp Dev Page)</h1>
      <p>This request has been verified as coming from Shopify.</p>
      {shop && (
        <p style={{ marginTop: '1rem' }}>
          <strong>Shop:</strong> {shop}
        </p>
      )}
      <p style={{ marginTop: '1.5rem', fontStyle: 'italic' }}>
        Next step: replace this shell with the real Abando command center UI.
      </p>
    </main>
  );
}
