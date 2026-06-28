import { stat } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/db';

// All tables that store tenant data, with their tenant_id column name.
// pg_column_size(t.*) gives the uncompressed on-disk size of every row.
const TENANT_TABLES: { table: string; col: string }[] = [
  { table: 'users',                col: 'tenant_id' },
  { table: 'product_categories',   col: 'tenant_id' },
  { table: 'products',             col: 'tenant_id' },
  { table: 'product_images',       col: 'product_id' }, // joined via products
  { table: 'customers',            col: 'tenant_id' },
  { table: 'customer_tags',        col: 'tenant_id' },
  { table: 'orders',               col: 'tenant_id' },
  { table: 'order_items',          col: 'order_id' },   // joined via orders
  { table: 'payments',             col: 'tenant_id' },
  { table: 'invoices',             col: 'tenant_id' },
  { table: 'conversations',        col: 'tenant_id' },
  { table: 'messages',             col: 'conversation_id' }, // joined
  { table: 'ai_usage_tracking',    col: 'tenant_id' },
  { table: 'campaigns',            col: 'tenant_id' },
  { table: 'campaign_messages',    col: 'campaign_id' }, // joined
  { table: 'incomes',              col: 'tenant_id' },
  { table: 'expenses',             col: 'tenant_id' },
  { table: 'bank_accounts',        col: 'tenant_id' },
  { table: 'daily_cash_entries',   col: 'tenant_id' },
  { table: 'gl_accounts',          col: 'tenant_id' },
  { table: 'fiscal_years',         col: 'tenant_id' },
  { table: 'journal_entries',      col: 'tenant_id' },
  { table: 'journal_lines',        col: 'journal_entry_id' }, // joined
  { table: 'vendors',              col: 'tenant_id' },
  { table: 'purchase_invoices',    col: 'tenant_id' },
  { table: 'purchase_invoice_lines', col: 'purchase_invoice_id' }, // joined
  { table: 'analytics_events',     col: 'tenant_id' },
  { table: 'audit_logs',           col: 'tenant_id' },
  { table: 'subscriptions',        col: 'tenant_id' },
  { table: 'subscription_usage',   col: 'tenant_id' },
];

// Tables where we need a subquery join to filter by tenant_id
const JOINED_TABLES: Record<string, string> = {
  product_images:          `SELECT pi.* FROM product_images pi JOIN products p ON p.id = pi.product_id WHERE p.tenant_id = $1::uuid AND p.deleted_at IS NULL`,
  order_items:             `SELECT oi.* FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.tenant_id = $1::uuid`,
  messages:                `SELECT m.* FROM messages m JOIN conversations c ON c.id = m.conversation_id WHERE c.tenant_id = $1::uuid`,
  campaign_messages:       `SELECT cm.* FROM campaign_messages cm JOIN campaigns c ON c.id = cm.campaign_id WHERE c.tenant_id = $1::uuid`,
  journal_lines:           `SELECT jl.* FROM journal_lines jl JOIN journal_entries je ON je.id = jl.journal_entry_id WHERE je.tenant_id = $1::uuid`,
  purchase_invoice_lines:  `SELECT pil.* FROM purchase_invoice_lines pil JOIN purchase_invoices pi ON pi.id = pil.purchase_invoice_id WHERE pi.tenant_id = $1::uuid`,
};

/** Returns total bytes used by a tenant across all database tables + uploaded files on disk. */
export async function getTenantStorageBytes(tenantId: string): Promise<{ dbBytes: number; fileBytes: number; totalBytes: number }> {
  const [dbBytes, fileBytes] = await Promise.all([
    computeDbBytes(tenantId),
    computeFileBytes(tenantId),
  ]);
  return { dbBytes, fileBytes, totalBytes: dbBytes + fileBytes };
}

async function computeDbBytes(tenantId: string): Promise<number> {
  let total = 0;
  for (const { table, col } of TENANT_TABLES) {
    try {
      const subquery = JOINED_TABLES[table];
      const sql = subquery
        ? `SELECT COALESCE(SUM(pg_column_size(t.*)), 0)::bigint AS bytes FROM (${subquery}) t`
        : `SELECT COALESCE(SUM(pg_column_size(t.*)), 0)::bigint AS bytes FROM ${table} t WHERE t.${col} = $1::uuid`;
      const rows = await prisma.$queryRawUnsafe<{ bytes: bigint }[]>(sql, tenantId);
      total += Number(rows[0]?.bytes ?? 0);
    } catch {
      // table may not exist yet or query failed — skip
    }
  }
  return total;
}

async function computeFileBytes(tenantId: string): Promise<number> {
  const images = await prisma.productImage.findMany({
    where: {
      product: { tenantId, deletedAt: null },
      url: { startsWith: '/uploads/' },
    },
    select: { url: true },
  });

  let total = 0;
  await Promise.all(
    images.map(async (img) => {
      try {
        const s = await stat(path.join(process.cwd(), 'public', img.url));
        total += s.size;
      } catch {
        // file missing — skip
      }
    })
  );
  return total;
}

/** Returns the tenant's storage limit in MB from their active subscription plan (default 1024 MB). */
export async function getTenantStorageLimitMb(tenantId: string): Promise<number> {
  const subscription = await prisma.subscription.findUnique({
    where: { tenantId },
    include: { plan: { select: { maxStorageMb: true } } },
  });
  return subscription?.plan?.maxStorageMb ?? 1024;
}

export function bytesToMb(bytes: number): number {
  return bytes / (1024 * 1024);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
