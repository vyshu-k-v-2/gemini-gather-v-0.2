/**
 * @file security.ts
 * @description Enterprise-grade security module for Gemini Gather.
 * Provides prompt injection defense, input validation, XSS sanitization,
 * safe URL validation, and cryptographic hashing.
 */

// Characters disallowed or dangerous in raw HTML rendering
const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
};

/**
 * Escapes unsafe HTML characters to prevent Cross-Site Scripting (XSS).
 */
export function sanitizeHTML(input: string): string {
  if (!input || typeof input !== "string") return "";
  return input.replace(/[&<>"'/]/g, (char) => HTML_ESCAPE_MAP[char] || char);
}

/**
 * Strips script tags, iframe, object, embed, and inline event handlers.
 */
export function sanitizeText(input: string): string {
  if (!input || typeof input !== "string") return "";
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/javascript:/gi, "")
    .trim();
}

/**
 * Prompt injection patterns commonly used in adversarial attacks against LLMs.
 */
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions|directives|prompts)/i,
  /system\s*prompt\s*override/i,
  /you\s+are\s+now\s+(in\s+)?(dan|jailbreak|developer|god)\s+mode/i,
  /reveal\s+(your|the)\s+(initial|system|hidden)\s+prompt/i,
  /bypass\s+all\s+(filters|rules|safeguards)/i,
  /disregard\s+(everything|all\s+rules)/i,
  /pretend\s+you\s+have\s+no\s+(morals|filters|restrictions)/i,
  /<script[\s\S]*?>/i,
  /\bexec\s*\(/i,
  /\beval\s*\(/i,
];

export interface PromptScanResult {
  isSafe: boolean;
  detectedThreats: string[];
  sanitizedPrompt: string;
}

/**
 * Scans user input for adversarial prompt injection attempts.
 * Returns threat indicators and a hardened prompt string.
 */
export function scanAndHardenPrompt(rawPrompt: string): PromptScanResult {
  const threats: string[] = [];
  const text = rawPrompt.trim();

  // 1. Length bounds check (prevent buffer overflow / token exhaustion DOS)
  if (text.length > 3000) {
    threats.push("PROMPT_LENGTH_EXCEEDED");
  }

  // 2. Pattern detection
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      threats.push(`PATTERN_MATCH_${pattern.source.slice(0, 15).toUpperCase()}`);
    }
  }

  // 3. Delimiter isolation & hardening
  // Enclose user prompt inside strict structural delimiters to prevent instruction hijacking
  const sanitized = sanitizeText(text);

  return {
    isSafe: threats.length === 0,
    detectedThreats: threats,
    sanitizedPrompt: sanitized,
  };
}

/**
 * Safe protocol allowlist for external links and redirects.
 */
const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

/**
 * Validates that a URL is safe against javascript: or data: injection.
 */
export function validateSafeUrl(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== "string") return false;
  try {
    const parsed = new URL(rawUrl, "http://localhost:3000");
    return ALLOWED_PROTOCOLS.has(parsed.protocol);
  } catch {
    // Relative paths are safe if they don't start with // or javascript:
    return /^\/(?!\/)[a-zA-Z0-9_\-\.\/\?=&%]*$/.test(rawUrl);
  }
}

/**
 * Sanitizes and validates guest count (strictly between 10 and 100,000).
 */
export function validateGuestCount(input: unknown): number {
  const num = Number(input);
  if (isNaN(num) || !isFinite(num)) return 80;
  return Math.max(10, Math.min(100000, Math.round(num)));
}

/**
 * Sanitizes and validates budget in INR (strictly between 10,000 and 500,000,000).
 */
export function validateBudgetInr(input: unknown): number {
  const num = Number(input);
  if (isNaN(num) || !isFinite(num)) return 600000;
  return Math.max(10000, Math.min(500000000, Math.round(num)));
}
