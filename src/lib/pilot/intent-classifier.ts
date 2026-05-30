import type { IntentType, IntentResult } from './types';

// ─── Pattern maps ────────────────────────────────────────────────────────────

const SEARCH_PROFILE_PATTERNS: RegExp[] = [
  /\bfind\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/,
  /\bwho\s+is\b/i,
  /\blooking\s+for\b/i,
  /\bany\s+\w+\s+in\s+\w+/i,
  /\bsearch\s+for\b/i,
  /\bshow\s+me\s+(?:a\s+)?(?:doctor|nurse|engineer|developer|designer|manager|teacher|lawyer|ca|chef|pilot|pharmacist)/i,
  /\bprofile\s+of\b/i,
  /\bpeople\s+(?:in|from|near)\b/i,
  /\bconnect\s+(?:me\s+)?with\b/i,
  /\bfind\s+(?:a\s+)?(?:doctor|nurse|engineer|developer|designer|manager|teacher|lawyer|ca|chef|pilot|pharmacist)/i,
];

const SEARCH_JOB_PATTERNS: RegExp[] = [
  /\bjobs?\s+for\b/i,
  /\bhiring\b/i,
  /\bfind\s+jobs?\b/i,
  /\binternship\b/i,
  /\bvacancy\b/i,
  /\bvacancies\b/i,
  /\bjob\s+opening/i,
  /\bopen\s+position/i,
  /\bjobs?\s+in\b/i,
  /\bjobs?\s+at\b/i,
  /\b\w+\s+jobs?\b/i,
  /\bwork\s+(?:from\s+home|remotely|in)\b/i,
  /\bremote\s+(?:job|work|opportunity)/i,
  /\bfull.?time\b/i,
  /\bpart.?time\b/i,
  /\bfreelance\s+(?:job|work|gig)/i,
  /\bopportunit(?:y|ies)\s+(?:for|in|at)\b/i,
  /\bapply\s+(?:for\s+)?(?:a\s+)?job\b/i,
  /\bjob\s+(?:search|hunt|listing)/i,
];

const SEARCH_ORG_PATTERNS: RegExp[] = [
  /\bfind\s+(?:an?\s+)?org(?:anization)?\b/i,
  /\bwhich\s+compan(?:y|ies)\b/i,
  /\bhospital\s+in\b/i,
  /\bstartup\s+in\b/i,
  /\bcompan(?:y|ies)\s+(?:in|from|near)\b/i,
  /\borg(?:anization)?\s+(?:in|from|near|called)\b/i,
  /\bschool\s+in\b/i,
  /\bcollege\s+in\b/i,
  /\buniversity\s+in\b/i,
  /\bngos?\s+(?:in|near)\b/i,
  /\bclinic\s+in\b/i,
  /\bfirm\s+(?:in|called)\b/i,
  /\borganisations?\s+(?:in|from)\b/i,
];

const MY_PROFILE_PATTERNS: RegExp[] = [
  /\bmy\s+profile\b/i,
  /\bshow\s+my\s+profile\b/i,
  /\bmy\s+bio\b/i,
  /\bmy\s+about\b/i,
  /\bmy\s+headline\b/i,
  /\bmy\s+summary\b/i,
  /\btell\s+me\s+about\s+myself\b/i,
  /\bwhat(?:'s|'s|\s+is)\s+(?:in\s+)?my\s+profile\b/i,
  /\bmy\s+(?:professional\s+)?(?:info|information|details)\b/i,
  /\bshow\s+(?:me\s+)?my\s+(?:info|details|data)\b/i,
];

const MY_EXPERIENCE_PATTERNS: RegExp[] = [
  /\bmy\s+experience\b/i,
  /\bmy\s+work\s+(?:history|experience)\b/i,
  /\bwhere\s+(?:have\s+i|did\s+i)\s+worked\b/i,
  /\bjobs?\s+(?:i'?ve?\s+)?had\b/i,
  /\bprevious\s+(?:jobs?|companies|employers?|work)\b/i,
  /\bmy\s+(?:career|work)\s+history\b/i,
  /\bwhere\s+(?:have\s+i|did\s+i)\s+work(?:ed)?\b/i,
  /\bmy\s+(?:past|previous)\s+(?:employer|company|companies|job)\b/i,
  /\bmy\s+employment\b/i,
];

const MY_SKILLS_PATTERNS: RegExp[] = [
  /\bmy\s+skills?\b/i,
  /\bwhat\s+skills?\s+(?:do\s+i\s+have|i\s+have)\b/i,
  /\bmy\s+expertise\b/i,
  /\bmy\s+skill\s*set\b/i,
  /\bmy\s+(?:tech|technical)\s+skills?\b/i,
  /\bmy\s+abilities\b/i,
  /\bwhat\s+can\s+i\s+do\b/i,
  /\blist\s+my\s+skills?\b/i,
  /\bshow\s+(?:me\s+)?my\s+skills?\b/i,
];

const MY_ANALYTICS_PATTERNS: RegExp[] = [
  /\bmy\s+analytics\b/i,
  /\bmy\s+stats?\b/i,
  /\bmy\s+score\b/i,
  /\bhow\s+am\s+i\s+doing\b/i,
  /\bmy\s+activity\b/i,
  /\bmy\s+posts?\b/i,
  /\bmy\s+progress\b/i,
  /\bmy\s+profile\s+(?:score|stats?|analytics)\b/i,
  /\bactivity\s+score\s+(?:of\s+)?mine\b/i,
  /\bcheck\s+my\s+(?:score|stats?|analytics)\b/i,
  /\bhow\s+many\s+(?:points?|connections?|followers?)\s+(?:do\s+)?i\s+have\b/i,
  /\bwhat(?:'s|'s|\s+is)\s+my\s+(?:score|tier|rank|level)\b/i,
];

const MY_APPLICATIONS_PATTERNS: RegExp[] = [
  /\bmy\s+applications?\b/i,
  /\bdid\s+i\s+get\s+selected\b/i,
  /\bapplication\s+status\b/i,
  /\bcheck\s+(?:my\s+)?application\b/i,
  /\bwhere\s+did\s+i\s+apply\b/i,
  /\bjobs?\s+(?:i\s+)?applied\b/i,
  /\bapplied\s+(?:for\s+)?jobs?\b/i,
  /\bshortlisted\b/i,
  /\bunder\s+review\b/i,
  /\brejected\b/i,
  /\bwas\s+i\s+(?:selected|hired|shortlisted)\b/i,
  /\bmy\s+job\s+(?:applications?|status)\b/i,
];

const TRENDING_PATTERNS: RegExp[] = [
  /\btrending\b/i,
  /\btop\s+posts?\b/i,
  /\bwhat(?:'s|'s|\s+is)\s+popular\b/i,
  /\bhot\s+today\b/i,
  /\bhashtags?\s+trending\b/i,
  /\bpopular\s+(?:posts?|topics?|hashtags?)\b/i,
  /\bwhat(?:'s|'s|\s+is)\s+(?:hot|trending|viral)\b/i,
  /\bmost\s+liked\b/i,
  /\btop\s+hashtags?\b/i,
  /\bwhat\s+people\s+are\s+talking\b/i,
  /\blatest\s+(?:trends?|topics?)\b/i,
];

const PLATFORM_FAQ_PATTERNS: RegExp[] = [
  /\bwhat\s+is\s+tiikme\b/i,
  /\bactivity\s+score\b/i,
  /\bhow\s+to\s+(?:get\s+)?verif(?:y|ied)\b/i,
  /\bapi\s+access\b/i,
  /\btiikme\s+api\b/i,
  /\bprivacy\s+policy\b/i,
  /\bhow\s+(?:does?\s+)?(?:the\s+)?(?:platform|tiikme)\s+work\b/i,
  /\bwhat\s+are\s+(?:campaigns?|strands?)\b/i,
  /\bdelete\s+(?:my\s+)?account\b/i,
  /\bhow\s+(?:do\s+i\s+)?delete\b/i,
  /\bverification\s+(?:process|steps?|docs?)\b/i,
  /\bhow\s+(?:to\s+)?(?:get\s+)?(?:a\s+)?(?:blue\s+)?(?:tick|badge|check)\b/i,
  /\bwhat\s+is\s+(?:an?\s+)?activity\b/i,
  /\bwhat\s+(?:are\s+)?(?:the\s+)?tiers?\b/i,
  /\bexplorer|newcomer|contributor|expert\s+tier\b/i,
  /\bhow\s+does?\s+(?:the\s+)?feed\s+work\b/i,
  /\bhow\s+(?:do\s+)?connections?\s+work\b/i,
  /\bwhat\s+(?:are\s+)?strands?\b/i,
  /\bwhat\s+(?:are\s+)?campaigns?\b/i,
  /\btiikme\s+(?:help|faq|guide)\b/i,
];

const SEARCH_CAMPAIGN_PATTERNS: RegExp[] = [
  /\bcampaign\b/i,
  /\bcampaigns?\s+(?:today|new|latest|recent|open|active)\b/i,
  /\bnew\s+campaigns?\b/i,
  /\bactive\s+campaigns?\b/i,
  /\bbrand\s+(?:deal|deals|collab|collaboration)\b/i,
  /\bcreator\s+(?:campaign|opportunity)\b/i,
  /\binfluencer\s+(?:campaign|deal|opportunity)\b/i,
  /\bsponsorship\s+(?:opportunity|campaign)\b/i,
  /\bcollaboration\s+opportunity\b/i,
  /\bshow\s+(?:me\s+)?campaigns?\b/i,
  /\bfind\s+campaigns?\b/i,
];

const PRIVACY_QUESTION_PATTERNS: RegExp[] = [
  /\bwho\s+can\s+see\s+my\b/i,
  /\bis\s+my\s+(?:email|phone|number)\s+visible\b/i,
  /\bcan\s+my\s+employer\s+see\b/i,
  /\bam\s+i\s+searchable\b/i,
  /\bopen\s+to\s+work\s+(?:visible|hidden|privacy)\b/i,
  /\bwho\s+sees?\s+my\b/i,
  /\bis\s+my\s+profile\s+(?:private|public|visible|hidden)\b/i,
  /\bcan\s+(?:others?|people|anyone)\s+see\s+my\b/i,
  /\bhide\s+my\b/i,
  /\bmy\s+(?:data|info(?:rmation)?)\s+(?:private|safe|secure)\b/i,
  /\bdata\s+(?:privacy|security)\b/i,
  /\bblock\s+(?:someone|user)\b/i,
  /\bprofile\s+(?:visibility|privacy)\b/i,
];

// ─── Entity extraction helpers ────────────────────────────────────────────────

const ROLE_KEYWORDS = [
  'doctor', 'doctors',
  'nurse', 'nurses',
  'engineer', 'engineers',
  'developer', 'developers',
  'designer', 'designers',
  'manager', 'managers',
  'teacher', 'teachers',
  'lawyer', 'lawyers',
  'ca', 'accountant', 'accountants',
  'chef', 'chefs',
  'pilot', 'pilots',
  'pharmacist', 'pharmacists',
  'dentist', 'dentists',
  'architect', 'architects',
  'analyst', 'analysts',
  'consultant', 'consultants',
  'recruiter', 'recruiters',
  'intern', 'interns',
  'researcher', 'researchers',
  'surgeon', 'surgeons',
  'psychologist', 'psychologists',
  'therapist', 'therapists',
];

function extractName(message: string): string | undefined {
  // "find John Doe", "search for Jane Smith", "who is Alice"
  const namePatterns = [
    /\bfind\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/,
    /\bsearch\s+for\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/,
    /\bwho\s+is\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/i,
    /\bprofile\s+of\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/i,
    /\bshow\s+(?:me\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/,
  ];
  for (const pattern of namePatterns) {
    const m = message.match(pattern);
    if (m && m[1]) {
      // Make sure it's not a role keyword
      const candidate = m[1].toLowerCase();
      if (!ROLE_KEYWORDS.some(r => r === candidate)) {
        return m[1].trim();
      }
    }
  }
  return undefined;
}

function extractLocation(message: string): string | undefined {
  // "in [City]", "from [City]", "near [City]"
  const locationPatterns = [
    /\bin\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/,
    /\bfrom\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/,
    /\bnear\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/,
    /\bat\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/,
  ];
  for (const pattern of locationPatterns) {
    const m = message.match(pattern);
    if (m && m[1]) {
      return m[1].trim();
    }
  }
  return undefined;
}

function extractRole(message: string): string | undefined {
  const lower = message.toLowerCase();
  for (const role of ROLE_KEYWORDS) {
    if (lower.includes(role)) {
      // Return canonical singular form
      return role.replace(/s$/, '');
    }
  }
  return undefined;
}

function extractJobKeyword(message: string): string | undefined {
  // "[skill] jobs", "jobs for [role]"
  const patterns = [
    /\b(\w+)\s+jobs?\b/i,
    /\bjobs?\s+for\s+(\w+)\b/i,
    /\b(\w+)\s+(?:internship|vacancy|opening)\b/i,
    /\bhiring\s+(?:for\s+)?(\w+)\b/i,
  ];
  const stopWords = new Set(['find', 'show', 'get', 'me', 'the', 'a', 'an', 'any', 'all', 'some', 'remote', 'full', 'part', 'time']);
  for (const pattern of patterns) {
    const m = message.match(pattern);
    if (m && m[1] && !stopWords.has(m[1].toLowerCase())) {
      return m[1].toLowerCase();
    }
  }
  return undefined;
}

function extractDateFilter(message: string): 'today' | 'week' | null {
  if (/\btoday\b|\bthis\s+day\b/i.test(message)) return 'today';
  if (/\bthis\s+week\b|\blast\s+7\s+days?\b/i.test(message)) return 'week';
  return null;
}

// ─── Classifier ───────────────────────────────────────────────────────────────

function matchesAny(message: string, patterns: RegExp[]): boolean {
  return patterns.some(p => p.test(message));
}

export function classifyIntent(message: string): IntentResult {
  const msg = message.trim();

  // Check intents in priority order
  if (matchesAny(msg, SEARCH_CAMPAIGN_PATTERNS)) {
    return {
      type: 'SEARCH_CAMPAIGN',
      confidence: 0.9,
      extractedEntities: {
        name: extractName(msg),
        dateFilter: extractDateFilter(msg),
      },
    };
  }

    if (matchesAny(msg, PRIVACY_QUESTION_PATTERNS)) {
    return {
      type: 'PRIVACY_QUESTION',
      confidence: 0.9,
      extractedEntities: {},
    };
  }

  if (matchesAny(msg, MY_APPLICATIONS_PATTERNS)) {
    return {
      type: 'MY_APPLICATIONS',
      confidence: 0.9,
      extractedEntities: {},
    };
  }

  if (matchesAny(msg, MY_EXPERIENCE_PATTERNS)) {
    return {
      type: 'MY_EXPERIENCE',
      confidence: 0.9,
      extractedEntities: {},
    };
  }

  if (matchesAny(msg, MY_SKILLS_PATTERNS)) {
    return {
      type: 'MY_SKILLS',
      confidence: 0.9,
      extractedEntities: {},
    };
  }

  if (matchesAny(msg, MY_PROFILE_PATTERNS)) {
    return {
      type: 'MY_PROFILE',
      confidence: 0.9,
      extractedEntities: {},
    };
  }

  if (matchesAny(msg, MY_ANALYTICS_PATTERNS)) {
    return {
      type: 'MY_ANALYTICS',
      confidence: 0.9,
      extractedEntities: {},
    };
  }

  if (matchesAny(msg, PLATFORM_FAQ_PATTERNS)) {
    return {
      type: 'PLATFORM_FAQ',
      confidence: 0.85,
      extractedEntities: {},
    };
  }

  if (matchesAny(msg, TRENDING_PATTERNS)) {
    return {
      type: 'TRENDING',
      confidence: 0.85,
      extractedEntities: {},
    };
  }

  if (matchesAny(msg, SEARCH_ORG_PATTERNS)) {
    return {
      type: 'SEARCH_ORG',
      confidence: 0.85,
      extractedEntities: {
        name: extractName(msg),
        location: extractLocation(msg),
      },
    };
  }

  if (matchesAny(msg, SEARCH_JOB_PATTERNS)) {
    return {
      type: 'SEARCH_JOB',
      confidence: 0.85,
      extractedEntities: {
        location: extractLocation(msg),
        jobKeyword: extractJobKeyword(msg),
        role: extractRole(msg),
      },
    };
  }

  if (matchesAny(msg, SEARCH_PROFILE_PATTERNS)) {
    return {
      type: 'SEARCH_PROFILE',
      confidence: 0.85,
      extractedEntities: {
        name: extractName(msg),
        location: extractLocation(msg),
        role: extractRole(msg),
      },
    };
  }

  // Default fallback
  return {
    type: 'AI_QUERY',
    confidence: 0.5,
    extractedEntities: {},
  };
}
