export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { isActive } = body;

    const tenant = await prisma.tenant.update({
      where: { id: params.id },
      data: { isActive },
    });

    return NextResponse.json({ tenant });
  } catch (error) {
    console.error('Admin tenant update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
