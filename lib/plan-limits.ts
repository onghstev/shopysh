import { prisma } from '@/lib/db';

export type LimitResource = 'products' | 'team_members' | 'broadcasts_monthly' | 'ai_conversations';

export interface LimitCheck {
  allowed: boolean;
  limit: number;    // -1 = unlimited
  current: number;
  message: string;
}

// -1 means unlimited; 0 means none allowed
function isUnlimited(limit: number) {
  return limit < 0;
}

export async function checkPlanLimit(
  tenantId: string,
  resource: LimitResource,
): Promise<LimitCheck> {
  const subscription = await prisma.subscription.findUnique({
    where: { tenantId },
    select: {
      status: true,
      currentPeriodStart: true,
      plan: {
        select: {
          maxProducts: true,
          maxUsers: true,
          maxBroadcastsMonthly: true,
          maxAiConversations: true,
        },
      },
    },
  });

  // No subscription → block with a clear message
  if (!subscription || subscription.status !== 'active') {
    return {
      allowed: false,
      limit: 0,
      current: 0,
      message: 'No active subscription. Please subscribe to a plan to continue.',
    };
  }

  const plan = subscription.plan;

  switch (resource) {
    case 'products': {
      const limit = plan.maxProducts;
      if (isUnlimited(limit)) return { allowed: true, limit, current: 0, message: '' };
      const current = await prisma.product.count({ where: { tenantId, deletedAt: null } });
      if (current >= limit) {
        return { allowed: false, limit, current, message: `Your plan allows a maximum of ${limit} products. You have ${current}. Upgrade your plan to add more.` };
      }
      return { allowed: true, limit, current, message: '' };
    }

    case 'team_members': {
      const limit = plan.maxUsers;
      if (isUnlimited(limit)) return { allowed: true, limit, current: 0, message: '' };
      const current = await prisma.user.count({ where: { tenantId, deletedAt: null, isActive: true } });
      if (current >= limit) {
        return { allowed: false, limit, current, message: `Your plan allows a maximum of ${limit} team member${limit === 1 ? '' : 's'}. You have ${current}. Upgrade your plan to add more.` };
      }
      return { allowed: true, limit, current, message: '' };
    }

    case 'broadcasts_monthly': {
      const limit = plan.maxBroadcastsMonthly;
      if (isUnlimited(limit)) return { allowed: true, limit, current: 0, message: '' };
      if (limit === 0) {
        return { allowed: false, limit, current: 0, message: 'Your plan does not include campaign broadcasts. Upgrade your plan to send campaigns.' };
      }
      const periodStart = subscription.currentPeriodStart;
      const current = await prisma.campaign.count({
        where: { tenantId, status: { in: ['sending', 'completed'] }, createdAt: { gte: periodStart } },
      });
      if (current >= limit) {
        return { allowed: false, limit, current, message: `Your plan allows ${limit} broadcast campaign${limit === 1 ? '' : 's'} per billing period. You have used ${current}. Upgrade to send more.` };
      }
      return { allowed: true, limit, current, message: '' };
    }

    case 'ai_conversations': {
      const limit = plan.maxAiConversations;
      if (isUnlimited(limit)) return { allowed: true, limit, current: 0, message: '' };
      const periodStart = subscription.currentPeriodStart;
      const current = await prisma.conversation.count({
        where: { tenantId, createdAt: { gte: periodStart } },
      });
      if (current >= limit) {
        return { allowed: false, limit, current, message: `Your plan allows ${limit} AI conversation${limit === 1 ? '' : 's'} per billing period. You have used ${current}. Upgrade your plan to continue.` };
      }
      return { allowed: true, limit, current, message: '' };
    }

    default:
      return { allowed: true, limit: -1, current: 0, message: '' };
  }
}
