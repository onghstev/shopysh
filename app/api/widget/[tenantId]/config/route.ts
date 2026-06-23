export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { corsResponse, corsOptions, corsError } from '@/lib/widget-cors';

export async function OPTIONS() {
  return corsOptions();
}

// GET: Public endpoint — returns widget config for embedding
export async function GET(_req: NextRequest, { params }: { params: { tenantId: string } }) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: params.tenantId, isActive: true, deletedAt: null },
      select: {
        id: true,
        name: true,
        primaryColor: true,
        logoUrl: true,
        settings: true,
      },
    });

    if (!tenant) {
      return corsError('Business not found', 404);
    }

    const aiConfig = await prisma.aIConfig.findUnique({
      where: { tenantId: tenant.id },
      select: {
        assistantName: true,
        greetingMessage: true,
        assistantPersonality: true,
        responseTone: true,
      },
    });

    const settings = (tenant.settings as any) ?? {};

    return corsResponse({
      businessName: tenant.name,
      primaryColor: tenant.primaryColor || '#16a34a',
      logoUrl: tenant.logoUrl || null,
      assistantName: aiConfig?.assistantName || 'Chat Assistant',
      greetingMessage: aiConfig?.greetingMessage || `Hi there! 👋 Welcome to ${tenant.name}. How can we help you today?`,
      widgetPosition: settings.widgetPosition || 'bottom-right',
      widgetTitle: settings.widgetTitle || tenant.name,
    });
  } catch (error: any) {
    console.error('Widget config error:', error);
    return corsError('Internal server error', 500);
  }
}
