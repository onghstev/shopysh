export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { signCustomerToken } from '@/lib/customer-auth';
import { generateCustomerCode } from '@/lib/generate-code';

function getPublicBaseUrl(req: NextRequest): string {
  const forwardedHost = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const protocol = req.headers.get('x-forwarded-proto') || 'https';
  return forwardedHost ? `${protocol}://${forwardedHost}` : process.env.NEXTAUTH_URL!;
}

// Centralized Google OAuth callback for ALL storefront customers.
// The store slug is recovered from the state parameter.
export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code');
    const stateParam = req.nextUrl.searchParams.get('state');
    const errorParam = req.nextUrl.searchParams.get('error');

    const publicBase = getPublicBaseUrl(req);

    // Decode state to recover slug
    let state: { slug: string; storeId: string };
    try {
      state = JSON.parse(Buffer.from(stateParam || '', 'base64url').toString());
    } catch {
      return NextResponse.redirect(`${publicBase}/store?error=invalid_state`);
    }

    const accountUrl = `${publicBase}/store/${state.slug}/account`;

    if (errorParam) {
      console.error('[Customer Google Callback] OAuth error:', errorParam);
      return NextResponse.redirect(`${accountUrl}?error=google_denied`);
    }

    if (!code) {
      return NextResponse.redirect(`${accountUrl}?error=missing_params`);
    }

    // Exchange code for tokens
    const redirectUri = `${publicBase}/api/store/auth/google/callback`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error('[Customer Google Callback] Token exchange failed:', errBody);
      return NextResponse.redirect(`${accountUrl}?error=token_exchange_failed`);
    }

    const tokenData = await tokenRes.json();

    // Get user info from Google
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userInfoRes.ok) {
      console.error('[Customer Google Callback] Failed to fetch user info');
      return NextResponse.redirect(`${accountUrl}?error=userinfo_failed`);
    }

    const googleUser = await userInfoRes.json();

    if (!googleUser.id || !googleUser.email) {
      return NextResponse.redirect(`${accountUrl}?error=no_email`);
    }

    const tenantId = state.storeId;

    // Try to find existing customer by googleId within this tenant
    let customer = await prisma.customer.findFirst({
      where: { googleId: googleUser.id, tenantId },
    });

    if (!customer) {
      // Try to find by email within this tenant
      customer = await prisma.customer.findFirst({
        where: { email: googleUser.email, tenantId, deletedAt: null },
      });

      if (customer) {
        // Link Google account to existing customer
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: {
            googleId: googleUser.id,
            name: customer.name || googleUser.name,
            profilePictureUrl: customer.profilePictureUrl || googleUser.picture,
          },
        });
      } else {
        // Create new customer
        const customerCode = await generateCustomerCode(tenantId);
        customer = await prisma.customer.create({
          data: {
            tenantId,
            customerCode,
            phone: `g-${googleUser.id}`,  // Unique placeholder since Google doesn't provide phone
            name: googleUser.name || googleUser.given_name || '',
            email: googleUser.email,
            googleId: googleUser.id,
            profilePictureUrl: googleUser.picture || null,
            acquisitionSource: 'google_sso',
            segment: 'New',
          },
        });
      }
    } else {
      // Update profile info if changed
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          name: customer.name || googleUser.name,
          email: customer.email || googleUser.email,
          profilePictureUrl: customer.profilePictureUrl || googleUser.picture,
        },
      });
    }

    // Issue customer JWT
    const jwt = signCustomerToken({
      customerId: customer.id,
      tenantId,
      phone: customer.phone,
      name: customer.name || undefined,
    });

    const customerPayload = {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      profilePictureUrl: customer.profilePictureUrl,
    };

    const authData = Buffer.from(JSON.stringify({ token: jwt, customer: customerPayload })).toString('base64url');

    return NextResponse.redirect(`${accountUrl}?auth=${authData}`);
  } catch (err) {
    console.error('[Customer Google Callback] Error:', err);
    // Try to recover slug from state for redirect
    try {
      const publicBase = getPublicBaseUrl(req);
      const stateParam = req.nextUrl.searchParams.get('state');
      const state = JSON.parse(Buffer.from(stateParam || '', 'base64url').toString());
      return NextResponse.redirect(`${publicBase}/store/${state.slug}/account?error=server_error`);
    } catch {
      const publicBase = getPublicBaseUrl(req);
      return NextResponse.redirect(`${publicBase}/store?error=server_error`);
    }
  }
}
