export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const flwWebhookHash = process.env.FLW_WEBHOOK_HASH;

    // Verify webhook hash
    if (flwWebhookHash) {
      const signature = request.headers.get('verif-hash');
      if (signature !== flwWebhookHash) {
        console.error('Flutterwave webhook: Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    console.log('Flutterwave webhook event:', body.event);

    if (body.event === 'charge.completed' && body.data?.status === 'successful') {
      const txRef = body.data.tx_ref;

      const payment = await prisma.payment.findFirst({
        where: { transactionReference: txRef },
      });

      if (payment && payment.status !== 'success') {
        await prisma.$transaction(async (tx: any) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: { status: 'success', gatewayResponse: body.data, paidAt: new Date(), paymentMethod: body.data.payment_type },
          });
          if (payment.orderId) {
            await tx.order.update({
              where: { id: payment.orderId },
              data: { paymentStatus: 'PAID', paymentMethod: body.data.payment_type, paidAt: new Date() },
            });
          }
        });
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error('Flutterwave webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
