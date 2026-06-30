/**
 * Merchant Center Policy Engine
 * Rule-based, declarative — add new rules here as Google updates its policies.
 * Each rule maps a detected flag to a severity and an action.
 */

import type { ModerationFlag, RiskLevel } from './ai-moderation';

// ── Rule types ────────────────────────────────────────────────────────────────

export type PolicySeverity = 'critical' | 'warning' | 'info';

export type PolicyAction =
  | 'reject_publication'      // Block save entirely (future hard-block mode)
  | 'exclude_from_google_feed' // Save but exclude from GMC / Google Shopping feeds
  | 'include_with_warning'    // Include in feeds but surface warning to merchant
  | 'suggest_improvement';    // Low priority — just nudge the merchant

export interface PolicyRule {
  id: string;
  flag: ModerationFlag;
  severity: PolicySeverity;
  action: PolicyAction;
  title: string;
  guidance: string; // What the merchant should do
}

export interface PolicyViolation {
  ruleId: string;
  flag: ModerationFlag;
  severity: PolicySeverity;
  action: PolicyAction;
  title: string;
  guidance: string;
}

// ── Rules registry ────────────────────────────────────────────────────────────

export const POLICY_RULES: PolicyRule[] = [
  {
    id: 'medical_claims',
    flag: 'medical_claims',
    severity: 'critical',
    action: 'exclude_from_google_feed',
    title: 'Medical claims detected',
    guidance:
      'Remove claims to cure, treat, or prevent specific diseases. ' +
      'Replace with general wellness language, e.g. "Traditionally used to support joint comfort."',
  },
  {
    id: 'health_cures',
    flag: 'health_cures',
    severity: 'critical',
    action: 'exclude_from_google_feed',
    title: 'Disease cure claims',
    guidance:
      'Claiming to cure cancer, HIV/AIDS, kidney failure, or any serious disease violates ' +
      'Google policy and Nigerian NAFDAC regulations. Add a standard disclaimer: ' +
      '"This product is not intended to diagnose, treat, cure, or prevent any disease."',
  },
  {
    id: 'counterfeit',
    flag: 'counterfeit',
    severity: 'critical',
    action: 'exclude_from_google_feed',
    title: 'Counterfeit or replica claim detected',
    guidance:
      'Products described as counterfeit, replica, or fake brand items are prohibited ' +
      'on Google Shopping and most marketplaces. Remove all brand references if selling ' +
      'unbranded or compatible items.',
  },
  {
    id: 'sexual_enhancement',
    flag: 'sexual_enhancement',
    severity: 'critical',
    action: 'exclude_from_google_feed',
    title: 'Sexual enhancement claims',
    guidance:
      'Explicit sexual enhancement or performance claims violate Google Shopping policy. ' +
      'Use clinical or wellness-neutral language.',
  },
  {
    id: 'hate_speech',
    flag: 'hate_speech',
    severity: 'critical',
    action: 'exclude_from_google_feed',
    title: 'Hate speech detected',
    guidance: 'Content targeting groups with hate or discrimination is not permitted. Remove this content.',
  },
  {
    id: 'violence',
    flag: 'violence',
    severity: 'critical',
    action: 'exclude_from_google_feed',
    title: 'Violent content',
    guidance: 'Content glorifying or promoting violence is not permitted. Revise the description.',
  },
  {
    id: 'adult_content',
    flag: 'adult_content',
    severity: 'critical',
    action: 'exclude_from_google_feed',
    title: 'Adult content',
    guidance:
      'Explicit adult content cannot appear on Google Shopping. ' +
      'Describe the product in neutral, professional language.',
  },
  {
    id: 'dangerous',
    flag: 'dangerous',
    severity: 'critical',
    action: 'exclude_from_google_feed',
    title: 'Dangerous product description',
    guidance: 'Descriptions that encourage unsafe use of a product are not permitted.',
  },
  {
    id: 'weight_loss',
    flag: 'weight_loss',
    severity: 'warning',
    action: 'include_with_warning',
    title: 'Weight-loss claims',
    guidance:
      'Guaranteed weight-loss claims are not permitted. Replace with: ' +
      '"May support a healthy weight management routine as part of a balanced diet."',
  },
  {
    id: 'copyright',
    flag: 'copyright',
    severity: 'warning',
    action: 'include_with_warning',
    title: 'Possible copyright reference',
    guidance:
      'Referencing third-party brand names or copyrighted material in descriptions may ' +
      'cause your listing to be disapproved. Use generic product terms instead.',
  },
  {
    id: 'misleading',
    flag: 'misleading',
    severity: 'warning',
    action: 'include_with_warning',
    title: 'Misleading claims',
    guidance:
      'Claims that cannot be substantiated (e.g. "100% effective", "guaranteed results") ' +
      'are flagged by Google. Use verifiable, factual language.',
  },
];

// ── Engine ────────────────────────────────────────────────────────────────────

/** Highest-severity action wins for the overall GMC eligibility determination. */
const ACTION_RANK: Record<PolicyAction, number> = {
  reject_publication:       4,
  exclude_from_google_feed: 3,
  include_with_warning:     2,
  suggest_improvement:      1,
};

export interface PolicyResult {
  violations: PolicyViolation[];
  /** The most severe action that applies across all violations. */
  highestAction: PolicyAction | null;
  /** Convenience shorthand. */
  isGmcEligible: boolean;
}

export function applyPolicyRules(flags: ModerationFlag[]): PolicyResult {
  const violations: PolicyViolation[] = flags
    .map((flag) => POLICY_RULES.find((r) => r.flag === flag))
    .filter((r): r is PolicyRule => r !== undefined)
    .map(({ id, flag, severity, action, title, guidance }) => ({
      ruleId: id, flag, severity, action, title, guidance,
    }));

  const highestAction = violations.reduce<PolicyAction | null>((best, v) => {
    if (!best) return v.action;
    return ACTION_RANK[v.action] > ACTION_RANK[best] ? v.action : best;
  }, null);

  const isGmcEligible =
    highestAction === null ||
    highestAction === 'include_with_warning' ||
    highestAction === 'suggest_improvement';

  return { violations, highestAction, isGmcEligible };
}

// ── Display helpers ───────────────────────────────────────────────────────────

export const SEVERITY_CONFIG: Record<PolicySeverity, { label: string; cls: string }> = {
  critical: { label: 'Critical',  cls: 'text-red-700 bg-red-50 border-red-200' },
  warning:  { label: 'Warning',   cls: 'text-amber-700 bg-amber-50 border-amber-200' },
  info:     { label: 'Info',      cls: 'text-blue-700 bg-blue-50 border-blue-200' },
};

export const PLATFORM_POLICIES = [
  {
    category: 'Medical & Health Products',
    prohibited: [
      'Claiming to cure cancer, HIV/AIDS, or any terminal disease',
      'Claiming to reverse kidney failure or organ damage',
      'Claiming to replace prescription medicine',
      'Guaranteeing medical results of any kind',
      'Claiming NAFDAC approval without documentation',
    ],
    allowed: [
      'Traditionally used to support joint comfort',
      'May promote general digestive wellness',
      'Rich in Vitamin C and natural antioxidants',
      'Supports a healthy lifestyle as part of a balanced diet',
    ],
  },
  {
    category: 'Weight Loss & Slimming Products',
    prohibited: [
      'Guaranteed weight loss in X days',
      'Lose 10 kg in 2 weeks without exercise',
      'Burns fat automatically',
    ],
    allowed: [
      'May support healthy weight management with diet and exercise',
      'Formulated to complement an active lifestyle',
    ],
  },
  {
    category: 'Brand & Authenticity',
    prohibited: [
      'Counterfeit, replica, or fake brand names',
      'Same as [brand] but cheaper',
      'Looks exactly like [designer brand]',
    ],
    allowed: [
      'Compatible with [brand] devices',
      'Inspired by classic designs',
    ],
  },
];
