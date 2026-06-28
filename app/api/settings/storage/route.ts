export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getAuthSession, unauthorized, serverError } from '@/lib/api-helpers';
import { getTenantStorageBytes, getTenantStorageLimitMb, bytesToMb } from '@/lib/storage';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();

    const [usedBytes, limitMb] = await Promise.all([
      getTenantStorageBytes(session.user.tenantId),
      getTenantStorageLimitMb(session.user.tenantId),
    ]);

    const usedMb = bytesToMb(usedBytes);
    const percentUsed = limitMb > 0 ? Math.min(100, (usedMb / limitMb) * 100) : 0;

    return NextResponse.json({
      usedMb: parseFloat(usedMb.toFixed(2)),
      limitMb,
      percentUsed: parseFloat(percentUsed.toFixed(1)),
    });
  } catch (error: any) {
    return serverError(error);
  }
}
