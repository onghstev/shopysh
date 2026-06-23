export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Centralized Google OAuth initiation for ALL storefront customers.
// Single redirect URI works for all tenants — slug is passed via state param.
export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get('slug');
    if (!slug) {
      return NextResponse.json({ error: 'Missing store slug' }, { status: 400 });
    }

    // Verify store exists
    const store = await prisma.tenant.findFirst({
      where: { subdomain: slug, isActive: true },
      select: { id: true },
    });
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({ error: 'Google SSO not configured' }, { status: 500 });
    }

    // Single callback URL for all tenants — use forwarded host to get public URL
    const forwardedHost = req.headers.get('x-forwarded-host') || req.headers.get('host');
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    const baseUrl = forwardedHost ? `${protocol}://${forwardedHost}` : process.env.NEXTAUTH_URL!;
    const redirectUri = `${baseUrl}/api/store/auth/google/callback`;

    // State contains slug + storeId — survives the OAuth round-trip
    const state = Buffer.from(JSON.stringify({ slug, storeId: store.id })).toString('base64url');

    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', clientId);
    googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('scope', 'openid email profile');
    googleAuthUrl.searchParams.set('state', state);
    googleAuthUrl.searchParams.set('access_type', 'online');
    googleAuthUrl.searchParams.set('prompt', 'select_account');

    return NextResponse.redirect(googleAuthUrl.toString());
  } catch (err) {
    console.error('[Customer Google Auth] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
