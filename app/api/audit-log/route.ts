export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorized, serverError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;

    const { searchParams } = new URL(req.url);
    const page     = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const entity   = searchParams.get('entity');
    const search   = searchParams.get('search');
    const from     = searchParams.get('from');
    const to       = searchParams.get('to');

    const where: any = { tenantId };
    if (entity)  where.entity = entity;
    if (search)  where.OR = [
      { summary:  { contains: search, mode: 'insensitive' } },
      { userName: { contains: search, mode: 'insensitive' } },
      { action:   { contains: search, mode: 'insensitive' } },
    ];
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to)   where.createdAt.lte = new Date(to + 'T23:59:59Z');
    }

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * pageSize,
        take:    pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({ items, total, page, pageSize });
  } catch (e) { return serverError(e); }
}
