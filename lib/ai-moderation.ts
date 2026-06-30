/**
 * AI-powered product content moderation for Google Merchant Center compliance.
 * Uses the configured LLM (default: local Qwen 2.5 3B) to analyse product
 * listings and detect policy violations before they reach the GMC feed.
 */

import { chatCompletionText } from './llm';

// ── Types ─────────────────────────────────────────────────────────────────────

export type RiskLevel = 'low' | 'medium' | 'high';

export type ModerationFlag =
  | 'medical_claims'
  | 'health_cures'
  | 'weight_loss'
  | 'sexual_enhancement'
  | 'counterfeit'
  | 'hate_speech'
  | 'violence'
  | 'adult_content'
  | 'copyright'
  | 'dangerous'
  | 'misleading';

export interface ModerationResult {
  riskLevel: RiskLevel;
  riskScore: number;          // 0–100
  flags: ModerationFlag[];
  flagDetails: string;        // human-readable explanation
  suggestion: string | null;  // rewritten description, or null if clean
  reviewedAt: string;         // ISO timestamp
}

/** What gets stored in product.metadata */
export type GmcStatus = 'approved' | 'flagged' | 'rejected' | 'unchecked';

export function gmcStatusFromRisk(riskLevel: RiskLevel, savedAnyway: boolean): GmcStatus {
  if (riskLevel === 'low')    return 'approved';
  if (riskLevel === 'medium') return savedAnyway ? 'flagged'   : 'approved';
  if (riskLevel === 'high')   return savedAnyway ? 'rejected'  : 'approved';
  return 'unchecked';
}

// ── Prompt ───────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a content moderation AI for an African e-commerce platform that submits product listings to Google Merchant Center.

Your job is to analyse product listings and detect policy violations that would get the account suspended.

Respond ONLY with a valid JSON object — no markdown, no explanation outside the JSON.

JSON schema:
{
  "riskLevel": "low" | "medium" | "high",
  "riskScore": <integer 0-100>,
  "flags": [<array of applicable flag strings>],
  "flagDetails": "<one sentence explaining any issues, or 'No issues found'>",
  "suggestion": "<revised description if issues exist, otherwise null>"
}

Available flag values (use only these exact strings):
medical_claims, health_cures, weight_loss, sexual_enhancement, counterfeit,
hate_speech, violence, adult_content, copyright, dangerous, misleading

Risk level guidance:
- low (0–30):    Safe for Google Shopping. Standard product descriptions, factual claims.
- medium (31–60): Possible policy issue. Vague health benefits, borderline claims, needs review.
- high (61–100): Likely GMC policy violation. Will cause product disapproval or account suspension.

Examples of high-risk phrases:
  "cures cancer", "treats HIV/AIDS", "guaranteed weight loss", "penis enlargement",
  "counterfeit", "replica [brand name]", "100% effective cure", "kill [any person/group]"

Examples of medium-risk:
  "boosts immunity" (vague health claim), "lose weight fast" (weight loss without guarantee),
  "may help with digestion" (unverified health benefit)

Examples of low-risk (safe):
  "Rich in Vitamin C", "Made from natural ingredients", "Supports a healthy lifestyle",
  "Traditional recipe", "Premium quality cotton"

Be conservative — do NOT flag legitimate health/wellness products unless they make
specific medical claims. Nigerian and African traditional products are legitimate.
Generic wellness language ("promotes wellbeing") is NOT a violation.`;

// ── Core function ─────────────────────────────────────────────────────────────

/**
 * Run AI content moderation on a product listing.
 * Returns a safe fallback (unchecked) if the LLM is unavailable.
 */
export async function moderateProduct(
  name: string,
  description: string | null | undefined,
): Promise<ModerationResult> {
  const reviewedAt = new Date().toISOString();

  // Skip moderation if there's nothing substantive to check
  const text = [name, description].filter(Boolean).join('\n').trim();
  if (text.length < 5) {
    return { riskLevel: 'low', riskScore: 0, flags: [], flagDetails: 'No content to review', suggestion: null, reviewedAt };
  }

  try {
    const userMessage = `Product Name: ${name}\nDescription: ${description ?? '(no description provided)'}`;

    const raw = await chatCompletionText({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: userMessage },
      ],
      maxTokens: 600,
      temperature: 0.1,
    });

    // Extract JSON from the response (handle cases where model wraps in markdown)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in LLM response');

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      riskLevel:   validateRiskLevel(parsed.riskLevel),
      riskScore:   clampScore(parsed.riskScore),
      flags:       validateFlags(parsed.flags),
      flagDetails: String(parsed.flagDetails ?? 'No issues found'),
      suggestion:  parsed.suggestion ? String(parsed.suggestion) : null,
      reviewedAt,
    };
  } catch (err) {
    console.error('[AI Moderation] Failed:', err);
    // Fail open — don't block saves when LLM is unavailable
    return {
      riskLevel: 'low',
      riskScore: 0,
      flags: [],
      flagDetails: 'Moderation service unavailable — review manually',
      suggestion: null,
      reviewedAt,
    };
  }
}

// ── Validators ────────────────────────────────────────────────────────────────

function validateRiskLevel(value: unknown): RiskLevel {
  if (value === 'low' || value === 'medium' || value === 'high') return value;
  return 'low';
}

function clampScore(value: unknown): number {
  const n = Number(value);
  if (isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

const VALID_FLAGS = new Set<ModerationFlag>([
  'medical_claims', 'health_cures', 'weight_loss', 'sexual_enhancement',
  'counterfeit', 'hate_speech', 'violence', 'adult_content', 'copyright',
  'dangerous', 'misleading',
]);

function validateFlags(value: unknown): ModerationFlag[] {
  if (!Array.isArray(value)) return [];
  return value.filter((f): f is ModerationFlag => VALID_FLAGS.has(f as ModerationFlag));
}

// ── Flag display helpers ──────────────────────────────────────────────────────

export const FLAG_LABELS: Record<ModerationFlag, string> = {
  medical_claims:       'Medical claims',
  health_cures:         'Health cure claims',
  weight_loss:          'Weight-loss claims',
  sexual_enhancement:   'Sexual enhancement claims',
  counterfeit:          'Counterfeit / replica',
  hate_speech:          'Hate speech',
  violence:             'Violence',
  adult_content:        'Adult content',
  copyright:            'Copyright violation',
  dangerous:            'Dangerous product',
  misleading:           'Misleading claims',
};

export const RISK_CONFIG = {
  low:    { label: 'Low risk',    color: 'text-green-700 bg-green-50 border-green-200'  },
  medium: { label: 'Medium risk', color: 'text-amber-700 bg-amber-50 border-amber-200'  },
  high:   { label: 'High risk',   color: 'text-red-700   bg-red-50   border-red-200'    },
} as const;
