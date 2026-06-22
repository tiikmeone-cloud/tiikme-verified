// Profile type synced with the new minimal AI-first schema.
// No vanity fields (no follower counts, no cover image, no resume_url).
export interface Profile {
  id: string
  username: string
  full_name: string | null
  headline: string | null
  about: string | null
  avatar_url: string | null
  open_to_work: boolean
  is_public: boolean
  skills: string[] | null
  location_city: string | null
  location_state: string | null
  country: string | null
  account_type?: string | null
  primary_org_slug?: string | null
  website?: string | null
  social_links?: {
    github?: string
    linkedin?: string
    twitter?: string
    dribbble?: string
    behance?: string
    youtube?: string
    instagram?: string
    portfolio?: string
  } | null
}

export const PROFILE_COLUMNS = [
  'id',
  'username',
  'full_name',
  'headline',
  'about',
  'avatar_url',
  'open_to_work',
  'is_public',
  'skills',
  'location_city',
  'location_state',
  'country',
  'account_type',
  'primary_org_slug',
  'website',
  'social_links',
].join(',')
