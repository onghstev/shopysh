export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthSession, unauthorized, serverError } from '@/lib/api-helpers';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();

    const config = await prisma.aIConfig.findUnique({
      where: { tenantId: session.user.tenantId },
    });

    return NextResponse.json({ config });
  } catch (error: any) {
    return serverError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();

    const body = await request.json();
    const data: any = {};
    if (body?.assistantName !== undefined) data.assistantName = body.assistantName;
    if (body?.assistantPersonality !== undefined) data.assistantPersonality = body.assistantPersonality;
    if (body?.responseTone !== undefined) data.responseTone = body.responseTone;
    if (body?.enableNigerianContext !== undefined) data.enableNigerianContext = body.enableNigerianContext;
    if (body?.autoReplyEnabled !== undefined) data.autoReplyEnabled = body.autoReplyEnabled;
    if (body?.greetingMessage !== undefined) data.greetingMessage = body.greetingMessage;
    if (body?.awayMessage !== undefined) data.awayMessage = body.awayMessage;
    if (body?.fallbackMessage !== undefined) data.fallbackMessage = body.fallbackMessage;
    if (body?.confidenceThreshold !== undefined) data.confidenceThreshold = parseFloat(body.confidenceThreshold);

    const config = await prisma.aIConfig.upsert({
      where: { tenantId: session.user.tenantId },
      update: data,
      create: { tenantId: session.user.tenantId, ...data },
    });

    return NextResponse.json({ config });
  } catch (error: any) {
    return serverError(error);
  }
}
