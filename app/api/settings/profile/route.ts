export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthSession, unauthorized, serverError } from '@/lib/api-helpers';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      include: {
        subscriptions: { include: { plan: true } },
      },
    });

    // Map DB fields to form field names and extract extras from settings JSON
    const settings = (tenant?.settings as any) ?? {};
    const profile = {
      ...tenant,
      businessName: tenant?.name ?? '',
      description: settings.description ?? '',
      city: settings.city ?? '',
      state: settings.state ?? '',
      country: settings.country ?? '',
      website: settings.website ?? '',
    };

    return NextResponse.json({ tenant: profile });
  } catch (error: any) {
    return serverError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();

    const body = await request.json();
    
    // Fetch current tenant to merge settings
    const current = await prisma.tenant.findUnique({ where: { id: session.user.tenantId } });
    const currentSettings = (current?.settings as any) ?? {};

    const data: any = {};
    // Map businessName -> name (DB column)
    if (body?.businessName !== undefined) data.name = body.businessName;
    if (body?.name !== undefined) data.name = body.name;
    if (body?.phone !== undefined) data.phone = body.phone;
    if (body?.email !== undefined) data.email = body.email;
    if (body?.address !== undefined) data.address = body.address;
    if (body?.defaultCurrency !== undefined) data.defaultCurrency = body.defaultCurrency;
    if (body?.timezone !== undefined) data.timezone = body.timezone;
    if (body?.industry !== undefined) data.industry = body.industry;

    // Store extra fields in settings JSON
    const settingsUpdate = { ...currentSettings };
    if (body?.description !== undefined) settingsUpdate.description = body.description;
    if (body?.city !== undefined) settingsUpdate.city = body.city;
    if (body?.state !== undefined) settingsUpdate.state = body.state;
    if (body?.country !== undefined) settingsUpdate.country = body.country;
    if (body?.website !== undefined) settingsUpdate.website = body.website;
    data.settings = settingsUpdate;

    const tenant = await prisma.tenant.update({
      where: { id: session.user.tenantId },
      data,
    });

    // Return mapped fields
    const mappedSettings = (tenant.settings as any) ?? {};
    const profile = {
      ...tenant,
      businessName: tenant.name,
      description: mappedSettings.description ?? '',
      city: mappedSettings.city ?? '',
      state: mappedSettings.state ?? '',
      country: mappedSettings.country ?? '',
      website: mappedSettings.website ?? '',
    };

    return NextResponse.json({ tenant: profile });
  } catch (error: any) {
    return serverError(error);
  }
}
