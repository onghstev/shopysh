import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { DashboardShell } from '@/components/layouts/dashboard-shell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  // Check if onboarding is complete
  const tenantId = (session.user as any)?.tenantId;
  if (tenantId) {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { onboardingComplete: true },
      });
      if (tenant && !tenant.onboardingComplete) {
        redirect('/onboarding');
      }
    } catch (e) {
      // If DB query fails, allow access rather than blocking
      console.error('Onboarding check error:', e);
    }
  }

  return <DashboardShell session={session}>{children}</DashboardShell>;
}
