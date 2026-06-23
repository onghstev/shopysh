/**
 * Custom PrismaAdapter for multi-tenant schema.
 * 
 * The default @next-auth/prisma-adapter calls prisma.user.findUnique({ where: { email } }),
 * which fails when email is not a standalone unique field (our schema uses a compound
 * unique on [email, tenantId]). This adapter overrides getUserByEmail to use findFirst.
 */

import { PrismaAdapter } from '@next-auth/prisma-adapter';
import type { PrismaClient } from '@prisma/client';
import type { Adapter } from 'next-auth/adapters';

export function CustomPrismaAdapter(prisma: PrismaClient): Adapter {
  const baseAdapter = PrismaAdapter(prisma);

  return {
    ...baseAdapter,

    // Override getUserByEmail to use findFirst instead of findUnique
    // since email is only unique per tenant (compound unique [email, tenantId])
    getUserByEmail: async (email: string) => {
      const user = await prisma.user.findFirst({
        where: { email },
      });
      return user as any;
    },

    // Override createUser to handle multi-tenant requirements.
    // When Google SSO creates a user via the adapter, our signIn callback
    // has already created the user+tenant. This handles the edge case
    // where the adapter tries to create a user that doesn't exist yet.
    createUser: async (data: any) => {
      // Check if user already exists (created by our signIn callback)
      const existing = await prisma.user.findFirst({
        where: { email: data.email },
      });
      if (existing) return existing as any;

      // This shouldn't normally happen since our signIn callback creates users,
      // but as a safety net, throw a clear error.
      throw new Error(
        `User creation via adapter not supported. User should be created in signIn callback.`
      );
    },

    // Override getUser to handle the standard id lookup
    getUser: async (id: string) => {
      const user = await prisma.user.findUnique({ where: { id } });
      return user as any;
    },

    // Override getUserByAccount to find user linked to an OAuth account
    getUserByAccount: async ({ provider, providerAccountId }: { provider: string; providerAccountId: string }) => {
      const account = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: { provider, providerAccountId },
        },
        include: { user: true },
      });
      return (account?.user as any) ?? null;
    },

    // Override linkAccount to create the OAuth account link
    linkAccount: async (data: any) => {
      const account = await prisma.account.create({ data });
      return account as any;
    },
  };
}
