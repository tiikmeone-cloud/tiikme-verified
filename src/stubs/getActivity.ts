// Stub activity data for the Overview ("The Rundown") and other views.
// TODO: replace each with live Supabase queries (posts, opportunity_applications, etc).

export interface JobApplication {
  id: string
  role: string
  company: string
  companyColor: string
  appliedAt: string
  // pipeline stage
  stage: 'applied' | 'viewed' | 'shortlisted' | 'interview' | 'offer' | 'rejected'
  location: string
}

export interface AlertItem {
  id: string
  type: 'follow' | 'job' | 'squad' | 'reaction' | 'system'
  title: string
  body: string
  at: string
  unread: boolean
}

export interface StashItem {
  id: string
  kind: 'job' | 'post' | 'person'
  title: string
  sub: string
  savedAt: string
  color: string
}

export function getRecentApplications(): JobApplication[] {
  return [
    { id: 'a1', role: 'Senior Product Designer', company: 'Razorpay', companyColor: '#3B82F6', appliedAt: '2d ago', stage: 'interview', location: 'Bangalore · Hybrid' },
    { id: 'a2', role: 'Design Lead', company: 'Zeta',     companyColor: '#6D4BD8', appliedAt: '5d ago', stage: 'shortlisted', location: 'Remote' },
    { id: 'a3', role: 'Founding Designer', company: 'Continue', companyColor: '#2BB3A3', appliedAt: '1w ago', stage: 'viewed', location: 'Hyderabad · On-site' },
    { id: 'a4', role: 'UX Designer', company: 'Swiggy', companyColor: '#F5A524', appliedAt: '2w ago', stage: 'rejected', location: 'Bangalore' },
  ]
}

export function getAlerts(): AlertItem[] {
  return [
    { id: 'n1', type: 'job',    title: 'Razorpay moved you to Interview', body: 'Your application for Senior Product Designer advanced.', at: '2h ago', unread: true },
    { id: 'n2', type: 'squad',  title: 'Arjun Mehta confirmed your squad', body: 'You both worked at Zeta. Now verified on your profile.', at: '6h ago', unread: true },
    { id: 'n3', type: 'follow', title: 'Priya Sharma started following you', body: 'Product Designer · Bangalore', at: '1d ago', unread: true },
    { id: 'n4', type: 'reaction', title: '48 people reacted to your drop', body: '“Shipped a new design-system token pipeline…”', at: '1d ago', unread: false },
    { id: 'n5', type: 'system', title: 'Your profile is 80% complete', body: 'Add 1 more experience to reach 100%.', at: '3d ago', unread: false },
  ]
}

export function getStash(): StashItem[] {
  return [
    { id: 's1', kind: 'job',    title: 'Staff Designer · Notion', sub: 'Remote · ₹80–1.2Cr',     savedAt: '1d ago', color: '#1B1B1D' },
    { id: 's2', kind: 'post',   title: 'Thread by @meeradesigns', sub: 'On pricing freelance work', savedAt: '4d ago', color: '#FF5C28' },
    { id: 's3', kind: 'person', title: 'Karan Patel', sub: 'Indie Hacker · 12k followers',         savedAt: '1w ago', color: '#2FB866' },
  ]
}
