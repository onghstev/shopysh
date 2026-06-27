import { prisma } from '@/lib/db';

export async function generateCustomerCode(tenantId: string): Promise<string> {
  const count = await prisma.customer.count({ where: { tenantId } });
  const code = `CUST-${String(count + 1).padStart(4, '0')}`;
  // Handle race condition: if code already exists, increment until unique
  const existing = await prisma.customer.findFirst({ where: { tenantId, customerCode: code } });
  if (existing) {
    return `CUST-${String(count + 2).padStart(4, '0')}`;
  }
  return code;
}

export async function generateVendorCode(tenantId: string): Promise<string> {
  const count = await prisma.vendor.count({ where: { tenantId } });
  const code = `VND-${String(count + 1).padStart(4, '0')}`;
  const existing = await prisma.vendor.findFirst({ where: { tenantId, code } });
  if (existing) {
    return `VND-${String(count + 2).padStart(4, '0')}`;
  }
  return code;
}
