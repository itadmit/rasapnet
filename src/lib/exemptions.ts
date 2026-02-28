/**
 * Maps exemption codes to duty type matching logic.
 * soldier has exemption "guards" -> cannot be assigned to duty types with category "שמירות"
 */
export const EXEMPTION_CODES = ["night", "guards", "cleaning"] as const;
export type ExemptionCode = (typeof EXEMPTION_CODES)[number];

export const EXEMPTION_LABELS: Record<ExemptionCode, string> = {
  night: "פטור מלילה",
  guards: "פטור משמירות",
  cleaning: "פטור מנקיונות",
};

/**
 * Check if a soldier with given exemptions can be assigned to a duty type.
 */
export function isExemptFromDuty(
  soldierExemptions: string[],
  dutyType: { category: string; name: string }
): boolean {
  for (const code of soldierExemptions) {
    if (code === "guards" && dutyType.category === "שמירות") return true;
    if (code === "cleaning" && dutyType.category === "ניקיון") return true;
    if (code === "night" && (dutyType.category === "לילה" || dutyType.name.includes("לילה")))
      return true;
  }
  return false;
}
