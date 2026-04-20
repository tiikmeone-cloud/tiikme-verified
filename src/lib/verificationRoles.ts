/**
 * Role categories used to route verification requests to the right org admin.
 * Keep this list in sync with the dropdown in OrgVerificationRouting + GetVerifiedModal.
 */
export const ROLE_CATEGORIES = [
  { value: "engineering", label: "Engineering / Technology" },
  { value: "marketing", label: "Marketing / Brand" },
  { value: "sales", label: "Sales / Business Dev" },
  { value: "operations", label: "Operations" },
  { value: "medical", label: "Medical / Healthcare" },
  { value: "finance", label: "Finance / Accounts" },
  { value: "hr", label: "HR / People" },
  { value: "design", label: "Design / Creative" },
  { value: "legal", label: "Legal / Compliance" },
  { value: "research", label: "Research / Academia" },
  { value: "default", label: "Default (other / unmatched)" },
] as const;

export type RoleCategory = typeof ROLE_CATEGORIES[number]["value"];

export function roleCategoryLabel(value: string | null | undefined): string {
  if (!value) return "—";
  const m = ROLE_CATEGORIES.find(r => r.value === value);
  return m?.label || value;
}
