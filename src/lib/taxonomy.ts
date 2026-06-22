/**
 * SmartSelect taxonomy — dropdown options + "Other" crowdsourcing.
 *
 * Each field has a curated default list. When a user picks "Other" and types
 * a value, we record it via `record_custom_value`. Once a custom value is seen
 * ≥3 times, `popular_custom_values` promotes it into the live dropdown.
 *
 * This is how the taxonomy self-heals — we start opinionated, the crowd fills gaps.
 */

import { createClient } from '@/lib/supabase/client'

export type FieldKey =
  | 'role_title'
  | 'job_function'
  | 'experience_level'
  | 'skill'
  | 'certification'
  | 'industry'
  | 'company_size'
  | 'work_mode'
  | 'job_type'
  | 'study_field'
  | 'degree'
  | 'creator_platform'
  | 'creator_niche'
  | 'collab_type'
  | 'brand_category'
  | 'org_type'

/** Curated defaults — opinionated, India-aware, broader than LinkedIn's stiff lists. */
export const DEFAULTS: Record<FieldKey, string[]> = {
  role_title: [
    // Design
    'Product Designer', 'Senior Product Designer', 'UX Designer', 'UI Designer',
    'UX Researcher', 'Graphic Designer', 'Visual Designer', 'Motion Designer',
    'Brand Designer', 'Design Lead', 'Design Manager', 'Illustrator', 'Webflow Designer',
    // Engineering
    'Frontend Engineer', 'Backend Engineer', 'Full-stack Engineer', 'Mobile Engineer',
    'iOS Engineer', 'Android Engineer', 'Data Engineer', 'Data Scientist',
    'ML Engineer', 'AI Engineer', 'MLOps Engineer', 'DevOps Engineer',
    'Platform Engineer', 'Site Reliability Engineer', 'Security Engineer',
    'QA Engineer', 'Test Automation Engineer', 'Embedded Engineer', 'Blockchain Engineer',
    'Engineering Manager', 'Staff Engineer', 'Tech Lead', 'Solutions Architect', 'CTO',
    // Product / Project
    'Product Manager', 'Senior Product Manager', 'Group Product Manager',
    'Product Owner', 'Program Manager', 'Project Manager', 'Technical Program Manager',
    'Business Analyst', 'Product Analyst', 'Scrum Master',
    // Data / Analytics
    'Data Analyst', 'Business Intelligence Analyst', 'Analytics Engineer', 'Research Scientist',
    // Marketing / Growth / Content
    'Marketing Manager', 'Performance Marketer', 'Growth Marketer', 'SEO Specialist',
    'Social Media Manager', 'Content Strategist', 'Content Writer', 'Copywriter',
    'Brand Manager', 'Community Manager', 'Email Marketer', 'PR / Communications',
    // Sales / Success / Ops
    'Sales Executive', 'Account Executive', 'Sales Development Rep', 'Account Manager',
    'Customer Success Manager', 'Customer Support', 'Operations Manager',
    'Business Development Manager', 'Partnerships Manager', 'Revenue Operations',
    // People / Finance / Legal / Admin
    'HR / Recruiter', 'Talent Acquisition', 'HR Business Partner', 'People Ops',
    'Finance Analyst', 'Accountant', 'Financial Controller', 'Legal Counsel',
    'Office Manager', 'Executive Assistant',
    // Content / Media / Creator
    'Video Editor', 'Photographer', 'Animator', 'Producer', 'Podcast Producer',
    // Leadership
    'Founder', 'Co-founder', 'Consultant', 'Chief of Staff', 'General Manager',
    // Field / Ops / Skilled (grey & blue collar)
    'Field Sales', 'Delivery Executive', 'Warehouse Associate', 'Store Manager',
    'Telecaller', 'Customer Care Executive', 'Electrician', 'Technician',
    'Driver', 'Security Guard', 'Chef / Cook', 'Beautician',
  ],
  job_function: [
    'Engineering', 'Design', 'Product', 'Data & Analytics', 'AI / ML',
    'Marketing', 'Growth', 'Sales', 'Customer Success', 'Operations',
    'Finance', 'People / HR', 'Legal', 'Content / Editorial', 'Media / Creative',
    'Business Development', 'Strategy', 'Support', 'IT', 'Field / On-ground',
  ],
  experience_level: [
    'Internship', 'Entry level', 'Junior (0–2 yrs)', 'Mid level (2–5 yrs)',
    'Senior (5–8 yrs)', 'Lead / Staff (8+ yrs)', 'Manager', 'Director / Head', 'Executive',
  ],
  skill: [
    // Engineering
    'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Python', 'Java', 'Go',
    'Rust', 'SQL', 'PostgreSQL', 'GraphQL', 'REST APIs', 'AWS', 'Docker', 'Kubernetes',
    'CI/CD', 'System Design', 'Microservices', 'Redis', 'Kafka', 'Swift', 'Kotlin',
    'Flutter', 'React Native',
    // Data / AI
    'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Pandas', 'Data Analysis',
    'Tableau', 'Power BI', 'NLP', 'LLMs', 'Prompt Engineering', 'MLOps',
    // Design
    'Figma', 'Sketch', 'Prototyping', 'Design Systems', 'User Research', 'Wireframing',
    'Interaction Design', 'Motion Design', 'Adobe XD', 'Photoshop', 'Illustrator',
    'After Effects', 'Webflow', 'Branding', 'Typography',
    // Product
    'Roadmapping', 'Agile', 'Scrum', 'Jira', 'Stakeholder Management', 'A/B Testing',
    'Product Analytics',
    // Marketing / Growth
    'SEO', 'SEM', 'Google Ads', 'Meta Ads', 'Content Marketing', 'Email Marketing',
    'Copywriting', 'Social Media', 'Growth', 'HubSpot',
    // Sales / CS / Ops
    'Salesforce', 'CRM', 'Lead Generation', 'Negotiation', 'Account Management',
    'Customer Onboarding', 'Excel', 'Inventory Management', 'Logistics',
    // General
    'Communication', 'Leadership', 'Project Management', 'Problem Solving',
  ],
  certification: [
    'AWS Certified Solutions Architect', 'AWS Certified Developer', 'Google Cloud Professional',
    'Microsoft Azure Fundamentals', 'Google UX Design', 'Google Data Analytics',
    'Google Project Management', 'Google Ads Certification', 'Meta Front-End Developer',
    'Meta Marketing Professional', 'HubSpot Inbound', 'PMP', 'Certified ScrumMaster (CSM)',
    'Six Sigma Green Belt', 'CFA', 'CPA', 'Tableau Desktop Specialist',
    'Cisco CCNA', 'CompTIA Security+', 'CISSP', 'Certified Kubernetes Administrator (CKA)',
    'TensorFlow Developer', 'Adobe Certified Professional', 'Salesforce Administrator',
    'ITIL Foundation', 'NPTEL Certification', 'Credly Verified Badge',
  ],
  industry: [
    'Software / SaaS', 'Fintech', 'E-commerce', 'Healthtech', 'Edtech',
    'AI / ML', 'Gaming', 'Media & Entertainment', 'Logistics', 'Real Estate',
    'Manufacturing', 'Retail / D2C', 'Banking', 'Consulting', 'Government / Public',
    'Non-profit', 'Agriculture', 'Travel & Hospitality', 'Telecom', 'Energy',
  ],
  company_size: ['1–10', '11–50', '51–200', '201–500', '501–1000', '1000–5000', '5000+'],
  work_mode: ['Remote', 'Hybrid', 'On-site'],
  job_type: ['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance', 'Gig', 'Apprenticeship'],
  study_field: [
    'Computer Science', 'Information Technology', 'Electronics', 'Mechanical',
    'Civil', 'Electrical', 'Design', 'Commerce', 'Economics', 'Business / MBA',
    'Arts / Humanities', 'Science', 'Law', 'Medicine', 'Architecture',
  ],
  degree: [
    'B.Tech / B.E.', 'B.Sc', 'B.Com', 'B.A.', 'BBA', 'BCA',
    'M.Tech / M.E.', 'M.Sc', 'M.Com', 'M.A.', 'MBA', 'MCA',
    'Diploma', 'PhD', 'ITI', 'Certificate Course',
  ],
  creator_platform: [
    'YouTube', 'Instagram', 'LinkedIn', 'X / Twitter', 'TikTok', 'Twitch',
    'Substack', 'Medium', 'Dribbble', 'Behance', 'GitHub', 'Podcast',
  ],
  creator_niche: [
    'Tech / Coding', 'Design', 'Finance', 'Fitness', 'Food', 'Travel',
    'Fashion / Beauty', 'Gaming', 'Education', 'Comedy', 'Music', 'Business',
    'Lifestyle', 'Art', 'Photography', 'News / Commentary',
  ],
  collab_type: [
    'Brand deal / Sponsorship', 'Co-create content', 'Build a product together',
    'Affiliate / Revenue share', 'Guest appearance', 'Long-term partnership',
  ],
  brand_category: [
    'D2C product', 'SaaS / Software', 'Fashion / Apparel', 'Food & Beverage',
    'Fitness / Wellness', 'Finance / Fintech', 'Beauty / Personal care',
    'Electronics', 'Education', 'Travel', 'Gaming', 'Automotive',
  ],
  org_type: [
    'Startup', 'Scale-up', 'Enterprise', 'Agency', 'D2C brand', 'Non-profit',
    'Government', 'Educational institution', 'Public company', 'Studio / Lab',
  ],
}

/** Record a typed "Other" value so the taxonomy can learn it. */
export async function recordCustomValue(field: FieldKey, value: string): Promise<void> {
  try {
    const supabase = createClient()
    await supabase.rpc('record_custom_value', { p_field: field, p_value: value })
  } catch { /* best-effort — never block the user */ }
}

/** Pull crowd-promoted custom values to merge into the dropdown. */
export async function popularCustomValues(field: FieldKey): Promise<string[]> {
  try {
    const supabase = createClient()
    const { data } = await supabase.rpc('popular_custom_values', { p_field: field, p_min_count: 3, p_limit: 20 })
    return ((data as { display: string }[]) ?? []).map(r => r.display)
  } catch { return [] }
}
