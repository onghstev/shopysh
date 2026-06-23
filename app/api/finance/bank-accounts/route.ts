export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const accounts = await prisma.bankAccount.findMany({ where: { tenantId: session.user.tenantId, isActive: true }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(accounts);
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const { bankName, accountName, accountNumber, accountType, balance, isDefault } = await req.json();
    if (!bankName || !accountName || !accountNumber) return badRequest('Bank name, account name and number are required');

    if (isDefault) {
      await prisma.bankAccount.updateMany({ where: { tenantId: session.user.tenantId }, data: { isDefault: false } });
    }

    const account = await prisma.bankAccount.create({
      data: { tenantId: session.user.tenantId, bankName, accountName, accountNumber, accountType: accountType || 'current', balance: balance ? parseFloat(balance) : 0, isDefault: isDefault || false },
    });
    return NextResponse.json(account, { status: 201 });
  } catch (e) { return serverError(e); }
}
