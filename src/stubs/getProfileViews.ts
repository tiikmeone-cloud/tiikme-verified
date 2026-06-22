export interface MonthlyViews {
  month: string
  views: number
}

export interface ProfileViewsData {
  total: number
  change: number
  trend: 'up' | 'down' | 'flat'
  monthly: MonthlyViews[]
}

// TODO: replace with live analytics from obs_events / explore_impressions
export function getProfileViews(_userId?: string): ProfileViewsData {
  return {
    total: 342,
    change: 12,
    trend: 'up',
    monthly: [
      { month: 'Jan', views: 38 },
      { month: 'Feb', views: 52 },
      { month: 'Mar', views: 45 },
      { month: 'Apr', views: 71 },
      { month: 'May', views: 88 },
      { month: 'Jun', views: 48 },
    ],
  }
}
