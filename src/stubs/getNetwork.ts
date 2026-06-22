export interface NetworkData {
  squads: number
  followers: number
  following: number
  nodes: Array<{ id: string; size: number; x: number; y: number; color: string }>
  edges: Array<{ from: string; to: string }>
}

// TODO: replace with live Supabase queries (user_follows, squad_edges)
export function getNetwork(_userId?: string): NetworkData {
  return {
    squads: 4,
    followers: 128,
    following: 64,
    nodes: [
      { id: 'you',  size: 18, x: 50,  y: 50,  color: '#FF5C28' },
      { id: 'n1',   size: 10, x: 22,  y: 28,  color: '#6D4BD8' },
      { id: 'n2',   size: 10, x: 75,  y: 22,  color: '#2BB3A3' },
      { id: 'n3',   size: 10, x: 80,  y: 72,  color: '#2FB866' },
      { id: 'n4',   size: 8,  x: 20,  y: 75,  color: '#F5A524' },
      { id: 'n5',   size: 7,  x: 55,  y: 20,  color: '#A1A0A4' },
      { id: 'n6',   size: 7,  x: 85,  y: 45,  color: '#A1A0A4' },
    ],
    edges: [
      { from: 'you', to: 'n1' },
      { from: 'you', to: 'n2' },
      { from: 'you', to: 'n3' },
      { from: 'you', to: 'n4' },
      { from: 'n1',  to: 'n5' },
      { from: 'n2',  to: 'n5' },
      { from: 'n2',  to: 'n6' },
    ],
  }
}
