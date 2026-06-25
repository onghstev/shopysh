export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { sendEmail, verifyEmailConfig, isEmailConfigured } from '@/lib/email';
import { prisma } from '@/lib/db';

export async function GET() {
  return NextResponse.json({ configured: isEmailConfigured() });
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const verify = await verifyEmailConfig();
    if (!verify.ok) {
      return NextResponse.json({ error: `SMTP connection failed: ${verify.error}` }, { status: 500 });
    }

    const email = session.user.email;
    if (!email) return NextResponse.json({ error: 'Your account has no email address' }, { status: 400 });

    const tenant = await prisma.tenant.findUnique({
      where: { id: (session.user as any).tenantId },
      select: { name: true },
    });

    const result = await sendEmail({
      to: email,
      subject: `✅ Shopysh Email Test — ${new Date().toLocaleTimeString()}`,
      headline: 'Your email is working!',
      body: `Hi ${session.user.name ?? 'there'},\n\nThis is a test message confirming that your Shopysh email configuration is set up correctly.\n\nYour marketing campaign emails will use this same channel to reach your customers.\n\n— The Shopysh Team`,
      senderName: tenant?.name ?? 'Shopysh',
      preheader: 'Email delivery confirmed.',
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ message: `Test email sent to ${email}` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
