export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { businessName, industry, phone, email, address, city, country, planId, billingCycle, paymentMethod } = body;

    if (!businessName || !planId) {
      return NextResponse.json({ error: 'Business name and plan are required' }, { status: 400 });
    }

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    const tenantId = session.user.tenantId;
    const cycle = billingCycle === 'yearly' ? 'yearly' : 'monthly';
    const priceAmount = cycle === 'yearly' ? plan.priceNgnYearly : plan.priceNgnMonthly;

    await prisma.$transaction(async (tx: any) => {
      // Get current tenant settings to merge
      const currentTenant = await tx.tenant.findUnique({ where: { id: tenantId }, select: { settings: true } });
      const currentSettings = (currentTenant?.settings && typeof currentTenant.settings === 'object') ? currentTenant.settings : {};

      // Update tenant business info
      await tx.tenant.update({
        where: { id: tenantId },
        data: {
          name: businessName,
          industry: industry || null,
          phone: phone || null,
          email: email || null,
          address: [address, city, country].filter(Boolean).join(', ') || null,
          onboardingComplete: true,
          settings: {
            ...currentSettings,
            preferredPaymentMethod: paymentMethod || 'online',
          },
        },
      });

      // Check if subscription already exists
      const existingSub = await tx.subscription.findUnique({ where: { tenantId } });

      const now = new Date();
      const periodEnd = cycle === 'yearly'
        ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
        : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const paymentGw = paymentMethod === 'bank_transfer' ? 'bank_transfer' : 'online';

      if (existingSub) {
        await tx.subscription.update({
          where: { tenantId },
          data: {
            planId: plan.id,
            status: 'active',
            billingCycle: cycle,
            priceAmount,
            currency: 'NGN',
            paymentGateway: paymentGw,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
          },
        });
      } else {
        await tx.subscription.create({
          data: {
            tenantId,
            planId: plan.id,
            status: 'active',
            billingCycle: cycle,
            priceAmount,
            currency: 'NGN',
            paymentGateway: paymentGw,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            trialEndsAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
          },
        });
      }

      // Ensure AI config exists
      const existingConfig = await tx.aIConfig.findUnique({ where: { tenantId } });
      if (!existingConfig) {
        await tx.aIConfig.create({
          data: {
            tenantId,
            assistantName: `${businessName} AI Assistant`,
            responseTone: 'friendly',
            enableNigerianContext: true,
            autoReplyEnabled: true,
            greetingMessage: `Hello! Welcome to ${businessName}. How can I help you today?`,
          },
        });
      }
    });

    return NextResponse.json({ message: 'Onboarding completed successfully' });
  } catch (error: any) {
    console.error('Onboarding error:', error);
    return NextResponse.json({ error: error?.message ?? 'Failed to complete onboarding' }, { status: 500 });
  }
}

// GET: Check onboarding status
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { onboardingComplete: true, name: true, industry: true, phone: true, email: true, address: true },
    });

    return NextResponse.json({
      onboardingComplete: tenant?.onboardingComplete ?? false,
      tenant,
    });
  } catch (error: any) {
    console.error('Onboarding status error:', error);
    return NextResponse.json({ error: 'Failed to check onboarding status' }, { status: 500 });
  }
}
