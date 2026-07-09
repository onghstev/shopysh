export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers';
import { generateVATNarrative } from '@/lib/ai-finance';

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const body = await req.json();
    const { from, to, outputVAT, inputVAT, vatPayable, outputTransactions, inputTransactions } = body;
    if (!from || !to) return badRequest('from and to required');

    const narrative = await generateVATNarrative({
      from, to,
      outputVAT:          Number(outputVAT ?? 0),
      inputVAT:           Number(inputVAT  ?? 0),
      vatPayable:         Number(vatPayable ?? 0),
      outputTransactions: Number(outputTransactions ?? 0),
      inputTransactions:  Number(inputTransactions  ?? 0),
    });
    return NextResponse.json({ narrative });
  } catch (e) { return serverError(e); }
}
