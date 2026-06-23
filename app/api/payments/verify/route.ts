export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;

    const body = await request.json();
    const { reference, gateway = 'paystack' } = body ?? {};

    if (!reference) return badRequest('Transaction reference is required');

    const payment = await prisma.payment.findFirst({
      where: { transactionReference: reference, tenantId },
    });
    if (!payment) return badRequest('Payment not found');
    if (payment.status === 'success') return NextResponse.json({ status: 'success', message: 'Payment already verified' });

    let verified = false;
    let gatewayResponse: any = null;

    if (gateway === 'paystack') {
      const paystackKey = process.env.PAYSTACK_SECRET_KEY;
      if (!paystackKey) {
        verified = true;
        gatewayResponse = { demo: true, message: 'Demo mode - payment auto-verified' };
      } else {
        const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
          headers: { Authorization: `Bearer ${paystackKey}` },
        });
        const data = await res.json();
        verified = data?.data?.status === 'success';
        gatewayResponse = data?.data;
      }
    } else if (gateway === 'flutterwave') {
      const flwKey = process.env.FLW_SECRET_KEY;
      if (!flwKey) {
        verified = true;
        gatewayResponse = { demo: true, message: 'Demo mode - payment auto-verified' };
      } else {
        const res = await fetch(`https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${reference}`, {
          headers: { Authorization: `Bearer ${flwKey}` },
        });
        const data = await res.json();
        verified = data?.data?.status === 'successful';
        gatewayResponse = data?.data;
      }
    }

    if (verified) {
      await prisma.$transaction(async (tx: any) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: 'success', gatewayResponse, paidAt: new Date() },
        });
        if (payment.orderId) {
          await tx.order.update({
            where: { id: payment.orderId },
            data: { paymentStatus: 'PAID', paidAt: new Date() },
          });
        }
      });
      return NextResponse.json({ status: 'success', message: 'Payment verified successfully' });
    }

    return NextResponse.json({ status: 'failed', message: 'Payment verification failed' }, { status: 400 });
  } catch (error: any) {
    return serverError(error);
  }
}
