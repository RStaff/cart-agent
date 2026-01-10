import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const SHOPIFY_API_SECRET_RAW =
  process.env.SHOPIFY_API_SECRET ||
  process.env.SHOPIFY_API_SECRET_KEY ||
  process.env.SHOPIFY_API_SECRET_VALUE;

// Guard against accidental whitespace/newlines in env var values.
const SHOPIFY_API_SECRET = SHOPIFY_API_SECRET_RAW?.trim();

if (!SHOPIFY_API_SECRET) {
  console.warn(
    '[Abando] SHOPIFY_API_SECRET is not set; embedded verification will always fail.'
  );
}

export async function GET(req: NextRequest) {
  try {
    if (!SHOPIFY_API_SECRET) {
      return NextResponse.json(
        { ok: false, error: 'Server misconfiguration: missing Shopify secret.' },
        { status: 500 }
      );
    }

    const url = new URL(req.url);
    const searchParams = url.searchParams;

    const hmac = searchParams.get('hmac');
    const shop = searchParams.get('shop');
    const timestamp = searchParams.get('timestamp');

    if (!hmac || !shop || !timestamp) {
      return NextResponse.json(
        { ok: false, error: 'Missing required Shopify parameters.' },
        { status: 200 }
      );
    }

    // Build the message from all params except hmac/signature, sorted lexicographically
    const message = [...searchParams.entries()]
      .filter(([key]) => key !== 'hmac' && key !== 'signature')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    const digest = crypto
      .createHmac('sha256', SHOPIFY_API_SECRET)
      .update(message)
      .digest('hex');

    if (digest !== hmac) {
      return NextResponse.json(
        { ok: false, error: 'Invalid HMAC. Request not trusted.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      shop,
      host: searchParams.get('host') ?? undefined,
    });
  } catch (err) {
    console.error('[Abando] Error in /api/shopify/verify-embedded:', err);
    return NextResponse.json(
      { ok: false, error: 'Unexpected server error.' },
      { status: 500 }
    );
  }
}
