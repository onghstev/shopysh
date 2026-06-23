export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthSession, unauthorized, serverError } from '@/lib/api-helpers';

// GET tenant payment config
export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { settings: true },
    });

    const settings = (tenant?.settings as any) ?? {};
    const paymentConfig = settings?.paymentConfig ?? {};

    return NextResponse.json({
      config: {
        gateway: paymentConfig.gateway || 'paystack',
        paystackSecretKey: paymentConfig.paystackSecretKey ? '••••' + paymentConfig.paystackSecretKey.slice(-6) : '',
        paystackPublicKey: paymentConfig.paystackPublicKey || '',
        flutterwaveSecretKey: paymentConfig.flutterwaveSecretKey ? '••••' + paymentConfig.flutterwaveSecretKey.slice(-6) : '',
        flutterwavePublicKey: paymentConfig.flutterwavePublicKey || '',
        flutterwaveWebhookHash: paymentConfig.flutterwaveWebhookHash ? '••••' + paymentConfig.flutterwaveWebhookHash.slice(-4) : '',
        hasPaystack: !!paymentConfig.paystackSecretKey,
        hasFlutterwave: !!paymentConfig.flutterwaveSecretKey,
        bankName: paymentConfig.bankName || '',
        accountNumber: paymentConfig.accountNumber || '',
        accountName: paymentConfig.accountName || '',
      },
    });
  } catch (error: any) {
    return serverError(error);
  }
}

// PATCH update tenant payment config
export async function PATCH(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (!user || !['TENANT_ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Only admins can update payment settings' }, { status: 403 });
    }

    const body = await request.json();
    const {
      gateway, paystackSecretKey, paystackPublicKey,
      flutterwaveSecretKey, flutterwavePublicKey, flutterwaveWebhookHash,
      bankName, accountNumber, accountName,
    } = body;

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { settings: true },
    });

    const currentSettings = (tenant?.settings as any) ?? {};
    const currentPayment = currentSettings?.paymentConfig ?? {};

    const updatedPaymentConfig: Record<string, any> = {
      ...currentPayment,
      gateway: gateway || currentPayment.gateway || 'paystack',
    };

    // Only update secrets if they don't start with masked characters
    if (paystackSecretKey && !paystackSecretKey.startsWith('••')) updatedPaymentConfig.paystackSecretKey = paystackSecretKey;
    if (paystackPublicKey !== undefined) updatedPaymentConfig.paystackPublicKey = paystackPublicKey;
    if (flutterwaveSecretKey && !flutterwaveSecretKey.startsWith('••')) updatedPaymentConfig.flutterwaveSecretKey = flutterwaveSecretKey;
    if (flutterwavePublicKey !== undefined) updatedPaymentConfig.flutterwavePublicKey = flutterwavePublicKey;
    if (flutterwaveWebhookHash && !flutterwaveWebhookHash.startsWith('••')) updatedPaymentConfig.flutterwaveWebhookHash = flutterwaveWebhookHash;
    if (bankName !== undefined) updatedPaymentConfig.bankName = bankName;
    if (accountNumber !== undefined) updatedPaymentConfig.accountNumber = accountNumber;
    if (accountName !== undefined) updatedPaymentConfig.accountName = accountName;

    await prisma.tenant.update({
      where: { id: session.user.tenantId },
      data: {
        settings: {
          ...currentSettings,
          paymentConfig: updatedPaymentConfig,
        },
      },
    });

    return NextResponse.json({ message: 'Payment configuration updated successfully' });
  } catch (error: any) {
    return serverError(error);
  }
}
