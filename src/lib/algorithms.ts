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
    author_is_verified?: boolean;
    image_urls?: string[] | null;
    mention_count?: number;
    reaction_count?: number;
    comment_count?: number;
    repost_count?: number;
    post_type?: string | null;
  };
  currentUser: {
    sector: string | null;
  };
  connectionIds: Set<string>;
  followedOrgIds: Set<string>;
}

export function calculateFeedScore({
  post,
  currentUser,
  connectionIds,
  followedOrgIds,
}: FeedRankingInput): number {
  // Freshness decay — 12-hour half-life for posts
  const ageHours = post.created_at
    ? (Date.now() - new Date(post.created_at).getTime()) / 3600000
    : 9999;
  const contentType = post.post_type === "achievement" ? "achievement" : "post";
  const decay = freshnessDecay(ageHours, contentType);

  // Relationship score
  const isConnection = connectionIds.has(post.author_id || "") ? 3.0 : 0;
  const isFollowedOrg = followedOrgIds.has(post.posted_by_org || "") ? 2.5 : 0;
  const sameSector =
    currentUser.sector && post.author_sector === currentUser.sector ? 1.5 : 0;

  // Engagement velocity
  const engagementCount =
    (post.reaction_count || 0) +
    (post.comment_count || 0) * 2 +
    (post.repost_count || 0) * 3;
  const engagementVelocity = Math.min(
    engagementCount / Math.max(ageHours, 1),
    5.0
  );

  // Content quality signals
  const isVerifiedAuthor = post.author_is_verified ? 1.2 : 0;
  const hasImages = post.image_urls && post.image_urls.length > 0 ? 1.1 : 0;
  const hasMentions = (post.mention_count || 0) > 0 ? 0.5 : 0;

  // Master score
  const baseWeight =
    isConnection +
    isFollowedOrg +
    sameSector +
    engagementVelocity +
    isVerifiedAuthor +
    hasImages +
    hasMentions;

  return decay * Math.max(baseWeight, 0.1);
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

export interface OpportunityMatchInput {
  opportunity: {
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
  };
  userExperienceYears?: number;
}

export function calculateOpportunityMatch({
  opportunity: o,
  userProfile: p,
  userExperienceYears = 0,
}: OpportunityMatchInput): number {
  // Skill overlap (25%)
  const requiredSkills = o.skills_required || [];
  const userSkills = new Set(p.skills || []);
  const skillOverlap = requiredSkills.length > 0
    ? requiredSkills.filter(s => userSkills.has(s)).length / requiredSkills.length
    : 0.5;

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
    0.25 * skillOverlap +
    0.20 * expScore +
    0.15 * locScore +
    0.15 * sectorMatch +
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
