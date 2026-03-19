/**
 * Parse the recommended doctor type from assistant response text.
 * Used to trigger doctor search with the correct specialty (PCP, specialist, etc.).
 */

const PATTERNS: Array<{ pattern: RegExp; type: string }> = [
  { pattern: /\b(?:recommend|see|seeing)\s+(?:a|an?)?\s*primary\s+care\s+(?:physician|doctor|provider)\b/i, type: "Primary Care Physician" },
  { pattern: /\bprimary\s+care\s+(?:physician|doctor|provider)\b/i, type: "Primary Care Physician" },
  { pattern: /\b(?:recommend|see|seeing)\s+(?:a|an?)?\s*(?:cardiologist)s?\b/i, type: "Cardiologist" },
  { pattern: /\b(?:recommend|see|seeing)\s+(?:a|an?)?\s*(?:dermatologist)s?\b/i, type: "Dermatologist" },
  /** "Orthopedic Spine Surgeon" has words between orthopedic and surgeon — match before generic orthopedic surgeon */
  { pattern: /\borthopedic\s+spine\s+surgeon\b/i, type: "Orthopedic Spine Surgeon" },
  { pattern: /\borthopedic(?:\s+\w+){0,2}\s+surgeon\b/i, type: "Orthopedist" },
  { pattern: /\b(?:recommend|see|seeing)\s+(?:a|an?)?\s*(?:orthopedist|orthopedic\s+surgeon)s?\b/i, type: "Orthopedist" },
  { pattern: /\bphysiatrist\b/i, type: "Physiatrist" },
  { pattern: /\b(?:recommend|see|seeing)\s+(?:a|an?)?\s*(?:neurologist)s?\b/i, type: "Neurologist" },
  { pattern: /\b(?:recommend|see|seeing)\s+(?:a|an?)?\s*(?:gastroenterologist)s?\b/i, type: "Gastroenterologist" },
  { pattern: /\b(?:recommend|see|seeing)\s+(?:a|an?)?\s*(?:endocrinologist)s?\b/i, type: "Endocrinologist" },
  { pattern: /\b(?:recommend|see|seeing)\s+(?:a|an?)?\s*(?:specialist)s?\b/i, type: "Specialist" },
  { pattern: /\b(?:recommend|see|seeing)\s+(?:a|an?)?\s*(?:urgent\s+care)\b/i, type: "Urgent Care" },
  { pattern: /\b(?:recommend|see|seeing)\s+(?:a|an?)?\s*(?:internist)s?\b/i, type: "Internal Medicine" },
  { pattern: /\b(?:recommend|see|seeing)\s+(?:a|an?)?\s*(?:family\s+medicine)\b/i, type: "Family Medicine" },
  { pattern: /\b(?:recommend|see|seeing)\s+(?:a|an?)?\s*(?:doctor|physician|provider)\b/i, type: "Primary Care Physician" },
];

/**
 * Strip markdown bold so "**Neurologist**" doesn't break pattern matching.
 */
function stripMarkdownForParse(text: string): string {
  return text.replace(/\*+/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Returns the recommended doctor type from assistant message text, or null if not found.
 * Handles markdown (e.g. "I recommend seeing a **Neurologist**").
 */
export function parseRecommendedDoctorType(text: string): string | null {
  if (!text?.trim()) return null;
  const normalized = stripMarkdownForParse(text);
  for (const { pattern, type } of PATTERNS) {
    if (pattern.test(normalized)) return type;
  }
  return null;
}

/** Types that are "general" — we show digital vs in-person. All others are specialists (go straight to "doctor in mind?"). */
const GENERAL_DOCTOR_TYPES = new Set([
  "Primary Care Physician",
  "Internal Medicine",
  "Family Medicine",
]);

/** True if the recommended type is a specialist (e.g. Neurologist, Orthopedist). For specialists we skip digital vs in-person and go straight to "Do you have a [type] / doctor in mind?". */
export function isSpecialistType(doctorType: string | null): boolean {
  if (!doctorType?.trim()) return false;
  const normalized = doctorType.trim();
  return !GENERAL_DOCTOR_TYPES.has(normalized);
}

/** True if the message looks like the assistant is recommending seeing a doctor (so we should run search and show cards). */
export function looksLikeDoctorRecommendation(text: string): boolean {
  if (!text?.trim()) return false;
  const lower = text.toLowerCase();
  return (
    (lower.includes("recommend") && (lower.includes("physician") || lower.includes("doctor") || lower.includes("primary care") || lower.includes("specialist") || lower.includes("provider"))) ||
    (lower.includes("recommend") && (lower.includes("surgeon") || lower.includes("physiatrist"))) ||
    lower.includes("recommend seeing") ||
    lower.includes("suggest seeing") ||
    lower.includes("you should see a")
  );
}
