export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorized, badRequest, notFound, serverError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';
import { postAssetDepreciation } from '@/lib/accounting/auto-post';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;

    const asset = await prisma.fixedAsset.findFirst({
      where: { id: params.id, tenantId, deletedAt: null },
      include: { depreciation: { orderBy: { periodNumber: 'asc' } } },
    });
    if (!asset) return notFound('Asset not found');

    return NextResponse.json({
      ...asset,
      purchaseCost:            Number(asset.purchaseCost),
      residualValue:           Number(asset.residualValue),
      accumulatedDepreciation: Number(asset.accumulatedDepreciation),
      bookValue:               Number(asset.bookValue),
      disposalValue:           asset.disposalValue ? Number(asset.disposalValue) : null,
      depreciation:            asset.depreciation.map((d: any) => ({
        ...d, amount: Number(d.amount),
      })),
    });
  } catch (e) { return serverError(e); }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;

    const asset = await prisma.fixedAsset.findFirst({
      where: { id: params.id, tenantId, deletedAt: null },
    });
    if (!asset) return notFound('Asset not found');

    const body = await req.json();
    const { name, description, location, serialNumber, glAccountId } = body;

    const updated = await prisma.fixedAsset.update({
      where: { id: params.id },
      data: {
        name:         name         ?? asset.name,
        description:  description  ?? asset.description,
        location:     location     ?? asset.location,
        serialNumber: serialNumber ?? asset.serialNumber,
        glAccountId:  glAccountId  ?? asset.glAccountId,
      },
    });

    return NextResponse.json({
      ...updated,
      purchaseCost:            Number(updated.purchaseCost),
      residualValue:           Number(updated.residualValue),
      accumulatedDepreciation: Number(updated.accumulatedDepreciation),
      bookValue:               Number(updated.bookValue),
    });
  } catch (e) { return serverError(e); }
}

/** POST /api/finance/fixed-assets/[id]/depreciate — run one period of depreciation */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;

    const asset = await prisma.fixedAsset.findFirst({
      where: { id: params.id, tenantId, deletedAt: null },
      include: { depreciation: { orderBy: { periodNumber: 'desc' }, take: 1 } },
    });
    if (!asset) return notFound('Asset not found');
    if (asset.status !== 'active') return badRequest('Only active assets can be depreciated');

    const body = await req.json();
    const action = body?.action;

    // ── Dispose asset ──────────────────────────────────────────────────────
    if (action === 'dispose') {
      const { disposalValue, disposedAt } = body;
      const updated = await prisma.fixedAsset.update({
        where: { id: params.id },
        data: {
          status:       'disposed',
          disposedAt:   disposedAt ? new Date(disposedAt) : new Date(),
          disposalValue: disposalValue != null ? parseFloat(disposalValue) : null,
        },
      });
      return NextResponse.json({
        ...updated,
        purchaseCost:            Number(updated.purchaseCost),
        accumulatedDepreciation: Number(updated.accumulatedDepreciation),
        bookValue:               Number(updated.bookValue),
        disposalValue:           updated.disposalValue ? Number(updated.disposalValue) : null,
      });
    }

    // ── Run one period of depreciation ─────────────────────────────────────
    const cost         = Number(asset.purchaseCost);
    const residual     = Number(asset.residualValue);
    const accumDep     = Number(asset.accumulatedDepreciation);
    const bookValue    = Number(asset.bookValue);
    const depreciable  = cost - residual;
    const lastPeriod   = asset.depreciation[0]?.periodNumber ?? 0;
    const totalPeriods = asset.usefulLifeYears * 12; // monthly periods

    if (accumDep >= depreciable || bookValue <= residual) {
      return badRequest('Asset is fully depreciated');
    }

    let periodAmount: number;
    if (asset.depreciationMethod === 'straight_line') {
      periodAmount = depreciable / totalPeriods;
    } else {
      // Reducing balance: annual rate = 1 - (residual/cost)^(1/years), applied monthly
      const annualRate  = 1 - Math.pow(residual / cost, 1 / asset.usefulLifeYears);
      const monthlyRate = annualRate / 12;
      periodAmount      = bookValue * monthlyRate;
    }

    // Don't overshoot residual
    periodAmount = Math.min(periodAmount, bookValue - residual);
    periodAmount = Math.round(periodAmount * 100) / 100;

    if (periodAmount <= 0) return badRequest('Asset is fully depreciated');

    const depreciationDate = body?.depreciationDate ? new Date(body.depreciationDate) : new Date();
    const newPeriod        = lastPeriod + 1;
    const newAccum         = accumDep + periodAmount;
    const newBookValue     = cost - newAccum;

    // Write depreciation record + update asset in a transaction
    const [depRecord] = await prisma.$transaction([
      prisma.assetDepreciation.create({
        data: {
          assetId:         asset.id,
          tenantId,
          periodNumber:    newPeriod,
          depreciationDate,
          amount:          periodAmount,
        },
      }),
      prisma.fixedAsset.update({
        where: { id: params.id },
        data: {
          accumulatedDepreciation: newAccum,
          bookValue:               newBookValue,
        },
      }),
    ]);

    // Post to GL (silently ignores if CoA not set up)
    await postAssetDepreciation({
      tenantId,
      assetId:    asset.id,
      assetName:  asset.name,
      amount:     periodAmount,
      currency:   asset.currency,
      entryDate:  depreciationDate,
      journalEntryId: undefined,
    });

    return NextResponse.json({
      periodNumber:    newPeriod,
      amount:          periodAmount,
      newAccumDep:     newAccum,
      newBookValue,
      depreciationId:  depRecord.id,
    });
  } catch (e) { return serverError(e); }
}

/** Soft-delete */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;

    const asset = await prisma.fixedAsset.findFirst({
      where: { id: params.id, tenantId, deletedAt: null },
    });
    if (!asset) return notFound('Asset not found');

    await prisma.fixedAsset.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: 'Asset deleted' });
  } catch (e) { return serverError(e); }
}
