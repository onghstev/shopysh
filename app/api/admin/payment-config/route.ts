export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import * as fs from 'fs';
import * as path from 'path';

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: (session.user as any).id }, select: { role: true } });
  if (user?.role !== 'SUPER_ADMIN') return null;
  return session;
}

// GET platform payment config
export async function GET() {
  try {
    const session = await requireSuperAdmin();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Read from env
    const config = {
      paystackSecretKey: process.env.PAYSTACK_SECRET_KEY ? '••••' + (process.env.PAYSTACK_SECRET_KEY.slice(-6)) : '',
      paystackPublicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
      flutterwaveSecretKey: process.env.FLW_SECRET_KEY ? '••••' + (process.env.FLW_SECRET_KEY.slice(-6)) : '',
      flutterwavePublicKey: process.env.NEXT_PUBLIC_FLW_PUBLIC_KEY || '',
      flutterwaveWebhookHash: process.env.FLW_WEBHOOK_HASH ? '••••' + (process.env.FLW_WEBHOOK_HASH.slice(-4)) : '',
      activeGateway: process.env.PLATFORM_PAYMENT_GATEWAY || 'paystack',
      hasPaystack: !!process.env.PAYSTACK_SECRET_KEY,
      hasFlutterwave: !!process.env.FLW_SECRET_KEY,
    };

    return NextResponse.json({ config });
  } catch (error: any) {
    console.error('Admin payment config fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
  }
}

// PATCH update platform payment config
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSuperAdmin();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const {
      paystackSecretKey, paystackPublicKey,
      flutterwaveSecretKey, flutterwavePublicKey, flutterwaveWebhookHash,
      activeGateway,
    } = body;

    // Update .env file
    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';
    try { envContent = fs.readFileSync(envPath, 'utf-8'); } catch { envContent = ''; }

    const updates: Record<string, string> = {};
    if (paystackSecretKey && !paystackSecretKey.startsWith('••')) updates['PAYSTACK_SECRET_KEY'] = paystackSecretKey;
    if (paystackPublicKey !== undefined) updates['NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY'] = paystackPublicKey;
    if (flutterwaveSecretKey && !flutterwaveSecretKey.startsWith('••')) updates['FLW_SECRET_KEY'] = flutterwaveSecretKey;
    if (flutterwavePublicKey !== undefined) updates['NEXT_PUBLIC_FLW_PUBLIC_KEY'] = flutterwavePublicKey;
    if (flutterwaveWebhookHash && !flutterwaveWebhookHash.startsWith('••')) updates['FLW_WEBHOOK_HASH'] = flutterwaveWebhookHash;
    if (activeGateway) updates['PLATFORM_PAYMENT_GATEWAY'] = activeGateway;

    for (const [key, value] of Object.entries(updates)) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}`;
      }
      // Also set in runtime
      process.env[key] = value;
    }

    fs.writeFileSync(envPath, envContent.trim() + '\n');

    return NextResponse.json({ message: 'Platform payment configuration updated. Redeploy required for production changes.' });
  } catch (error: any) {
    console.error('Admin payment config update error:', error);
    return NextResponse.json({ error: error?.message ?? 'Failed to update config' }, { status: 500 });
  }
}
