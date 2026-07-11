import { prisma } from '@/lib/db';
import { findSystemAccount } from './engine';

/**
 * Resolves a GL account ID for a given tag.
 * Checks tenant's glAccountMappings first, then falls back to systemTag lookup.
 */
export async function resolveGLAccount(
  tenantId: string,
  tag: string,
  mappings: Record<string, string>,
): Promise<string | null> {
  if (mappings[tag]) return mappings[tag];
  return findSystemAccount(tenantId, tag);
}

export async function getFinanceSettings(tenantId: string): Promise<{
  glPostingMode: 'AUTO' | 'EOD';
  glAccountMappings: Record<string, string>;
  fixedAssetCategoryMappings: Record<string, string>;
}> {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { settings: true } });
  const s = (tenant?.settings as any) ?? {};
  return {
    glPostingMode: s.glPostingMode ?? 'AUTO',
    glAccountMappings: s.glAccountMappings ?? {},
    fixedAssetCategoryMappings: s.fixedAssetCategoryMappings ?? {},
  };
}
