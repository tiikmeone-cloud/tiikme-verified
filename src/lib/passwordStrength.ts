/**
 * Password strength check using zxcvbn.
 * Returns 0-4 score plus a human-readable label and color.
 */
import zxcvbn from "zxcvbn";

export interface StrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
  feedback: string;
  ok: boolean;
}

export const MIN_PASSWORD_LENGTH = 10;

const LABELS = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];
const COLORS = ["#DC2626", "#EF4444", "#F59E0B", "#10B981", "#059669"];

export function checkPassword(pw: string, userInputs: string[] = []): StrengthResult {
  if (!pw) return { score: 0, label: "Empty", color: "#9CA3AF", feedback: "Enter a password", ok: false };

  const result = zxcvbn(pw, userInputs);
  const score = result.score as 0 | 1 | 2 | 3 | 4;

  let feedback = result.feedback.warning || "";
  if (!feedback && result.feedback.suggestions.length > 0) feedback = result.feedback.suggestions[0];

  // Hard requirements: ≥10 chars AND zxcvbn score ≥ 2
  const ok = pw.length >= MIN_PASSWORD_LENGTH && score >= 2;
  if (!ok && pw.length < MIN_PASSWORD_LENGTH) {
    feedback = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  return { score, label: LABELS[score], color: COLORS[score], feedback, ok };
}
