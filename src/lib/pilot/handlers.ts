import { supabase } from '@/integrations/supabase/client';
import type {
  PilotResponse,
  ProfileCard,
  JobCard,
  ApplicationItem,
  AnalyticsData,
  TrendingHashtag,
  CircleCard,
} from './types';

// ─── helpers ─────────────────────────────────────────────────────────────────

type Entities = {
  name?: string;
  location?: string;
  role?: string;
  jobKeyword?: string;
  faqKey?: string;
};

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    applied: '⏳ Applied',
    reviewing: '👀 Under Review',
    shortlisted: '⭐ Shortlisted',
    rejected: '❌ Not selected',
    hired: '🎉 Offer Extended',
  };
  return map[status] ?? status;
}

function getTier(score: number): string {
  if (score >= 200) return 'Expert';
  if (score >= 100) return 'Contributor';
  if (score >= 50) return 'Explorer';
  return 'Newcomer';
}

function getNextTier(score: number): number | null {
  if (score < 50) return 50;
  if (score < 100) return 100;
  if (score < 200) return 200;
  return null;
}

// ─── handleSearchProfile ─────────────────────────────────────────────────────

export async function handleSearchProfile(
  entities: Entities,
  currentUserId: string
): Promise<PilotResponse> {
  let query = supabase
    .from('profiles')
    .select(
      'id, full_name, headline, avatar_url, location_city, is_verified, activity_score, profession_type'
    )
    .neq('id', currentUserId)
    // Respect show_in_pilot_search privacy setting
    .or('privacy->show_in_pilot_search.is.null,privacy->show_in_pilot_search.eq.true')
    .order('activity_score', { ascending: false })
    .limit(5);

  if (entities.name) {
    query = query.ilike('full_name', `%${entities.name}%`);
  }
  if (entities.location) {
    query = query.ilike('location_city', `%${entities.location}%`);
  }
  if (entities.role) {
    // Filter by headline or profession_type
    query = query.or(
      `headline.ilike.%${entities.role}%,profession_type.ilike.%${entities.role}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    return {
      type: 'text',
      content: 'Sorry, I had trouble searching profiles. Please try again.',
    };
  }

  const cards: ProfileCard[] = (data || []).map((p: any) => ({
    id: p.id,
    full_name: p.full_name ?? 'Unknown',
    headline: p.headline,
    avatar_url: p.avatar_url,
    location_city: p.location_city,
    is_verified: p.is_verified ?? false,
    activity_score: p.activity_score ?? 0,
    profession_type: p.profession_type,
    connectionStatus: 'none',
  }));

  if (cards.length === 0) {
    return {
      type: 'text',
      content: `I couldn't find any profiles matching your search${entities.name ? ` for "${entities.name}"` : ''}${entities.location ? ` in ${entities.location}` : ''}. Try broader terms or explore the community.`,
      action: { label: 'Explore profiles →', url: '/app/explore' },
    };
  }

  return {
    type: 'profile_results',
    cards,
  };
}

// ─── handleSearchJob ──────────────────────────────────────────────────────────

export async function handleSearchJob(
  entities: Entities,
  _currentUserId: string
): Promise<PilotResponse> {
  let query = supabase
    .from('opportunities')
    .select(
      'id, title, type, location, salary_min, salary_max, is_remote, created_at, org_id, organizations!left(name, logo_url)'
    )
    .eq('is_open', true)
    .order('created_at', { ascending: false })
    .limit(5);

  const keyword = entities.jobKeyword || entities.role;
  if (keyword) {
    query = query.ilike('title', `%${keyword}%`);
  }
  if (entities.location) {
    query = query.ilike('location', `%${entities.location}%`);
  }

  const { data, error } = await query;

  if (error) {
    return {
      type: 'text',
      content: 'Sorry, I had trouble searching jobs. Please try again.',
    };
  }

  const cards: JobCard[] = (data || []).map((j: any) => {
    const org = Array.isArray(j.organizations) ? j.organizations[0] : j.organizations;
    return {
      id: j.id,
      title: j.title,
      org_name: org?.name,
      org_logo: org?.logo_url ?? null,
      type: j.type,
      location: j.location,
      salary_min: j.salary_min,
      salary_max: j.salary_max,
      is_remote: j.is_remote ?? false,
      created_at: j.created_at,
    };
  });

  if (cards.length === 0) {
    return {
      type: 'text',
      content: `No open jobs found${keyword ? ` for "${keyword}"` : ''}${entities.location ? ` in ${entities.location}` : ''}. Check back later or browse all opportunities.`,
      action: { label: 'Browse jobs →', url: '/app/jobs' },
    };
  }

  return {
    type: 'job_results',
    cards,
  };
}

// ─── handleSearchOrg ──────────────────────────────────────────────────────────

export async function handleSearchOrg(
  entities: Entities,
  _currentUserId: string
): Promise<PilotResponse> {
  let query = supabase
    .from('organizations')
    .select('id, name, logo_url, city, type, industry, tagline, slug')
    .eq('status', 'active')
    .order('followers_count', { ascending: false })
    .limit(5);

  if (entities.name) {
    query = query.ilike('name', `%${entities.name}%`);
  }
  if (entities.location) {
    query = query.ilike('city', `%${entities.location}%`);
  }

  const { data, error } = await query;

  if (error) {
    return {
      type: 'text',
      content: 'Sorry, I had trouble searching organizations. Please try again.',
    };
  }

  if (!data || data.length === 0) {
    return {
      type: 'text',
      content: `No organizations found${entities.name ? ` matching "${entities.name}"` : ''}${entities.location ? ` in ${entities.location}` : ''}. Try different keywords.`,
      action: { label: 'Browse orgs →', url: '/app/explore?tab=orgs' },
    };
  }

  // Return as profile_results with org data shaped as ProfileCard for display flexibility
  const cards: ProfileCard[] = (data || []).map((o: any) => ({
    id: o.id,
    full_name: o.name,
    headline: o.tagline ?? o.industry ?? o.type,
    avatar_url: o.logo_url ?? null,
    location_city: o.city ?? null,
    is_verified: false,
    activity_score: 0,
    profession_type: o.type,
  }));

  return {
    type: 'profile_results',
    cards,
    content: 'Here are some organizations that match your search:',
  };
}

// ─── handleSearchCircle ───────────────────────────────────────────────────────

export async function handleSearchCircle(entities: Entities): Promise<PilotResponse> {
  let query = supabase
    .from('circles')
    .select('id, name, slug, member_count, description, post_count')
    .eq('status', 'active')
    .order('member_count', { ascending: false })
    .limit(5);

  if (entities.name) {
    query = query.ilike('name', `%${entities.name}%`);
  }

  const { data, error } = await query;

  if (error) {
    return {
      type: 'text',
      content: 'Sorry, I had trouble finding circles. Please try again.',
    };
  }

  if (!data || data.length === 0) {
    return {
      type: 'text',
      content: 'No active circles found. Be the first to start one!',
      action: { label: 'Browse circles →', url: '/app/circles' },
    };
  }

  const cards: CircleCard[] = (data || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    member_count: c.member_count ?? 0,
    description: c.description,
    post_count: c.post_count ?? 0,
  }));

  return {
    type: 'circle_results',
    cards,
  };
}

// ─── handleMyAnalytics ────────────────────────────────────────────────────────

export async function handleMyAnalytics(currentUserId: string): Promise<PilotResponse> {
  const [profileRes, postCountRes, strandCountRes, appsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, activity_score, is_verified, profession_type, follower_count')
      .eq('id', currentUserId)
      .single(),
    supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', currentUserId),
    supabase
      .from('strands')
      .select('*', { count: 'exact', head: true })
      .or(`requester_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
      .eq('status', 'accepted'),
    supabase
      .from('opportunity_applications')
      .select('id, status')
      .eq('applicant_id', currentUserId),
  ]);

  const profile = profileRes.data;
  const score = profile?.activity_score ?? 0;
  const isVerified = profile?.is_verified ?? false;
  const postCount = postCountRes.count ?? 0;
  const connCount = strandCountRes.count ?? 0;
  const followerCount = profile?.follower_count ?? 0;
  const applications = appsRes.data ?? [];
  const appCount = applications.length;
  const pendingApps = applications.filter(
    (a: any) => a.status === 'applied' || a.status === 'reviewing'
  ).length;

  const tier = getTier(score);
  const nextTier = getNextTier(score);

  const tips: string[] = [];
  if (!isVerified) {
    tips.push('Get verified to unlock Circle creation and more trust signals.');
  }
  if (postCount < 5) {
    tips.push('Post more often — content creation is one of the fastest ways to earn points.');
  }
  if (connCount < 10) {
    tips.push('Connect with more professionals in your field to grow your network.');
  }
  if (nextTier !== null) {
    tips.push(`You need ${nextTier - score} more points to reach the next tier (${getTier(nextTier)}).`);
  }

  const analyticsData: AnalyticsData = {
    name: profile?.full_name ?? undefined,
    score,
    tier,
    nextTier,
    postCount,
    connCount,
    followerCount,
    appCount,
    pendingApps,
    isVerified,
    tips,
  };

  return {
    type: 'analytics_card',
    data: analyticsData,
  };
}

// ─── handleMyApplications ─────────────────────────────────────────────────────

export async function handleMyApplications(currentUserId: string): Promise<PilotResponse> {
  const { data, error } = await supabase
    .from('opportunity_applications')
    .select(
      'id, status, created_at, opportunity_id, opportunities!left(id, title, org_id, organizations!left(name, logo_url))'
    )
    .eq('applicant_id', currentUserId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    return {
      type: 'text',
      content: 'Sorry, I had trouble fetching your applications. Please try again.',
    };
  }

  if (!data || data.length === 0) {
    return {
      type: 'text',
      content: "You haven't applied to any opportunities yet. Explore open roles and take the first step!",
      action: { label: 'Browse jobs →', url: '/app/jobs' },
    };
  }

  const applications: ApplicationItem[] = (data || []).map((a: any) => {
    const opp = Array.isArray(a.opportunities) ? a.opportunities[0] : a.opportunities;
    const org = opp
      ? Array.isArray(opp.organizations)
        ? opp.organizations[0]
        : opp.organizations
      : null;
    const status = a.status ?? 'applied';
    return {
      id: a.id,
      jobTitle: opp?.title,
      orgName: org?.name,
      orgLogo: org?.logo_url ?? null,
      status,
      statusLabel: getStatusLabel(status),
      appliedAt: a.created_at ?? '',
      jobId: opp?.id,
    };
  });

  return {
    type: 'applications_list',
    applications,
  };
}

// ─── handleTrending ───────────────────────────────────────────────────────────

export async function handleTrending(): Promise<PilotResponse> {
  const since = new Date(Date.now() - 86400000).toISOString();

  const { data, error } = await supabase
    .from('posts')
    .select('hashtags')
    .gte('created_at', since)
    .not('hashtags', 'is', null)
    .limit(200);

  if (error || !data) {
    // Fallback: grab most recent posts
    const { data: fallback } = await supabase
      .from('posts')
      .select('hashtags')
      .not('hashtags', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100);

    return buildTrendingFromPosts(fallback ?? []);
  }

  return buildTrendingFromPosts(data);
}

function buildTrendingFromPosts(rows: any[]): PilotResponse {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const tags: string[] = Array.isArray(row.hashtags) ? row.hashtags : [];
    for (const tag of tags) {
      const normalized = tag.toLowerCase().replace(/^#/, '');
      if (normalized) {
        counts[normalized] = (counts[normalized] ?? 0) + 1;
      }
    }
  }

  const hashtags: TrendingHashtag[] = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({
      tag: `#${tag}`,
      count,
      url: `/app/explore?hashtag=${encodeURIComponent(tag)}`,
    }));

  if (hashtags.length === 0) {
    return {
      type: 'text',
      content: 'No trending hashtags in the last 24 hours. Check back soon!',
      action: { label: 'Browse feed →', url: '/app/feed' },
    };
  }

  return {
    type: 'trending_card',
    hashtags,
  };
}

// ─── handlePrivacyQuestion ────────────────────────────────────────────────────

export async function handlePrivacyQuestion(
  _currentUserId: string
): Promise<PilotResponse> {
  return {
    type: 'text',
    content:
      'Your privacy on Tiikme is in your hands. Here\'s a quick overview:\n\n- **Profile visibility** — You can set your profile to Public or Private.\n- **Email / Phone** — Hidden by default; you opt-in to show them.\n- **Open to Work** — Hidden from your current employer automatically (matched by work email domain).\n- **Search visibility** — You can opt out of appearing in Pilot AI search.\n- **Data requests** — You can export or delete your data from Account Settings.\n\nVisit Privacy Settings to fine-tune who can see what.',
    action: { label: 'Privacy settings →', url: '/app/settings?tab=privacy' },
  };
}
