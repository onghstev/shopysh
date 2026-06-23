export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const paystackKey = process.env.PAYSTACK_SECRET_KEY;

    // Verify webhook signature
    if (paystackKey) {
      const signature = request.headers.get('x-paystack-signature');
      const hash = crypto.createHmac('sha512', paystackKey).update(body).digest('hex');
      if (signature !== hash) {
        console.error('Paystack webhook: Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const event = JSON.parse(body);
    console.log('Paystack webhook event:', event.event);

    if (event.event === 'charge.success') {
      const data = event.data;
      const reference = data.reference;

      const payment = await prisma.payment.findFirst({
        where: { transactionReference: reference },
      });

      if (payment && payment.status !== 'success') {
        await prisma.$transaction(async (tx: any) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: { status: 'success', gatewayResponse: data, paidAt: new Date(), paymentMethod: data.channel },
          });
          if (payment.orderId) {
            await tx.order.update({
              where: { id: payment.orderId },
              data: { paymentStatus: 'PAID', paymentMethod: data.channel, paidAt: new Date() },
            });
          }
        });
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error('Paystack webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
