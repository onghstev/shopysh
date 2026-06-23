export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorized, serverError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenant = await prisma.tenant.findUnique({ where: { id: session.user.tenantId }, select: { settings: true } });
    const settings = (tenant?.settings as any) ?? {};
    return NextResponse.json({ config: settings.smsConfig ?? {} });
  } catch (error: any) {
    return serverError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const body = await request.json();
    const { provider, termiiApiKey, termiiSenderId, africastalkingApiKey, africastalkingUsername, africastalkingSenderId } = body ?? {};

    const tenant = await prisma.tenant.findUnique({ where: { id: session.user.tenantId }, select: { settings: true } });
    const settings = (tenant?.settings as any) ?? {};

    settings.smsConfig = {
      provider: provider || 'termii',
      termiiApiKey: termiiApiKey || '',
      termiiSenderId: termiiSenderId || '',
      africastalkingApiKey: africastalkingApiKey || '',
      africastalkingUsername: africastalkingUsername || '',
      africastalkingSenderId: africastalkingSenderId || '',
    };

    await prisma.tenant.update({
      where: { id: session.user.tenantId },
      data: { settings },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return serverError(error);
  }
}
