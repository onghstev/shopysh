import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { CustomPrismaAdapter } from '@/lib/prisma-adapter';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export const authOptions: NextAuthOptions = {
  adapter: CustomPrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          image: profile.picture,
          firstName: profile.given_name ?? profile.name?.split(' ')[0] ?? '',
          lastName: profile.family_name ?? profile.name?.split(' ').slice(1).join(' ') ?? '',
          tenantId: '',
          role: 'TENANT_ADMIN',
          tenantName: '',
          tenantCurrency: 'NGN',
        };
      },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const user = await prisma.user.findFirst({
          where: {
            email: credentials.email,
            deletedAt: null,
            isActive: true,
          },
          include: { tenant: true },
        });

        if (!user || !user.passwordHash) {
          throw new Error('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          tenantId: user.tenantId,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          tenantName: user?.tenant?.name ?? '',
          tenantCurrency: user?.tenant?.defaultCurrency ?? 'NGN',
        } as any;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          const email = user.email;
          if (!email) return false;
          // Check if user exists
          let existingUser = await prisma.user.findFirst({
            where: { email, deletedAt: null },
          });
          if (!existingUser) {
            // Create tenant + user for Google SSO sign-up
            const firstName = (user as any).firstName ?? user.name?.split(' ')[0] ?? 'User';
            const lastName = (user as any).lastName ?? user.name?.split(' ').slice(1).join(' ') ?? '';
            const businessName = `${firstName}'s Business`;
            const baseSlug = businessName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
            let subdomain = baseSlug;
            let counter = 2;
            while (await prisma.tenant.findUnique({ where: { subdomain } })) {
              subdomain = `${baseSlug}-${counter++}`;
            }
            const result = await prisma.$transaction(async (tx: any) => {
              const tenant = await tx.tenant.create({
                data: { name: businessName, subdomain, defaultCurrency: 'NGN', isActive: true, onboardingComplete: false, trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
              });
              const newUser = await tx.user.create({
                data: { tenantId: tenant.id, email, firstName, lastName, role: 'TENANT_ADMIN', isActive: true, emailVerified: true, image: user.image, name: user.name },
              });
              // NOTE: Subscription is NOT created here — user must complete onboarding flow
              return { tenant, user: newUser };
            });
            (user as any).id = result.user.id;
          } else {
            (user as any).id = existingUser.id;
          }
          return true;
        } catch (error) {
          console.error('Google sign-in error:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger }: any) {
      if (user) {
        token.id = user.id;
      }
      // Always refresh tenant data from DB to pick up settings changes (e.g. currency)
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          include: { tenant: true },
        });
        if (dbUser) {
          token.tenantId = dbUser.tenantId;
          token.role = dbUser.role;
          token.firstName = dbUser.firstName;
          token.lastName = dbUser.lastName;
          token.tenantName = dbUser.tenant?.name ?? '';
          token.tenantCurrency = dbUser.tenant?.defaultCurrency ?? 'NGN';
          token.tenantSubdomain = dbUser.tenant?.subdomain ?? '';
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session?.user) {
        session.user.id = token.id;
        session.user.tenantId = token.tenantId;
        session.user.role = token.role;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.tenantName = token.tenantName;
        session.user.tenantCurrency = token.tenantCurrency;
        session.user.tenantSubdomain = token.tenantSubdomain;
      }
      return session;
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  cookies: {
    state: {
      name: 'next-auth.state',
      options: { httpOnly: true, sameSite: 'lax' as const, path: '/', secure: process.env.NODE_ENV === 'production' },
    },
    pkceCodeVerifier: {
      name: 'next-auth.pkce.code_verifier',
      options: { httpOnly: true, sameSite: 'lax' as const, path: '/', secure: process.env.NODE_ENV === 'production' },
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
