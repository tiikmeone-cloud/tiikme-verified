import type { PilotResponse } from './types';

interface FaqEntry {
  patterns: RegExp[];
  answer: string;
  action?: { label: string; url: string };
}

const FAQ_MAP: FaqEntry[] = [
  // What is Tiikme
  {
    patterns: [
      /\bwhat\s+is\s+tiikme\b/i,
      /\bhow\s+does?\s+(?:the\s+)?(?:platform|tiikme)\s+work\b/i,
      /\btiikme\s+(?:help|faq|guide)\b/i,
      /\btell\s+me\s+about\s+tiikme\b/i,
    ],
    answer:
      'Tiikme is a verified professional network built for healthcare, education, and allied sectors in India. Unlike generic platforms, every profile is linked to a real profession — doctors, nurses, engineers, teachers, and more. You earn an Activity Score by posting, connecting, and engaging. Verified professionals get a blue badge and unlock more platform features.',
    action: { label: 'Explore Tiikme →', url: '/app/explore' },
  },

  // Activity Score & Tiers
  {
    patterns: [
      /\bactivity\s+score\b/i,
      /\bwhat(?:'s|'s|\s+is)\s+(?:an?\s+)?activity\s+score\b/i,
      /\bhow\s+(?:is\s+)?(?:the\s+)?activity\s+score\s+(?:calculated|computed|work)\b/i,
      /\bwhat\s+(?:are\s+)?(?:the\s+)?tiers?\b/i,
      /\bnewcomer|explorer\s+tier|contributor\s+tier|expert\s+tier\b/i,
      /\bhow\s+(?:do\s+i\s+)?(?:increase|improve|boost)\s+(?:my\s+)?(?:score|points?)\b/i,
    ],
    answer:
      'Your Activity Score reflects how active and engaged you are on Tiikme. It is calculated from profile completeness, posts, comments, likes, connections, and followers.\n\n**Tiers:**\n- **Newcomer** — 0–49 pts\n- **Explorer** — 50–99 pts\n- **Contributor** — 100–199 pts\n- **Expert** — 200+ pts\n\nHigher tiers unlock features like creating Circles (requires Contributor + verified). Post regularly, engage with others, and keep your profile up-to-date to climb tiers.',
    action: { label: 'View my score →', url: '/app/profile' },
  },

  // Verification process
  {
    patterns: [
      /\bhow\s+(?:to\s+|do\s+i\s+)?(?:get\s+)?verif(?:y|ied)\b/i,
      /\bverification\s+(?:process|steps?|docs?|badge)\b/i,
      /\bhow\s+(?:to\s+)?(?:get\s+)?(?:a\s+)?(?:blue\s+)?(?:tick|badge|check)\b/i,
      /\bwhat\s+(?:is\s+)?(?:required\s+for\s+)?verification\b/i,
      /\bget\s+verified\b/i,
    ],
    answer:
      'Tiikme offers professional verification to confirm your identity and credentials. There are three verification methods:\n\n1. **Work Email** — Verify instantly using your official institutional email (e.g., hospital or university domain).\n2. **Document Upload** — Upload a government ID + professional certificate (medical registration, degree, etc.).\n3. **Manager Reference** — A verified senior colleague on Tiikme vouches for you.\n\nOnce verified, you get a blue badge on your profile and unlock advanced features like Circle creation.',
    action: { label: 'Start verification →', url: '/app/settings?tab=verification' },
  },

  // Privacy / employer visibility
  {
    patterns: [
      /\bcan\s+my\s+employer\s+see\b/i,
      /\bemployer\s+(?:see|find|view)\b/i,
      /\bopen\s+to\s+work\s+(?:visible|hidden|privacy|employer)\b/i,
      /\bothw\s+(?:visible|hidden|privacy)\b/i,
      /\bis\s+(?:open\s+to\s+work|otw)\s+(?:visible|private)\b/i,
    ],
    answer:
      'Your "Open to Work" (OTW) status is **hidden from your current employer by default**. Tiikme automatically detects if a viewer is from your current organization (matched via company email domain) and hides the OTW badge from them.\n\nYou can control this further in Privacy Settings → Open to Work visibility. Options include: Everyone, Only verified recruiters, or Hidden.',
    action: { label: 'Privacy settings →', url: '/app/settings?tab=privacy' },
  },

  // API access
  {
    patterns: [
      /\bapi\s+access\b/i,
      /\btiikme\s+api\b/i,
      /\bdeveloper\s+api\b/i,
      /\bpublic\s+api\b/i,
      /\bintegrat(?:e|ion)\s+(?:with\s+)?tiikme\b/i,
    ],
    answer:
      'The Tiikme API is currently in **private beta**. It is not publicly available yet. If you are a developer or organization interested in integrating with Tiikme, reach out to the team directly.\n\n📧 **developers@tiikme.com**\n\nInclude your use case and expected volume in your email.',
  },

  // How to create a Circle
  {
    patterns: [
      /\bhow\s+(?:to\s+|do\s+i\s+)?create\s+(?:a\s+)?circle\b/i,
      /\bcircle\s+creation\b/i,
      /\bstart\s+(?:a\s+|my\s+)?(?:own\s+)?circle\b/i,
      /\bwho\s+can\s+create\s+(?:a\s+)?circle\b/i,
    ],
    answer:
      'To create a Circle on Tiikme, you need:\n\n- **Activity Score ≥ 50 points** (Explorer tier or above)\n- **Verified profile** (blue badge)\n\nIf you meet both requirements, go to Circles → tap "Create Circle" → choose a name, description, visibility (public/private), and who can post.\n\nCircle admins can invite members, moderate posts, and set posting rules.',
    action: { label: 'Browse Circles →', url: '/app/circles' },
  },

  // What are campaigns
  {
    patterns: [
      /\bwhat\s+(?:are\s+)?campaigns?\b/i,
      /\bhow\s+(?:do\s+)?campaigns?\s+work\b/i,
      /\btiikme\s+campaigns?\b/i,
    ],
    answer:
      'Campaigns on Tiikme are organized initiatives — think of them as structured challenges, awareness drives, or community events. Organizations and verified users can launch campaigns that others can join, contribute to, or share.\n\nCampaigns can have goals, deadlines, and associated posts. They help surface collective action on the platform feed.',
    action: { label: 'Explore →', url: '/app/explore' },
  },

  // How to delete account
  {
    patterns: [
      /\bdelete\s+(?:my\s+)?account\b/i,
      /\bhow\s+(?:do\s+i\s+)?delete\s+(?:my\s+)?(?:account|profile)\b/i,
      /\bremove\s+(?:my\s+)?account\b/i,
      /\bclose\s+(?:my\s+)?account\b/i,
    ],
    answer:
      'To delete your Tiikme account:\n\n1. Go to **Settings**\n2. Tap **Account**\n3. Scroll to the bottom and tap **Delete Account**\n4. Confirm by entering your password\n\n⚠️ Account deletion is permanent. Your profile, posts, connections, and all data will be removed within 30 days. This action cannot be undone.',
    action: { label: 'Account settings →', url: '/app/settings?tab=account' },
  },

  // What are Circles
  {
    patterns: [
      /\bwhat\s+(?:is\s+a\s+|are\s+)?circles?\b/i,
      /\bexplain\s+circles?\b/i,
    ],
    answer:
      'Circles are topic-based communities on Tiikme — like groups, but for professionals. Each Circle has a theme (e.g., "Emergency Nurses India", "EdTech Founders"). Members can post, discuss, and share resources within the Circle.\n\nCircles can be **public** (anyone can join) or **private** (invite/request to join). Creating a Circle requires Contributor tier + verification.',
    action: { label: 'Browse Circles →', url: '/app/circles' },
  },

  // How the feed works
  {
    patterns: [
      /\bhow\s+does?\s+(?:the\s+)?feed\s+work\b/i,
      /\bhow\s+(?:is\s+)?(?:the\s+)?feed\s+(?:ranked|sorted|curated)\b/i,
      /\bwhat\s+(?:shows?\s+up\s+|appears?\s+)?(?:in|on)\s+(?:my\s+)?feed\b/i,
      /\bfeed\s+algorithm\b/i,
    ],
    answer:
      'The Tiikme feed is a ranked mix of:\n\n- Posts from people you follow and connections\n- Posts from Circles you have joined\n- Trending posts from your professional domain\n- Boosted/featured posts from verified organizations\n\nRanking factors include: recency, engagement (likes, comments, shares), your interaction history, and the Activity Score of the poster. The more you engage, the more personalized your feed becomes.',
  },

  // How connections work — Strands vs Follows
  {
    patterns: [
      /\bhow\s+(?:do\s+)?connections?\s+work\b/i,
      /\bwhat\s+(?:are\s+)?strands?\b/i,
      /\bstrands?\s+vs\s+(?:follow|connection)\b/i,
      /\bfollow\s+vs\s+strand\b/i,
      /\bdifference\s+between\s+(?:follow\s+and\s+strand|strand\s+and\s+follow)\b/i,
    ],
    answer:
      'Tiikme has two types of connections:\n\n**Strands** — Mutual connections. Both people must accept the request. Like LinkedIn connections. Once connected as Strands, you can message each other.\n\n**Follows** — One-way. You can follow anyone (like Twitter). Their posts appear in your feed but they are not notified unless they also follow you.\n\nStrands carry more weight in your Activity Score and unlock direct messaging.',
  },

  // Privacy policy
  {
    patterns: [
      /\bprivacy\s+policy\b/i,
      /\btiikme\s+privacy\b/i,
      /\bterms\s+(?:of\s+service|and\s+conditions)\b/i,
      /\bdata\s+policy\b/i,
    ],
    answer:
      'Tiikme\'s Privacy Policy explains how your data is collected, stored, and used. Key points:\n\n- Your email and phone are never shown publicly unless you explicitly enable it\n- Professional data is used only for the platform and not sold to third parties\n- You can export or delete your data at any time from Settings\n\nFor full details, see the Privacy Policy link in the app footer or Settings.',
    action: { label: 'Privacy settings →', url: '/app/settings?tab=privacy' },
  },
];

export function handlePlatformFaq(message: string): PilotResponse | null {
  for (const entry of FAQ_MAP) {
    const matched = entry.patterns.some(pattern => pattern.test(message));
    if (matched) {
      return {
        type: 'faq',
        content: entry.answer,
        action: entry.action,
      };
    }
  }
  return null;
}
