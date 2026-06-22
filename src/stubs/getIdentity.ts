import type { UserRole } from '@/lib/profileTypes'

// Demo multi-role identity for the seed user.
// Shows tiikme's core thesis: one person, many verified hats.
export function getRoles(): UserRole[] {
  return [
    { id: 'r1', title: 'Co-founder & CTO', org: 'Tiikme', type: 'founder', current: true, primary: true },
    { id: 'r2', title: 'Angel Investor',    org: '',       type: 'investor', current: true, primary: false },
    { id: 'r3', title: 'Creator',           org: '',       type: 'creator',  current: true, primary: false },
  ]
}

export interface Person {
  id: string; name: string; initials: string; color: string; role: string; mutual?: number
}

export function getFollowers(): Person[] {
  return [
    { id:'f1', name:'Priya Sharma', initials:'PS', color:'from-purple to-[#8A6EF0]', role:'Product Designer · Bangalore', mutual:12 },
    { id:'f2', name:'Arjun Mehta',  initials:'AM', color:'from-teal to-[#43C9BA]',   role:'Frontend Engineer · Zeta',  mutual:8 },
    { id:'f3', name:'Sneha Rao',    initials:'SR', color:'from-orange to-orange-2',  role:'Backend Engineer · Remote', mutual:5 },
    { id:'f4', name:'Karan Patel',  initials:'KP', color:'from-green to-[#52D87E]',  role:'Indie Hacker · 12k', mutual:3 },
    { id:'f5', name:'Meera Iyer',   initials:'MI', color:'from-amber to-[#F8C155]',  role:'Data Scientist · Swiggy', mutual:2 },
  ]
}

export function getFollowing(): Person[] {
  return [
    { id:'g1', name:'Rohit Kumar',  initials:'RK', color:'from-purple to-[#8A6EF0]', role:'Eng Lead · Razorpay' },
    { id:'g2', name:'Ananya Desai', initials:'AD', color:'from-orange to-orange-2',  role:'Founder · Continue' },
    { id:'g3', name:'Vikram Singh', initials:'VS', color:'from-teal to-[#43C9BA]',   role:'VC · Blume Ventures' },
  ]
}

export const FOLLOW_COUNTS = { followers: 128, following: 64 }
