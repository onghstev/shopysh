export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorized, badRequest, notFound, serverError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';

async function sendSms(phone: string, message: string, smsConfig: any): Promise<{ success: boolean; error?: string }> {
  try {
    const provider = smsConfig?.provider || 'termii';

    if (provider === 'termii') {
      const apiKey = smsConfig?.termiiApiKey;
      if (!apiKey) return { success: false, error: 'Termii API key not configured' };

      const res = await fetch('https://api.ng.termii.com/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: phone,
          from: smsConfig?.termiiSenderId || 'N-Alert',
          sms: message,
          type: 'plain',
          channel: 'generic',
          api_key: apiKey,
        }),
      });
      const data = await res.json();
      if (data?.code === 'ok' || res.ok) return { success: true };
      return { success: false, error: data?.message || 'Termii send failed' };
    }

    if (provider === 'africastalking') {
      const apiKey = smsConfig?.africastalkingApiKey;
      const username = smsConfig?.africastalkingUsername;
      if (!apiKey || !username) return { success: false, error: 'Africa\'s Talking credentials not configured' };

      const params = new URLSearchParams({
        username,
        to: phone,
        message,
        ...(smsConfig?.africastalkingSenderId ? { from: smsConfig.africastalkingSenderId } : {}),
      });

      const res = await fetch('https://api.africastalking.com/version1/messaging', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'apiKey': apiKey,
          'Accept': 'application/json',
        },
        body: params.toString(),
      });
      const data = await res.json();
      const recipients = data?.SMSMessageData?.Recipients;
      if (recipients && recipients.length > 0 && recipients[0]?.statusCode === 101) return { success: true };
      return { success: false, error: data?.SMSMessageData?.Message || 'AT send failed' };
    }

    return { success: false, error: `Unknown SMS provider: ${provider}` };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}


export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;

    const campaign = await prisma.campaign.findFirst({
      where: { id: params.id, tenantId },
    });
    if (!campaign) return notFound('Campaign not found');
    if (campaign.status === 'completed' || campaign.status === 'sending') {
      return badRequest(`Campaign is already ${campaign.status}`);
    }

    // Get tenant info and SMS config
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, settings: true },
    });
    const settings = (tenant?.settings as any) ?? {};
    const smsConfig = settings.smsConfig ?? {};

    const filter = campaign.segmentFilter as any;
    const channel = filter?.channel || 'both'; // 'sms', 'email', 'both'

    // Get target customers
    const customerWhere: any = { tenantId, deletedAt: null, isBlocked: false };
    if (filter?.segment) customerWhere.segment = filter.segment;

    const customers = await prisma.customer.findMany({
      where: customerWhere,
      select: { id: true, phone: true, name: true, email: true },
    });

    if (customers.length === 0) {
      return badRequest('No customers found matching the campaign target segment.');
    }

    // Create campaign messages
    const messages = customers.map((c: any) => ({
      campaignId: campaign.id,
      customerId: c.id,
      messageText: campaign.messageTemplate.replace('{{name}}', c.name ?? 'Customer'),
      status: 'queued',
    }));
    await prisma.campaignMessage.createMany({ data: messages });

    // Update campaign status to sending
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: 'sending', targetCustomerCount: customers.length },
    });

    let sentCount = 0;
    let failedCount = 0;
    const results: { sms: number; email: number; smsFailed: number; emailFailed: number } = {
      sms: 0, email: 0, smsFailed: 0, emailFailed: 0,
    };

    for (const customer of customers) {
      const personalizedMsg = campaign.messageTemplate.replace('{{name}}', customer.name ?? 'Customer');
      let customerSent = false;

      try {
        // Send SMS
        if ((channel === 'sms' || channel === 'both') && customer.phone && !customer.phone.startsWith('webchat-')) {
          const smsResult = await sendSms(customer.phone, personalizedMsg, smsConfig);
          if (smsResult.success) {
            results.sms++;
            customerSent = true;
          } else {
            results.smsFailed++;
            console.warn(`SMS failed for ${customer.phone}: ${smsResult.error}`);
          }
        }

        // Send Email
        if ((channel === 'email' || channel === 'both') && customer.email) {
          const emailResult = await sendEmail({
            to: customer.email,
            subject: `${campaign.name} — ${tenant?.name || 'Store'}`,
            headline: campaign.name,
            body: personalizedMsg,
            senderName: tenant?.name || 'Store',
          });
          if (emailResult.success) {
            results.email++;
            customerSent = true;
          } else {
            results.emailFailed++;
            console.warn(`Email failed for ${customer.email}: ${emailResult.error}`);
          }
        }

        if (customerSent) {
          sentCount++;
          await prisma.campaignMessage.updateMany({
            where: { campaignId: campaign.id, customerId: customer.id },
            data: { status: 'sent', sentAt: new Date() },
          });
        } else {
          failedCount++;
          await prisma.campaignMessage.updateMany({
            where: { campaignId: campaign.id, customerId: customer.id },
            data: { status: 'failed', errorMessage: 'No valid channel for customer' },
          });
        }
      } catch (err: any) {
        console.error(`Campaign send error for customer ${customer.id}:`, err);
        failedCount++;
        await prisma.campaignMessage.updateMany({
          where: { campaignId: campaign.id, customerId: customer.id },
          data: { status: 'failed', errorMessage: err.message },
        });
      }
    }

    // Mark campaign as completed
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        status: 'completed',
        sentCount,
        deliveredCount: sentCount,
        failedCount,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: `Campaign completed: ${sentCount} sent, ${failedCount} failed out of ${customers.length} customers`,
      details: {
        totalCustomers: customers.length,
        smsSuccess: results.sms,
        smsFailed: results.smsFailed,
        emailSuccess: results.email,
        emailFailed: results.emailFailed,
      },
      totalSent: sentCount,
      totalFailed: failedCount,
      totalCustomers: customers.length,
    });
  } catch (error: any) {
    return serverError(error);
  }
}
