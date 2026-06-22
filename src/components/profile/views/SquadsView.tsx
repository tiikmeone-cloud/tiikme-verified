'use client'

import { Card, Avatar, AvatarStack, EmptyState } from '@/components/profile/ui/Primitives'
import FirstVisitHint from '@/components/ui/FirstVisitHint'

// Squads = groups of people you actually worked / studied with (verified peers).
// Auto-grouped by organization or team. Different from follow/following.
interface SquadGroup {
  id: string
  org: string
  label: string          // "Engineering Team", "Design Squad"
  color: string
  period: string
  members: { initials: string; avatarColor: string; name: string; role: string; status: 'verified'|'pending' }[]
}

const SQUADS: SquadGroup[] = [
  {
    id: 'sq1', org: 'ByteCloud', label: 'Engineering Core Team', color: 'from-purple to-[#8A6EF0]', period: '2022 – present',
    members: [
      { initials:'AS', avatarColor:'from-purple to-[#8A6EF0]', name:'Aarav Sharma',  role:'Full-Stack Eng', status:'verified' },
      { initials:'KR', avatarColor:'from-orange to-orange-2',  name:'Karthik Reddy', role:'DevOps Architect', status:'verified' },
      { initials:'DS', avatarColor:'from-teal to-[#43C9BA]',   name:'Dev Shah',       role:'Intern (SWE)',    status:'verified' },
    ],
  },
  {
    id: 'sq2', org: 'FreshRoute', label: 'Product & Growth Squad', color: 'from-teal to-[#43C9BA]', period: '2021 – present',
    members: [
      { initials:'PN', avatarColor:'from-teal to-[#43C9BA]',   name:'Priya Nair',    role:'Lead Designer',  status:'verified' },
      { initials:'SK', avatarColor:'from-amber to-[#F8C155]',  name:'Sneha Kapoor',  role:'Marketing Lead', status:'verified' },
    ],
  },
  {
    id: 'sq3', org: 'MediSense', label: 'ML Research Team', color: 'from-green to-[#52D87E]', period: '2021 – present',
    members: [
      { initials:'MS', avatarColor:'from-green to-[#52D87E]',  name:'Meera Singh',   role:'ML Engineer',     status:'verified' },
      { initials:'RG', avatarColor:'from-purple to-[#8A6EF0]', name:'Rohan Gupta',   role:'Data Scientist',  status:'verified' },
      { initials:'RA', avatarColor:'from-teal to-[#43C9BA]',   name:'Riya Agarwal',  role:'Intern (DS)',     status:'pending' },
    ],
  },
  {
    id: 'sq4', org: 'NovaPay', label: 'Payments Core Infra', color: 'from-[#059669] to-[#34D399]', period: '2019 – present',
    members: [
      { initials:'RJ', avatarColor:'from-orange to-orange-2',  name:'Rahul Joshi',   role:'Principal Eng',  status:'verified' },
      { initials:'AK', avatarColor:'from-amber to-[#F8C155]',  name:'Arnav Khanna',  role:'Research (ECE)', status:'pending' },
    ],
  },
  {
    id: 'sq5', org: 'IIT Bombay Alumni', label: 'IITB Cohort 2016', color: 'from-orange to-orange-2', period: '2012 – 2016',
    members: [
      { initials:'AS', avatarColor:'from-purple to-[#8A6EF0]', name:'Aarav Sharma',  role:'CS / B.Tech',    status:'verified' },
      { initials:'PN', avatarColor:'from-teal to-[#43C9BA]',   name:'Priya Nair',    role:'ID / B.Tech',    status:'verified' },
      { initials:'DS', avatarColor:'from-green to-[#52D87E]',  name:'Dev Shah',       role:'CS / Current',   status:'pending' },
    ],
  },
  {
    id: 'sq6', org: 'PM / Product Circle', label: 'Product Mentorship Group', color: 'from-[#3B82F6] to-[#60A5FA]', period: '2024 – present',
    members: [
      { initials:'AP', avatarColor:'from-orange to-orange-2',  name:'Arjun Patel',   role:'Senior PM',      status:'verified' },
      { initials:'VJ', avatarColor:'from-purple to-[#8A6EF0]', name:'Vedant Jain',   role:'PM Trainee',     status:'verified' },
      { initials:'SK', avatarColor:'from-amber to-[#F8C155]',  name:'Sai Krishnan',  role:'MBA / Strategy', status:'pending' },
    ],
  },
]

export default function SquadsView() {
  const total = SQUADS.reduce((a, s) => a + s.members.length, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-ink leading-tight">Squads</h1>
          <FirstVisitHint id="squads"><p className="text-[12px] text-ink-3 mt-1">People you actually worked &amp; studied with — verified, not just followers.</p></FirstVisitHint>
        </div>
        <span className="text-[11px] font-semibold text-purple bg-purple/10 px-3 py-1.5 rounded-full">{total} verified peers</span>
      </div>

      {SQUADS.length === 0 ? (
        <Card>
          <EmptyState
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>}
            title="No squads yet"
            body="Add experience or education in My Flex, then verify your teammates. Confirmed peers show up here."
          />
        </Card>
      ) : (
        SQUADS.map(sq => (
          <Card key={sq.id} className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <Avatar name={sq.org} size={44} square color={sq.color} />
              <div className="flex-1">
                <p className="text-[15px] font-bold text-ink">{sq.org} · {sq.label}</p>
                <p className="text-[11px] text-ink-3">{sq.period} · {sq.members.length} people</p>
              </div>
              <AvatarStack members={sq.members} />
            </div>
            <div className="space-y-1">
              {sq.members.map((m, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-[11px] hover:bg-page transition-colors">
                  <Avatar name={m.name} size={36} color={m.avatarColor} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-ink truncate">{m.name}</p>
                    <p className="text-[11px] text-ink-3 truncate">{m.role}</p>
                  </div>
                  {m.status === 'verified' ? (
                    <span className="text-[10px] font-semibold text-green bg-green/10 px-2 py-0.5 rounded-full">✓ Verified</span>
                  ) : (
                    <span className="text-[10px] font-semibold text-amber bg-amber/10 px-2 py-0.5 rounded-full">Pending</span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))
      )}
    </div>
  )
}
