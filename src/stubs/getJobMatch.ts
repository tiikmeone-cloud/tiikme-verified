export interface JobMatchFactor {
  label: string
  value: number
  color: string
}

export interface JobMatchData {
  score: number
  rank: string
  totalCandidates: number
  factors: JobMatchFactor[]
}

// TODO: replace with live AI matching engine (vector similarity + rule scoring)
export function getJobMatch(_userId?: string): JobMatchData {
  return {
    score: 73,
    rank: 'Top 18%',
    totalCandidates: 2400,
    factors: [
      { label: 'Skills',       value: 88, color: '#2FB866' },
      { label: 'Experience',   value: 75, color: '#2BB3A3' },
      { label: 'Location',     value: 90, color: '#2FB866' },
      { label: 'Education',    value: 60, color: '#F5A524' },
      { label: 'Availability', value: 80, color: '#2BB3A3' },
      { label: 'Profile',      value: 55, color: '#FF5C28' },
    ],
  }
}
