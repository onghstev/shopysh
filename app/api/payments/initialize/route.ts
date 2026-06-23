export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';

// Initialize payment for an order via Paystack or Flutterwave
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;

    const body = await request.json();
    const { orderId, gateway = 'paystack', callbackUrl } = body ?? {};

    if (!orderId) return badRequest('Order ID is required');

    const order = await prisma.order.findFirst({
      where: { id: orderId, tenantId },
      include: { customer: true, tenant: true },
    });
    if (!order) return badRequest('Order not found');
    if (order.paymentStatus === 'PAID') return badRequest('Order is already paid');

    const origin = request.headers.get('origin') ?? process.env.NEXTAUTH_URL ?? '';
    const reference = `TK-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const amountInKobo = Math.round(Number(order.totalAmount) * 100);

    let paymentData: any = {};

    if (gateway === 'paystack') {
      const paystackKey = process.env.PAYSTACK_SECRET_KEY;
      if (!paystackKey) {
        // Return mock payment link for demo
        paymentData = {
          gateway: 'paystack',
          reference,
          authorizationUrl: `${origin}/orders/${orderId}?payment=demo&ref=${reference}`,
          accessCode: 'demo_access_code',
          status: 'demo',
          message: 'Paystack API key not configured. Using demo mode.',
        };
      } else {
        const res = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${paystackKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: order.customer?.email ?? `customer-${order.customerId}@tekhuna.ng`,
            amount: amountInKobo,
            currency: order.currency === 'NGN' ? 'NGN' : 'USD',
            reference,
            callback_url: callbackUrl ?? `${origin}/orders/${orderId}`,
            metadata: { orderId: order.id, tenantId, orderNumber: order.orderNumber },
          }),
        });
        const data = await res.json();
        if (!data.status) return badRequest(data?.message ?? 'Paystack initialization failed');
        paymentData = {
          gateway: 'paystack',
          reference,
          authorizationUrl: data.data.authorization_url,
          accessCode: data.data.access_code,
        };
      }
    } else if (gateway === 'flutterwave') {
      const flwKey = process.env.FLW_SECRET_KEY;
      if (!flwKey) {
        paymentData = {
          gateway: 'flutterwave',
          reference,
          paymentLink: `${origin}/orders/${orderId}?payment=demo&ref=${reference}`,
          status: 'demo',
          message: 'Flutterwave API key not configured. Using demo mode.',
        };
      } else {
        const res = await fetch('https://api.flutterwave.com/v3/payments', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${flwKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tx_ref: reference,
            amount: Number(order.totalAmount),
            currency: order.currency,
            redirect_url: callbackUrl ?? `${origin}/orders/${orderId}`,
            customer: {
              email: order.customer?.email ?? `customer-${order.customerId}@tekhuna.ng`,
              name: order.customer?.name ?? 'Customer',
              phonenumber: order.customer?.phone ?? '',
            },
            meta: { orderId: order.id, tenantId, orderNumber: order.orderNumber },
            customizations: {
              title: order.tenant?.name ?? 'SHOPYSH',
              description: `Payment for Order ${order.orderNumber}`,
            },
          }),
        });
        const data = await res.json();
        if (data.status !== 'success') return badRequest(data?.message ?? 'Flutterwave initialization failed');
        paymentData = {
          gateway: 'flutterwave',
          reference,
          paymentLink: data.data.link,
        };
      }
    } else {
      return badRequest('Invalid payment gateway. Use "paystack" or "flutterwave"');
    }

    // Create payment record
    await prisma.payment.create({
      data: {
        tenantId,
        orderId,
        paymentGateway: gateway,
        transactionReference: reference,
        amount: order.totalAmount,
        currency: order.currency,
        status: 'pending',
        payerEmail: order.customer?.email,
        payerPhone: order.customer?.phone,
      },
    });

    return NextResponse.json(paymentData);
  } catch (error: any) {
    return serverError(error);
  }
}
