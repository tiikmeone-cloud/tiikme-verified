export type PilotIntent =
  | "find_org"
  | "find_person"
  | "find_job"
  | "find_circle"
  | "hiring_search"
  | "verification_query"
  | "own_applications"
  | "general_external";

export function normalizePilotQuery(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, " ");
}

const JOB_WORDS = /\b(job|jobs|hiring|opportunity|role|position|vacancy|internship|opening|career)\b/;
const ORG_WORDS = /\b(company|organization|organisation|startup|college|hospital|school|ngo|agency|institute)\b/;
const PERSON_WORDS = /\b(person|people|connect|developer|designer|engineer|doctor|manager|founder|profile|professional)\b/;
const CIRCLE_WORDS = /\b(circle|community|group|club|network)\b/;
const HIRING_WORDS = /\b(candidate|applicant|hire|recruit|shortlist|talent|screen)\b/;
const VERIFY_WORDS = /\b(verify|verification|verified|badge|credential|document|authentic)\b/;
const OWN_APP_WORDS = /\b(my applications?|where.*applied|application status|applied.*job)\b/;

export function classifyPilotIntent(query: string, mode: string): PilotIntent {
  const q = normalizePilotQuery(query);
  if (OWN_APP_WORDS.test(q)) return "own_applications";
  if (mode === "hiring" || HIRING_WORDS.test(q)) return "hiring_search";
  if (mode === "verification" || VERIFY_WORDS.test(q)) return "verification_query";
  if (JOB_WORDS.test(q)) return "find_job";
  if (ORG_WORDS.test(q)) return "find_org";
  if (CIRCLE_WORDS.test(q)) return "find_circle";
  if (PERSON_WORDS.test(q)) return "find_person";
  if (mode === "jobs") return "find_job";
  if (mode === "profile") return "find_person";
  return "general_external";
}

export function extractPilotSearchText(query: string): string {
  return normalizePilotQuery(query)
    .replace(/\b(find|show|get|list|search|who|what|where|when|tell me about|looking for|i want|i need|can you|please|help me|how do i|what are|give me)\b/g, "")
    .replace(/\s+/g, " ")
    .trim() || normalizePilotQuery(query);
}
