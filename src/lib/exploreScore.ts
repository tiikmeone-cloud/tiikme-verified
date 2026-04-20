/**
 * Unified Explore feed ranking — TikTok-style single algorithm,
 * Instagram-style mixed card types.
 *
 * score = w_connection * graphCloseness
 *       + w_activity   * (activityScore / 100)
 *       + w_recency    * exp(-hours / 24)
 *       + w_interest   * jaccard(userInterests, cardTags)
 *       + w_diversity  * (1 / seenCount[cardType])
 *
 * Anti-spam:
 *  - Same author cannot appear twice in a row.
 *  - Each card type capped at 30% of visible feed (rotates types).
 *  - Posts > 48h decay further.
 */

export type ExploreCardKind = "person" | "org" | "post" | "circle";

export interface MixedCard {
  id: string;
  kind: ExploreCardKind;
  /** Identity used for graph closeness lookups (person.id, org.created_by, post.author_id, circle.created_by) */
  authorId?: string | null;
  /** 0-100 — entity activity score (profile.activity_score, org.followers_count proxy, post engagement, circle active_7d). */
  activityScore?: number;
  /** Tags used for interest jaccard (skills, sectors, hashtags, type). */
  tags?: string[];
  /** ISO timestamp for recency decay. */
  createdAt?: string | null;
  /** Original entity (PersonCard/OrgCard/PostCard payload). */
  payload: any;
  /** Computed during ranking. */
  _score?: number;
}

export interface UserStrandsGraph {
  /** 1st-degree direct connections. */
  firstDegree: Set<string>;
  /** 2nd-degree (friends of friends). */
  secondDegree: Set<string>;
}

export interface ExploreUserContext {
  userId: string;
  interests: string[];
  graph: UserStrandsGraph;
}

const WEIGHTS = {
  connection: 0.35,
  activity: 0.25,
  recency: 0.20,
  interest: 0.15,
  diversity: 0.05,
};

const MAX_KIND_SHARE = 0.30;

function graphCloseness(authorId: string | null | undefined, g: UserStrandsGraph): number {
  if (!authorId) return 0;
  if (g.firstDegree.has(authorId)) return 1.0;
  if (g.secondDegree.has(authorId)) return 0.5;
  return 0.25; // assume 3rd-degree fallback for visible cards
}

function jaccard(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const A = new Set(a.map(s => s.toLowerCase()));
  const B = new Set(b.map(s => s.toLowerCase()));
  let intersect = 0;
  A.forEach(x => { if (B.has(x)) intersect++; });
  const union = A.size + B.size - intersect;
  return union === 0 ? 0 : intersect / union;
}

function recencyDecay(createdAt: string | null | undefined, kind: ExploreCardKind): number {
  if (!createdAt) return 0.3;
  const hours = (Date.now() - new Date(createdAt).getTime()) / 3600000;
  let decay = Math.exp(-hours / 24);
  if (kind === "post" && hours > 48) decay *= 0.5;
  return decay;
}

/** Score a card with current "seen counts" for diversity. */
function scoreCard(
  card: MixedCard,
  ctx: ExploreUserContext,
  seenCount: Record<string, number>,
): number {
  const closeness = graphCloseness(card.authorId, ctx.graph);
  const activity = Math.min((card.activityScore ?? 0) / 100, 1);
  const recency = recencyDecay(card.createdAt, card.kind);
  const interest = jaccard(ctx.interests, card.tags ?? []);
  const seen = seenCount[card.kind] ?? 0;
  const diversity = 1 / (seen + 1);

  return (
    WEIGHTS.connection * closeness +
    WEIGHTS.activity * activity +
    WEIGHTS.recency * recency +
    WEIGHTS.interest * interest +
    WEIGHTS.diversity * diversity
  );
}

/**
 * Greedy interleave: at each step, pick the highest-scoring card that
 * (a) doesn't repeat the last author and (b) doesn't push its kind past 30% share.
 */
export function rankExploreCards(
  cards: MixedCard[],
  ctx: ExploreUserContext,
): MixedCard[] {
  const pool = [...cards];
  const result: MixedCard[] = [];
  const seenCount: Record<string, number> = { person: 0, org: 0, post: 0, circle: 0 };
  let lastAuthor: string | null | undefined = null;

  while (pool.length > 0) {
    // Recompute scores with up-to-date seenCount each pass
    pool.forEach(c => { c._score = scoreCard(c, ctx, seenCount); });
    pool.sort((a, b) => (b._score ?? 0) - (a._score ?? 0));

    const total = result.length || 1;
    let pickedIdx = -1;
    for (let i = 0; i < pool.length; i++) {
      const candidate = pool[i];
      const kindShare = (seenCount[candidate.kind] ?? 0) / total;
      const wouldExceedCap = result.length >= 6 && kindShare >= MAX_KIND_SHARE;
      const sameAuthor = lastAuthor && candidate.authorId === lastAuthor;
      if (!wouldExceedCap && !sameAuthor) {
        pickedIdx = i;
        break;
      }
    }
    if (pickedIdx === -1) pickedIdx = 0; // fallback: take top

    const picked = pool.splice(pickedIdx, 1)[0];
    result.push(picked);
    seenCount[picked.kind] = (seenCount[picked.kind] ?? 0) + 1;
    lastAuthor = picked.authorId ?? null;
  }
  return result;
}
