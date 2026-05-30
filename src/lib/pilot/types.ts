export type IntentType =
  | 'SEARCH_PROFILE'
  | 'SEARCH_ORG'
  | 'SEARCH_JOB'
  | 'SEARCH_CAMPAIGN'
  | 'MY_ANALYTICS'
  | 'MY_APPLICATIONS'
  | 'MY_PROFILE'
  | 'MY_EXPERIENCE'
  | 'MY_SKILLS'
  | 'TRENDING'
  | 'PLATFORM_FAQ'
  | 'PRIVACY_QUESTION'
  | 'AI_QUERY';

export interface IntentResult {
  type: IntentType;
  confidence: number;
  extractedEntities: {
    name?: string;
    location?: string;
    role?: string;
    jobKeyword?: string;
    faqKey?: string;
    dateFilter?: 'today' | 'week' | null;
  };
}

export type PilotResponseType =
  | 'text'
  | 'profile_results'
  | 'job_results'
  | 'campaign_results'
  | 'analytics_card'
  | 'trending_card'
  | 'applications_list'
  | 'my_profile_card'
  | 'navigation'
  | 'limit_reached'
  | 'faq';

export interface PilotAction {
  label: string;
  url: string;
}

export interface ProfileCard {
  id: string;
  full_name: string;
  headline?: string | null;
  avatar_url?: string | null;
  location_city?: string | null;
  is_verified?: boolean;
  activity_score?: number;
  profession_type?: string;
  connectionStatus?: 'none' | 'pending' | 'accepted';
}

export interface JobCard {
  id: string;
  title: string;
  org_name?: string;
  org_logo?: string | null;
  type?: string;
  location?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  is_remote?: boolean;
  created_at?: string;
}

export interface ApplicationItem {
  id: string;
  jobTitle?: string;
  orgName?: string;
  orgLogo?: string | null;
  status: string;
  statusLabel: string;
  appliedAt: string;
  jobId?: string;
}

export interface AnalyticsData {
  name?: string;
  score: number;
  tier: string;
  nextTier: number | null;
  postCount: number;
  connCount: number;
  followerCount: number;
  appCount: number;
  pendingApps: number;
  isVerified: boolean;
  tips: string[];
}

export interface TrendingHashtag {
  tag: string;
  count: number;
  url: string;
}

export interface CampaignCard {
  id: string;
  title: string;
  org_name?: string;
  org_logo?: string | null;
  type?: string;
  status?: string;
  deadline?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  created_at?: string;
}

export interface ExperienceItem {
  role?: string | null;
  company?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_current?: boolean;
  description?: string | null;
  location?: string | null;
}

export interface MyProfileData {
  full_name?: string | null;
  headline?: string | null;
  about?: string | null;
  bio?: string | null;
  skills?: string[];
  designation?: string | null;
  department?: string | null;
  location_city?: string | null;
  location_state?: string | null;
  is_verified?: boolean;
  currently_working_at?: string | null;
  profession_type?: string | null;
  experience?: ExperienceItem[];
}

export interface PilotResponse {
  type: PilotResponseType;
  content?: string;
  cards?: ProfileCard[] | JobCard[] | CampaignCard[];
  applications?: ApplicationItem[];
  data?: AnalyticsData;
  myProfile?: MyProfileData;
  hashtags?: TrendingHashtag[];
  action?: PilotAction;
  isAiGenerated?: boolean;
  thinkingLabel?: string;
}
