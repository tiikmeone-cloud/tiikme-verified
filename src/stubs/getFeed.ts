// Stub feed data for the Home page. TODO: wire to posts / post_reactions / user_follows.

export interface FeedPost {
  id: string
  author: string
  handle: string
  avatar: string
  time: string
  body: string
  image?: string
  likes: number
  reposts: number
  comments: number
  liked?: boolean
  bookmarked?: boolean
}

export interface SuggestedUser {
  id: string
  name: string
  handle: string
  avatar: string
  bio: string
  following?: boolean
}

const AV = (n: number) => `https://i.pravatar.cc/120?img=${n}`

export function getFeedPosts(): FeedPost[] {
  return [
    { id:'1', author:'Moyo Shiro', handle:'moyo', avatar:AV(12), time:'09:00 AM',
      body:"Just launched my new portfolio website! 🚀 Check out these 15 standout examples of creative, sleek, and interactive portfolio designs that inspired me. Which one's your favorite? #WebDesign #PortfolioInspiration",
      likes:62, reposts:23, comments:45 },
    { id:'2', author:'Sophia', handle:'sophia', avatar:AV(5), time:'10:12 AM',
      body:'Dreaming of distant worlds… 🌅 This AI-generated image captures the essence of exploration. What stories does it spark in your imagination?',
      image:'https://picsum.photos/seed/astronaut/900/520', likes:59, reposts:16, comments:24, liked:true },
    { id:'3', author:'Totoro', handle:'totoro', avatar:AV(33), time:'10:40 AM',
      body:"🎨 Artist Spotlight: Just discovered the mesmerizing work of Hayao Miyazaki! His animated films blend fantasy, environmentalism, and deep human emotions. Any Studio Ghibli fans here? What's your favorite Miyazaki film? #StudioGhibli #Animation",
      likes:69, reposts:43, comments:55 },
    { id:'4', author:'Arthur', handle:'arthur', avatar:AV(15), time:'11:05 AM',
      body:'Shipping > perfecting. Got 3 features out this week by timeboxing each to a day. The constraint forced better decisions. Anyone else swear by timeboxing?',
      likes:34, reposts:9, comments:12 },
    { id:'5', author:'Madison', handle:'madison', avatar:AV(8), time:'11:34 AM',
      body:'Hot take: most “senior” design portfolios are just pretty screens. Show me the messy middle — the 14 versions you killed and why.',
      likes:128, reposts:31, comments:22 },
  ]
}

export function getSuggested(): SuggestedUser[] {
  return [
    { id:'u1', name:'George', handle:'george52', avatar:AV(13), bio:'I design digital products and ventures.', following:true },
    { id:'u2', name:'Nettie Schuster', handle:'Precious3', avatar:AV(45), bio:'The “No Code SaaS” Guy. Building a portfolio of software companies. Join my newsletter for free goodies on getting started in SaaS', following:true },
    { id:'u3', name:'Mrs. Lola Rohan', handle:'collin_marks', avatar:AV(48), bio:'I design digital products and ventures.', following:true },
    { id:'u4', name:'James', handle:'james24', avatar:AV(11), bio:'I design digital products and ventures.', following:false },
    { id:'u5', name:'Brandi Padberg', handle:'abbie_pollich34', avatar:AV(60), bio:'The “No Code SaaS” Guy. Building a portfolio of software companies.', following:false },
  ]
}

export interface Comment {
  id: string
  author: string
  handle: string
  avatar: string
  time: string
  body: string
  likes: number
  liked?: boolean
  replies?: Comment[]
}

export function getComments(postId: string): Comment[] {
  // demo thread — same set for any post
  return [
    { id:'c1', author:'Arthur', handle:'arthur', avatar:AV(15), time:'2h', likes:12,
      body:'This is so well put. The messy middle is where all the real learning happens.',
      replies:[
        { id:'c1r1', author:'Madison', handle:'madison', avatar:AV(8), time:'1h', likes:4, body:'100%. I started sharing my drafts and engagement tripled.' },
      ] },
    { id:'c2', author:'Sophia', handle:'sophia', avatar:AV(5), time:'1h', likes:7,
      body:'Saving this. Do you have a template for showing process work?' },
    { id:'c3', author:'Totoro', handle:'totoro', avatar:AV(33), time:'45m', likes:3,
      body:'Underrated take. Polish is cheap, judgment is expensive.' },
  ]
}

export const TRENDING = [
  { tag:'#WebDesign', posts:'12.4k posts' },
  { tag:'#StudioGhibli', posts:'8.1k posts' },
  { tag:'#BuildInPublic', posts:'6.7k posts' },
  { tag:'#NoCode', posts:'5.2k posts' },
  { tag:'#AIart', posts:'4.9k posts' },
  { tag:'#PortfolioInspiration', posts:'3.3k posts' },
]
