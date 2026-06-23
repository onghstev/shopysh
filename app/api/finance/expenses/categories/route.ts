export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';

const DEFAULT_CATEGORIES = [
  { name: 'Rent & Utilities', icon: 'building', color: '#6366f1' },
  { name: 'Salaries & Wages', icon: 'users', color: '#8b5cf6' },
  { name: 'Inventory & Supplies', icon: 'package', color: '#f59e0b' },
  { name: 'Transportation', icon: 'truck', color: '#3b82f6' },
  { name: 'Marketing & Advertising', icon: 'megaphone', color: '#ec4899' },
  { name: 'Equipment & Maintenance', icon: 'wrench', color: '#14b8a6' },
  { name: 'Professional Services', icon: 'briefcase', color: '#f97316' },
  { name: 'Bank Charges & Fees', icon: 'landmark', color: '#64748b' },
  { name: 'Tax & Levies', icon: 'receipt', color: '#ef4444' },
  { name: 'Miscellaneous', icon: 'more-horizontal', color: '#a1a1aa' },
];

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;

    let categories = await prisma.expenseCategory.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });

    // Seed default categories if none exist
    if (categories.length === 0) {
      await prisma.expenseCategory.createMany({
        data: DEFAULT_CATEGORIES.map(c => ({ ...c, tenantId, isDefault: true })),
        skipDuplicates: true,
      });
      categories = await prisma.expenseCategory.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
    }

    return NextResponse.json(categories);
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const { name, icon, color } = await req.json();
    if (!name) return badRequest('Name is required');

    const category = await prisma.expenseCategory.create({
      data: { tenantId: session.user.tenantId, name, icon: icon || null, color: color || null },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (e) { return serverError(e); }
}
