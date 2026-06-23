export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import CustomerAccountClient from './client';

interface Props {
  params: { slug: string };
}

async function getStoreInfo(slug: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { subdomain: slug, isActive: true, deletedAt: null },
    select: { id: true, name: true, subdomain: true, primaryColor: true, logoUrl: true },
  });
  return tenant;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const store = await getStoreInfo(params.slug);
  if (!store) return { title: 'Store Not Found' };
  return {
    title: `My Account — ${store.name}`,
    description: `Manage your account and track orders at ${store.name}.`,
  };
}

export default async function CustomerAccountPage({ params }: Props) {
  const store = await getStoreInfo(params.slug);
  if (!store) notFound();

  return (
    <CustomerAccountClient
      store={{
        id: store.id,
        name: store.name,
        subdomain: store.subdomain,
        primaryColor: store.primaryColor || '#10b981',
        logoUrl: store.logoUrl,
      }}
    />
  );
}
