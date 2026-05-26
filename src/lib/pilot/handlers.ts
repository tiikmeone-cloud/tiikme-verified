import { supabase } from '@/integrations/supabase/client';
import type {
  PilotResponse,
  ProfileCard,
  JobCard,
  ApplicationItem,
  AnalyticsData,
  TrendingHashtag,
  CircleCard,
  CampaignCard,
  MyProfileData,
  ExperienceItem,
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
    applied:     '⏳ Applied',
    pending:     '⏳ Under Review',
    reviewing:   '👀 Under Review',
    shortlisted: '⭐ Shortlisted',
    selected:    '🎉 Selected',
    approved:    '🎉 Approved',
    completed:   '✅ Completed',
    rejected:    '❌ Not selected',
    withdrawn:   '🔙 Withdrawn',
    hired:       '🎉 Offer Extended',
  };
  return map[status] ?? status.charAt(0).toUpperCase() + status.slice(1);
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
  // Use is_public (the real column). Fetch privacy JSONB so we can check
  // show_in_pilot_search and show_in_explore in JS.
  let query = supabase
    .from('profiles')
    .select(
      'id, full_name, headline, avatar_url, location_city, is_verified, activity_score, profession_type, privacy'
    )
    .neq('id', currentUserId)
    .eq('is_public', true)
    .order('activity_score', { ascending: false })
    .limit(30); // fetch more, then JS-filter by privacy settings

  if (entities.name) {
    query = query.ilike('full_name', `%${entities.name}%`);
  }
  if (entities.location) {
    query = query.ilike('location_city', `%${entities.location}%`);
  }
  if (entities.role) {
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

  // Filter out users who have opted out of Pilot search or Explore
  const visible = (data || []).filter((p: any) => {
    const priv = p.privacy;
    if (!priv || typeof priv !== 'object') return true;
    if (priv.show_in_explore === false) return false;
    if (priv.show_in_pilot_search === false) return false;
    return true;
  }).slice(0, 5);

  if (visible.length === 0) {
    return {
      type: 'text',
      content: `No profiles found${entities.name ? ` for "${entities.name}"` : ''}${entities.location ? ` in ${entities.location}` : ''}. Try broader terms or explore the community.`,
      action: { label: 'Explore profiles →', url: '/app/explore' },
    };
  }

  const cards: ProfileCard[] = visible.map((p: any) => ({
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

  return {
    type: 'profile_results',
    content: `Found ${cards.length} profile${cards.length !== 1 ? 's' : ''}${entities.role ? ` matching "${entities.role}"` : ''}${entities.location ? ` in ${entities.location}` : ''}`,
    cards,
  };
}

// ─── handleSearchJob ──────────────────────────────────────────────────────────

export async function handleSearchJob(
  entities: Entities,
  _currentUserId: string
): Promise<PilotResponse> {
  // Use named FK so PostgREST knows which relationship to use
  let query = supabase
    .from('opportunities')
    .select(
      'id, title, type, location, salary_min, salary_max, is_remote, created_at, org:organizations!opportunities_org_id_fkey(name, logo_url)'
    )
    .eq('is_open', true)
    .order('created_at', { ascending: false })
    .limit(6);

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

  const cards: JobCard[] = (data || []).map((j: any) => ({
    id: j.id,
    title: j.title,
    org_name: j.org?.name,
    org_logo: j.org?.logo_url ?? null,
    type: j.type,
    location: j.location,
    salary_min: j.salary_min,
    salary_max: j.salary_max,
    is_remote: j.is_remote ?? false,
    created_at: j.created_at,
  }));

  if (cards.length === 0) {
    return {
      type: 'text',
      content: `No open jobs found${keyword ? ` for "${keyword}"` : ''}${entities.location ? ` in ${entities.location}` : ''}. Check back later or browse all opportunities.`,
      action: { label: 'Browse jobs →', url: '/app/opportunities' },
    };
  }

  return {
    type: 'job_results',
    content: `Found ${cards.length} open role${cards.length !== 1 ? 's' : ''}${keyword ? ` for "${keyword}"` : ''}`,
    cards,
    action: { label: 'See all opportunities →', url: '/app/opportunities' },
  };
}

// ─── handleSearchOrg ──────────────────────────────────────────────────────────

export async function handleSearchOrg(
  entities: Entities,
  _currentUserId: string
): Promise<PilotResponse> {
  let query = supabase
    .from('organizations')
    .select('id, name, logo_url, city, state, type, industry, tagline, slug, is_verified, followers_count')
    .order('followers_count', { ascending: false, nullsFirst: false })
    .limit(6);

  if (entities.name) {
    query = query.ilike('name', `%${entities.name}%`);
  }
  if (entities.location) {
    query = query.or(`city.ilike.%${entities.location}%,state.ilike.%${entities.location}%`);
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
      action: { label: 'Browse orgs →', url: '/app/explore' },
    };
  }

  const cards: ProfileCard[] = data.map((o: any) => ({
    id: o.id,
    full_name: o.name,
    headline: o.tagline ?? [o.type, o.city].filter(Boolean).join(' · '),
    avatar_url: o.logo_url ?? null,
    location_city: o.city ?? null,
    is_verified: o.is_verified ?? false,
    activity_score: o.followers_count ?? 0,
    profession_type: o.type,
  }));

  return {
    type: 'profile_results',
    content: `Found ${cards.length} organization${cards.length !== 1 ? 's' : ''}`,
    cards,
    action: { label: 'Explore all orgs →', url: '/app/explore' },
  };
}

// ─── handleSearchCircle ───────────────────────────────────────────────────────

export async function handleSearchCircle(entities: Entities): Promise<PilotResponse> {
  let query = supabase
    .from('circles')
    .select('id, name, slug, member_count, description, post_count, visibility')
    .eq('visibility', 'public')
    .order('member_count', { ascending: false })
    .limit(6);

  if (entities.name) {
    query = query.ilike('name', `%${entities.name}%`);
  }
  if (entities.role) {
    query = query.or(`name.ilike.%${entities.role}%,description.ilike.%${entities.role}%`);
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
      content: 'No public circles found. Try browsing all communities.',
      action: { label: 'Browse circles →', url: '/app/circles' },
    };
  }

  const cards: CircleCard[] = data.map((c: any) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    member_count: c.member_count ?? 0,
    description: c.description,
    post_count: c.post_count ?? 0,
  }));

  return {
    type: 'circle_results',
    content: `Found ${cards.length} community circle${cards.length !== 1 ? 's' : ''}`,
    cards,
    action: { label: 'Browse all circles →', url: '/app/circles' },
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
      .select('id', { count: 'exact', head: true })
      .eq('author_id', currentUserId),
    supabase
      .from('strands')
      .select('id', { count: 'exact', head: true })
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
    (a: any) => a.status === 'applied' || a.status === 'pending' || a.status === 'reviewing'
  ).length;

  const tier = getTier(score);
  const nextTier = getNextTier(score);

  const tips: string[] = [];
  if (!isVerified) {
    tips.push('Get verified to unlock Circle creation and build more trust.');
  }
  if (postCount < 3) {
    tips.push('Post more — each post earns points and boosts your visibility.');
  }
  if (connCount < 5) {
    tips.push('Connect with more professionals in your field (+2 pts each).');
  }
  if (nextTier !== null && nextTier - score <= 30) {
    tips.push(`Only ${nextTier - score} more points to reach ${getTier(nextTier)} tier!`);
  }
  if (tips.length === 0) {
    tips.push('Keep engaging — you\'re doing great!');
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
  // Step 1: get applications with opportunity IDs
  const { data: appData, error: appError } = await supabase
    .from('opportunity_applications')
    .select('id, status, created_at, opportunity_id')
    .eq('applicant_id', currentUserId)
    .order('created_at', { ascending: false })
    .limit(6);

  if (appError) {
    return {
      type: 'text',
      content: 'Sorry, I had trouble fetching your applications. Please try again.',
    };
  }

  if (!appData || appData.length === 0) {
    return {
      type: 'text',
      content: "You haven't applied to any opportunities yet. Explore open roles and take the first step!",
      action: { label: 'Browse opportunities →', url: '/app/opportunities' },
    };
  }

  // Step 2: fetch opportunity details for each application
  const oppIds = appData.map((a: any) => a.opportunity_id).filter(Boolean);
  const { data: oppData } = await supabase
    .from('opportunities')
    .select('id, title, org:organizations!opportunities_org_id_fkey(name, logo_url)')
    .in('id', oppIds);

  const oppMap = new Map((oppData || []).map((o: any) => [o.id, o]));

  const applications: ApplicationItem[] = appData.map((a: any) => {
    const opp = oppMap.get(a.opportunity_id);
    const status = a.status ?? 'applied';
    return {
      id: a.id,
      jobTitle: opp?.title,
      orgName: opp?.org?.name,
      orgLogo: opp?.org?.logo_url ?? null,
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
  const since = new Date(Date.now() - 7 * 86400000).toISOString(); // last 7 days

  const { data } = await supabase
    .from('posts')
    .select('hashtags')
    .gte('created_at', since)
    .not('hashtags', 'is', null)
    .limit(300);

  // Fall back to all-time if no recent posts
  const rows = data && data.length > 0 ? data : await supabase
    .from('posts')
    .select('hashtags')
    .not('hashtags', 'is', null)
    .order('created_at', { ascending: false })
    .limit(200)
    .then(r => r.data ?? []);

  return buildTrendingFromPosts(Array.isArray(rows) ? rows : []);
}

function buildTrendingFromPosts(rows: any[]): PilotResponse {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const tags: string[] = Array.isArray(row.hashtags) ? row.hashtags : [];
    for (const tag of tags) {
      const normalized = tag.toLowerCase().replace(/^#/, '').trim();
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
      url: `/tag/${encodeURIComponent(tag)}`,
    }));

  if (hashtags.length === 0) {
    return {
      type: 'text',
      content: 'No trending hashtags right now. Be the first to start a conversation!',
      action: { label: 'Browse feed →', url: '/app/feed' },
    };
  }

  return {
    type: 'trending_card',
    hashtags,
  };
}

// ─── handleMyProfile ──────────────────────────────────────────────────────────

export async function handleMyProfile(currentUserId: string): Promise<PilotResponse> {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'full_name, headline, about, bio, skills, designation, department, location_city, location_state, is_verified, currently_working_at, profession_type'
    )
    .eq('id', currentUserId)
    .single();

  if (error || !data) {
    return {
      type: 'text',
      content: 'I could not load your profile. Please try again.',
    };
  }

  const profile = data as any;
  const myProfile: MyProfileData = {
    full_name: profile.full_name,
    headline: profile.headline,
    about: profile.about ?? profile.bio,
    bio: profile.bio,
    skills: Array.isArray(profile.skills) ? profile.skills : [],
    designation: profile.designation,
    department: profile.department,
    location_city: profile.location_city,
    location_state: profile.location_state,
    is_verified: profile.is_verified ?? false,
    currently_working_at: profile.currently_working_at,
    profession_type: profile.profession_type,
  };

  return {
    type: 'my_profile_card',
    myProfile,
    action: { label: 'Edit your profile →', url: '/app/settings?tab=profile' },
  };
}

// ─── handleMyExperience ───────────────────────────────────────────────────────

export async function handleMyExperience(currentUserId: string): Promise<PilotResponse> {
  // Try work_experience table first, then experience
  let rows: any[] | null = null;

  const { data: weData } = await supabase
    .from('work_experience' as any)
    .select('role, company, start_date, end_date, is_current, description, location')
    .eq('user_id', currentUserId)
    .order('start_date', { ascending: false });

  if (weData && weData.length > 0) {
    rows = weData as any[];
  } else {
    const { data: expData } = await supabase
      .from('experience' as any)
      .select('role, company, start_date, end_date, is_current, description, location')
      .eq('user_id', currentUserId)
      .order('start_date', { ascending: false });
    rows = expData as any[] | null;
  }

  // Also fetch currently_working_at from profiles as fallback
  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name, currently_working_at, headline')
    .eq('id', currentUserId)
    .single();

  if (!rows || rows.length === 0) {
    const workingAt = (profileData as any)?.currently_working_at;
    if (workingAt) {
      return {
        type: 'faq',
        content: `**Current workplace:** ${workingAt}\n\nNo detailed work history found. Add your experience from your profile settings to show a full history here.`,
        action: { label: 'Add experience →', url: '/app/settings?tab=profile' },
      };
    }
    return {
      type: 'text',
      content: "No work experience found on your profile yet. Add your experience to help others discover you and improve your Pilot results.",
      action: { label: 'Add experience →', url: '/app/settings?tab=profile' },
    };
  }

  const experience: ExperienceItem[] = rows.map((r: any) => ({
    role: r.role ?? r.title ?? r.position,
    company: r.company ?? r.company_name ?? r.organisation,
    start_date: r.start_date,
    end_date: r.end_date,
    is_current: r.is_current ?? false,
    description: r.description,
    location: r.location,
  }));

  return {
    type: 'my_profile_card',
    myProfile: { experience, full_name: (profileData as any)?.full_name },
    action: { label: 'Edit experience →', url: '/app/settings?tab=profile' },
  };
}

// ─── handleMySkills ───────────────────────────────────────────────────────────

export async function handleMySkills(currentUserId: string): Promise<PilotResponse> {
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, skills, headline, designation')
    .eq('id', currentUserId)
    .single();

  if (error || !data) {
    return {
      type: 'text',
      content: 'Could not load your skills. Please try again.',
    };
  }

  const profile = data as any;
  const skills: string[] = Array.isArray(profile.skills) ? profile.skills : [];

  if (skills.length === 0) {
    return {
      type: 'faq',
      content: `**${profile.full_name || 'You'} — Skills**\n\nYou haven't added any skills to your profile yet.\n\nAdding skills helps employers find you and improves how Pilot matches you to opportunities.`,
      action: { label: 'Add skills →', url: '/app/settings?tab=profile' },
    };
  }

  const skillLines = skills.map((s: string) => `• ${s}`).join('\n');
  return {
    type: 'faq',
    content: `**${profile.full_name || 'Your'} Skills** (${skills.length} listed)\n\n${skillLines}`,
    action: { label: 'Edit skills →', url: '/app/settings?tab=profile' },
  };
}


// ─── handleSearchCampaign ─────────────────────────────────────────────────────

export async function handleSearchCampaign(
  entities: Entities & { dateFilter?: 'today' | 'week' | null }
): Promise<PilotResponse> {
  let query = supabase
    .from('campaigns' as any)
    .select('id, title, type, status, deadline, budget_min, budget_max, created_at, org_id, org:organizations!campaigns_org_id_fkey(name, logo_url)')
    .in('status', ['active', 'open', 'published'])
    .order('created_at', { ascending: false })
    .limit(6);

  if (entities.dateFilter === 'today') {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    query = query.gte('created_at', todayStart.toISOString());
  } else if (entities.dateFilter === 'week') {
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    query = query.gte('created_at', weekAgo.toISOString());
  }

  if (entities.name) {
    query = query.ilike('title', `%${entities.name}%`);
  }

  const { data, error } = await query;

  if ((!data || data.length === 0) && entities.dateFilter === 'today') {
    const { data: recent } = await supabase
      .from('campaigns' as any)
      .select('id, title, type, status, deadline, budget_min, budget_max, created_at, org_id, org:organizations!campaigns_org_id_fkey(name, logo_url)')
      .in('status', ['active', 'open', 'published'])
      .order('created_at', { ascending: false })
      .limit(6);

    const cards: CampaignCard[] = ((recent || []) as any[]).map((c: any) => {
      const org = Array.isArray(c.org) ? c.org[0] : c.org;
      return {
        id: c.id, title: c.title, org_name: org?.name, org_logo: org?.logo_url ?? null,
        type: c.type, status: c.status, deadline: c.deadline,
        budget_min: c.budget_min, budget_max: c.budget_max, created_at: c.created_at,
      };
    });

    if (cards.length === 0) {
      return {
        type: 'text',
        content: 'No active campaigns found right now. Check back soon!',
        action: { label: 'Browse campaigns →', url: '/app/opportunities?tab=campaigns' },
      };
    }
    return { type: 'campaign_results', cards, content: 'No new campaigns today — here are the most recent active campaigns:' };
  }

  if (error) {
    return { type: 'text', content: 'Sorry, I had trouble searching campaigns. Please try again.' };
  }

  const cards: CampaignCard[] = ((data || []) as any[]).map((c: any) => {
    const org = Array.isArray(c.org) ? c.org[0] : c.org;
    return {
      id: c.id, title: c.title, org_name: org?.name, org_logo: org?.logo_url ?? null,
      type: c.type, status: c.status, deadline: c.deadline,
      budget_min: c.budget_min, budget_max: c.budget_max, created_at: c.created_at,
    };
  });

  if (cards.length === 0) {
    return {
      type: 'text',
      content: `No campaigns found${entities.name ? ` matching "${entities.name}"` : ''}. Try different keywords or check back later.`,
      action: { label: 'Browse campaigns →', url: '/app/opportunities?tab=campaigns' },
    };
  }

  const label = entities.dateFilter === 'today'
    ? `Found ${cards.length} new campaign${cards.length !== 1 ? 's' : ''} today:`
    : entities.dateFilter === 'week'
      ? `Found ${cards.length} campaign${cards.length !== 1 ? 's' : ''} this week:`
      : `Found ${cards.length} active campaign${cards.length !== 1 ? 's' : ''}:`;

  return { type: 'campaign_results', cards, content: label };
}

// ─── handlePrivacyQuestion ────────────────────────────────────────────────────

export async function handlePrivacyQuestion(
  _currentUserId: string
): Promise<PilotResponse> {
  return {
    type: 'faq',
    content:
      'Your privacy on Tiikme is fully in your hands. Here\'s what you control:\n\n' +
      '**Profile visibility** — Show or hide your location, company, education, and experience individually.\n\n' +
      '**Open to Work** — Hidden from your current employer by default (matched by company email domain).\n\n' +
      '**Pilot AI search** — Turn off "Appear in Pilot searches" and your profile won\'t show in any Pilot result.\n\n' +
      '**Email / Phone** — Hidden by default; you opt-in to share with connections.\n\n' +
      '**Data export or deletion** — Available from Account Settings any time.',
    action: { label: 'Privacy settings →', url: '/app/settings?tab=privacy' },
  };
}
