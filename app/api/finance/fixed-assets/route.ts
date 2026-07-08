export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';

function generateAssetCode(category: string, count: number) {
  const prefix = category.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3).padEnd(3, 'X');
  return `${prefix}-${String(count + 1).padStart(4, '0')}`;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;
    const { searchParams } = new URL(req.url);
    const status   = searchParams.get('status');
    const category = searchParams.get('category');
    const page     = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const where: any = { tenantId, deletedAt: null };
    if (status)   where.status = status;
    if (category) where.category = category;

    const [items, total] = await Promise.all([
      prisma.fixedAsset.findMany({
        where,
        include: { depreciation: { orderBy: { periodNumber: 'desc' }, take: 1 } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.fixedAsset.count({ where }),
    ]);

    // Summary stats
    const allActive = await prisma.fixedAsset.findMany({
      where: { tenantId, deletedAt: null, status: 'active' },
      select: { purchaseCost: true, accumulatedDepreciation: true, bookValue: true },
    });
    const totalCost        = allActive.reduce((s, a) => s + Number(a.purchaseCost), 0);
    const totalAccumDep    = allActive.reduce((s, a) => s + Number(a.accumulatedDepreciation), 0);
    const totalBookValue   = allActive.reduce((s, a) => s + Number(a.bookValue), 0);

    return NextResponse.json({
      items: items.map((a: any) => ({
        ...a,
        purchaseCost:            Number(a.purchaseCost),
        residualValue:           Number(a.residualValue),
        accumulatedDepreciation: Number(a.accumulatedDepreciation),
        bookValue:               Number(a.bookValue),
        disposalValue:           a.disposalValue ? Number(a.disposalValue) : null,
      })),
      total, page, pageSize,
      summary: { totalCost, totalAccumDep, totalBookValue, count: allActive.length },
    });
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;
    const body = await req.json();
    const {
      name, description, category, purchaseDate, purchaseCost,
      residualValue, usefulLifeYears, depreciationMethod,
      location, serialNumber, currency, glAccountId,
    } = body;

    if (!name || !category || !purchaseDate || !purchaseCost || !usefulLifeYears) {
      return badRequest('Name, category, purchase date, cost and useful life are required');
    }
    if (Number(usefulLifeYears) < 1) return badRequest('Useful life must be at least 1 year');
    const cost      = parseFloat(purchaseCost);
    const residual  = parseFloat(residualValue ?? 0);
    if (residual >= cost) return badRequest('Residual value must be less than purchase cost');

    // Auto-generate asset code
    const existing = await prisma.fixedAsset.count({ where: { tenantId, category } });
    const assetCode = generateAssetCode(category, existing);

    const asset = await prisma.fixedAsset.create({
      data: {
        tenantId,
        assetCode,
        name,
        description:        description || null,
        category,
        purchaseDate:       new Date(purchaseDate),
        purchaseCost:       cost,
        residualValue:      residual,
        usefulLifeYears:    parseInt(usefulLifeYears),
        depreciationMethod: depreciationMethod || 'straight_line',
        accumulatedDepreciation: 0,
        bookValue:          cost,
        status:             'active',
        location:           location || null,
        serialNumber:       serialNumber || null,
        currency:           currency || 'NGN',
        glAccountId:        glAccountId || null,
      },
    });

    return NextResponse.json({
      ...asset,
      purchaseCost:  Number(asset.purchaseCost),
      residualValue: Number(asset.residualValue),
      bookValue:     Number(asset.bookValue),
    }, { status: 201 });
  } catch (e) { return serverError(e); }
}
