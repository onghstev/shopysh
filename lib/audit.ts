import { prisma } from '@/lib/db';

export interface AuditEntry {
  tenantId: string;
  userId?: string;
  userName?: string;
  action: string;
  entity: string;
  entityId?: string;
  summary: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

/** Fire-and-forget audit log write. Never throws. */
export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId:  entry.tenantId,
        userId:    entry.userId ?? null,
        userName:  entry.userName ?? null,
        action:    entry.action,
        entity:    entry.entity,
        entityId:  entry.entityId ?? null,
        summary:   entry.summary,
        metadata:  (entry.metadata as any) ?? undefined,
        ipAddress: entry.ipAddress ?? null,
      },
    });
  } catch (e) {
    console.error('[audit]', e);
  }
}

/** Extract client IP from Next.js request headers. */
export function getClientIp(req: Request | { headers: { get(k: string): string | null } }): string | undefined {
  const h = req.headers;
  const raw = (h as any).get?.('x-forwarded-for') ?? (h as any)['x-forwarded-for'];
  if (raw) return String(raw).split(',')[0].trim();
  return undefined;
}
