/**
 * POST /api/products/moderate
 * Run AI content moderation on a product listing before saving.
 * Called client-side; does not persist anything.
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorized, badRequest } from '@/lib/api-helpers';
import { moderateProduct } from '@/lib/ai-moderation';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();

    const body = await request.json();
    const { name, description } = body ?? {};

    if (!name) return badRequest('Product name is required');

    const result = await moderateProduct(name, description);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Moderate API]', error);
    // Fail open — return a low-risk result so saves are never blocked by moderation errors
    return NextResponse.json({
      riskLevel: 'low', riskScore: 0, flags: [], flagDetails: 'Service unavailable', suggestion: null,
      reviewedAt: new Date().toISOString(),
    });
  }
}
