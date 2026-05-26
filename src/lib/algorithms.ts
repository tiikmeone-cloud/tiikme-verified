/**
 * Tiikme Ranking Algorithms
 * Based on published research from TikTok, Instagram, YouTube, and LinkedIn recommendation systems.
 */

/* ─── CONTENT FRESHNESS DECAY ─── */

/** Half-lives in hours by content type */
export const HALF_LIVES: Record<string, number> = {
  post: 12,
  achievement: 72,
  opportunity: 168,
  verification: 336,
};

/** Exponential decay: e^(-λ * ageHours) where λ = ln(2)/halfLife */
export function freshnessDecay(ageHours: number, type: string = "post"): number {
  const halfLife = HALF_LIVES[type] || HALF_LIVES.post;
  return Math.exp(-0.693 * ageHours / halfLife);
}

/** Step-function freshness for feed posts — more predictable than pure exponential */
export function postFreshnessStep(ageHours: number): number {
  if (ageHours <= 2)   return 1.00;
  if (ageHours <= 6)   return 0.95;
  if (ageHours <= 12)  return 0.85;
  if (ageHours <= 24)  return 0.70;
  if (ageHours <= 72)  return 0.50;
  if (ageHours <= 168) return 0.30;
  return 0.15;
}

/* ─── ACTIVITY SCORE TIERS ─── */

export interface ActivityTier {
  min: number;
  max: number;
  name: string;
  color: string;
}

export const ACTIVITY_TIERS: ActivityTier[] = [
  { min: 0, max: 20, name: "Newcomer", color: "#9CA3C0" },
  { min: 21, max: 40, name: "Explorer", color: "#4A90D9" },
  { min: 41, max: 60, name: "Active", color: "#34C759" },
  { min: 61, max: 80, name: "Contributor", color: "#E8733A" },
  { min: 81, max: 100, name: "Leader", color: "#FFB800" },
];

export function getActivityTier(score: number): ActivityTier {
  return ACTIVITY_TIERS.find(t => score >= t.min && score <= t.max) || ACTIVITY_TIERS[0];
}

/* ─── FEED RANKING ─── */

export interface FeedRankingInput {
  post: {
    id: string;
    created_at: string | null;
    author_id: string | null;
    posted_by_org: string | null;
    author_sector?: string | null;
    author_profession_type?: string | null;
    author_role_subtype?: string | null;
    author_is_verified?: boolean;
    image_urls?: string[] | null;
    hashtags?: string[] | null;
    body?: string | null;
    mention_count?: number;
    reaction_count?: number;
    comment_count?: number;
    repost_count?: number;
    post_type?: string | null;
  };
  currentUser: {
    sector: string | null;
    profession_type?: string | null;
    role_subtype?: string | null;
    skills?: string[] | null;
  };
  connectionIds: Set<string>;
  followedOrgIds: Set<string>;
  followedUserIds?: Set<string>;
}

export function calculateFeedScore({
  post,
  currentUser,
  connectionIds,
  followedOrgIds,
  followedUserIds,
}: FeedRankingInput): number {
  const ageHours = post.created_at
    ? (Date.now() - new Date(post.created_at).getTime()) / 3600000
    : 9999;

  // Use step-function freshness for feed posts, exponential for achievements
  const decay = post.post_type === "achievement"
    ? freshnessDecay(ageHours, "achievement")
    : postFreshnessStep(ageHours);

  // Relationship score — connection (3x) > followed user (2x) > followed org (2.5x)
  const isConnection = connectionIds.has(post.author_id || "") ? 3.0 : 0;
  const isFollowedUser = !isConnection && followedUserIds?.has(post.author_id || "") ? 2.0 : 0;
  const isFollowedOrg = followedOrgIds.has(post.posted_by_org || "") ? 2.5 : 0;

  // Sector + profession + role match
  const sameSector =
    currentUser.sector && post.author_sector === currentUser.sector ? 1.5 : 0;
  const sameProfession =
    currentUser.profession_type && post.author_profession_type &&
    post.author_profession_type === currentUser.profession_type ? 2.0 : 0;
  const sameRole =
    currentUser.role_subtype && post.author_role_subtype &&
    post.author_role_subtype === currentUser.role_subtype ? 1.5 : 0;

  // Topic relevance: user's skills vs post hashtags + body text
  let topicBoost = 0;
  if (currentUser.skills && currentUser.skills.length > 0) {
    const userSkillsLower = currentUser.skills.map(s => s.toLowerCase());
    const postText = [
      ...(post.hashtags || []),
      ...(post.body || "").toLowerCase().split(/\s+/),
    ].map(t => t.toLowerCase().replace(/^#/, ""));
    let matches = 0;
    for (const skill of userSkillsLower) {
      if (postText.some(t => t.includes(skill) || skill.includes(t))) matches++;
    }
    topicBoost = Math.min(matches * 0.5, 2.0);
  }

  // Content quality
  const bodyLen = (post.body || "").length;
  const lengthBoost = bodyLen > 500 ? 1.2 : bodyLen > 200 ? 1.1 : 1.0;
  const hasHashtags = (post.hashtags || []).length > 0 ? 1.05 : 1.0;

  // Engagement velocity (normalized per hour, capped at 4x)
  const engagementCount =
    (post.reaction_count || 0) +
    (post.comment_count || 0) * 2 +
    (post.repost_count || 0) * 3;
  const engagementVelocity = Math.min(
    engagementCount / Math.max(ageHours * 0.5, 1),
    4.0
  );

  const isVerifiedAuthor = post.author_is_verified ? 1.2 : 0;
  const hasImages = post.image_urls && post.image_urls.length > 0 ? 1.15 : 0;
  const hasMentions = (post.mention_count || 0) > 0 ? 0.5 : 0;

  const baseWeight =
    isConnection +
    isFollowedUser +
    isFollowedOrg +
    sameSector +
    sameProfession +
    sameRole +
    topicBoost +
    engagementVelocity +
    isVerifiedAuthor +
    hasImages +
    hasMentions;

  // Apply content quality multipliers
  return decay * Math.max(baseWeight, 0.15) * lengthBoost * hasHashtags;
}

/**
 * Apply diversity rules:
 * - No more than 2 consecutive posts from the same author
 * - Inject 1 "discovery" post per 5 connection posts
 */
export function applyFeedDiversity(
  posts: Array<{ id: string; author_id: string | null; _score: number }>,
  connectionIds: Set<string>
): typeof posts {
  const connectionPosts: typeof posts = [];
  const nonConnectionPosts: typeof posts = [];

  for (const p of posts) {
    if (connectionIds.has(p.author_id || "")) {
      connectionPosts.push(p);
    } else {
      nonConnectionPosts.push(p);
    }
  }

  // Sort both by score
  connectionPosts.sort((a, b) => b._score - a._score);
  nonConnectionPosts.sort((a, b) => b._score - a._score);

  const result: typeof posts = [];
  let connIdx = 0;
  let discIdx = 0;
  let connCount = 0;

  while (connIdx < connectionPosts.length || discIdx < nonConnectionPosts.length) {
    // Inject 1 discovery post per 5 connection posts
    if (connCount >= 5 && discIdx < nonConnectionPosts.length) {
      result.push(nonConnectionPosts[discIdx++]);
      connCount = 0;
      continue;
    }

    if (connIdx < connectionPosts.length) {
      const candidate = connectionPosts[connIdx];
      // Diversity: skip if 2 consecutive same author
      const last2 = result.slice(-2);
      if (
        last2.length === 2 &&
        last2[0].author_id === candidate.author_id &&
        last2[1].author_id === candidate.author_id
      ) {
        // Push a discovery post instead, or skip
        if (discIdx < nonConnectionPosts.length) {
          result.push(nonConnectionPosts[discIdx++]);
        }
        connIdx++;
        continue;
      }
      result.push(candidate);
      connIdx++;
      connCount++;
    } else if (discIdx < nonConnectionPosts.length) {
      result.push(nonConnectionPosts[discIdx++]);
    }
  }

  return result;
}

/* ─── OPPORTUNITY MATCHING (client-side fallback) ─── */

/* Profession-type → job title keyword mapping */
export const PROFESSION_JOB_KEYWORDS: Record<string, string[]> = {
  working: [],
  healthcare: ['doctor','physician','nurse','medical','hospital','clinic','health','pharma','nursing','compounder'],
  student: ['intern','internship','fellowship','trainee','campus','graduate','fresher'],
  gig_worker: ['delivery','driver','freelance','gig','technician','plumber','electrician','photographer'],
  creator: ['content','creator','influencer','social media','youtube','video','media','blogger'],
  educator: ['teacher','tutor','faculty','lecturer','trainer','education','teaching','coach'],
  government: ['government','public sector','psu','ias','defence','civil services','municipal'],
  founder: ['ceo','cto','cfo','coo','cpo','vp ','director','head of','chief','c-level','managing director'],
};

export interface OpportunityMatchInput {
  opportunity: {
    title?: string | null;
    skills_required?: string[] | null;
    experience_min?: number | null;
    location?: string | null;
    is_remote?: boolean | null;
    domain?: string | null;
    activity_score_min?: number | null;
    created_at?: string | null;
  };
  userProfile: {
    skills?: string[] | null;
    location_city?: string | null;
    sector?: string | null;
    activity_score?: number | null;
    is_verified?: boolean | null;
    profession_type?: string | null;
    role_subtype?: string | null;
  };
  userExperienceYears?: number;
}

export function calculateOpportunityMatch({
  opportunity: o,
  userProfile: p,
  userExperienceYears = 0,
}: OpportunityMatchInput): number {
  // Skill overlap (20%)
  const requiredSkills = o.skills_required || [];
  const userSkills = new Set(p.skills || []);
  const skillOverlap = requiredSkills.length > 0
    ? requiredSkills.filter(s => userSkills.has(s)).length / requiredSkills.length
    : 0.5;

  // Profession type keyword match (10%)
  const titleLower = (o.title || '').toLowerCase();
  const keywords = p.profession_type ? (PROFESSION_JOB_KEYWORDS[p.profession_type] || []) : [];
  const roleKeywords = p.role_subtype ? p.role_subtype.toLowerCase().split(/[\s/&]+/) : [];
  const allKeywords = [...keywords, ...roleKeywords];
  const professionMatch = allKeywords.length > 0 && allKeywords.some(k => titleLower.includes(k)) ? 1.0 : 0.3;

  // Experience match (20%)
  let expScore = 0.5;
  if (o.experience_min != null) {
    if (userExperienceYears >= o.experience_min) expScore = 1.0;
    else if (userExperienceYears >= o.experience_min - 1) expScore = 0.7;
    else expScore = 0.3;
  }

  // Location match (15%)
  let locScore = 0.3;
  if (o.location && o.location === p.location_city) locScore = 1.0;
  else if (o.is_remote) locScore = 0.8;

  // Sector match (15%)
  const sectorMatch = p.sector && o.domain && p.sector === o.domain ? 1.0 : 0;

  // Activity score (10%)
  let actScore = 0.5;
  if (o.activity_score_min != null && o.activity_score_min > 0) {
    actScore = (p.activity_score || 0) >= o.activity_score_min
      ? 1.0
      : (p.activity_score || 0) / o.activity_score_min;
  }

  // Verified (10%)
  const verifiedScore = p.is_verified ? 1.0 : 0;

  // Freshness (5%)
  const ageHours = o.created_at
    ? (Date.now() - new Date(o.created_at).getTime()) / 3600000
    : 999;
  const fresh = freshnessDecay(ageHours, "opportunity");

  return (
    0.20 * skillOverlap +
    0.10 * professionMatch +
    0.18 * expScore +
    0.15 * locScore +
    0.12 * sectorMatch +
    0.10 * actScore +
    0.10 * verifiedScore +
    0.05 * fresh
  );
}

/* ─── EXPLORE ORG/PAGE RANKING (client-side) ─── */

export interface ExploreRankInput {
  page: {
    industry?: string | null;
    city?: string | null;
    state?: string | null;
    tracker_count?: number | null;
    trust_score?: number | null;
    created_at?: string | null;
  };
  userProfile: {
    sector?: string | null;
    location_city?: string | null;
    location_state?: string | null;
  };
}

export function calculateExploreScore({ page, userProfile }: ExploreRankInput): number {
  // Industry match (30%)
  const industryMatch = userProfile.sector && page.industry === userProfile.sector ? 1.0 : 0;

  // Location match (25%)
  let locScore = 0;
  if (page.city && page.city === userProfile.location_city) locScore = 1.0;
  else if (page.state && page.state === userProfile.location_state) locScore = 0.5;

  // Popularity (20%)
  const popularity = Math.min((page.tracker_count || 0) / 1000, 1.0);

  // Trust (15%)
  const trust = Math.min((page.trust_score || 0) / 100, 1.0);

  // Freshness — 720h (30 day) half-life (10%)
  const ageHours = page.created_at
    ? (Date.now() - new Date(page.created_at).getTime()) / 3600000
    : 9999;
  const fresh = Math.exp(-0.693 * ageHours / 720);

  return (
    0.30 * industryMatch +
    0.25 * locScore +
    0.20 * popularity +
    0.15 * trust +
    0.10 * fresh
  );
}
