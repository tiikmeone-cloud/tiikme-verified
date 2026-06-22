import type { MetadataRoute } from 'next'

const BASE = 'https://tiikme.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    // ── Marketing ──────────────────────────────────────────────────────────
    { url: `${BASE}/`,        lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/company`, lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },

    // ── Legal ──────────────────────────────────────────────────────────────
    { url: `${BASE}/terms`,   lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },

    // ── Auth ───────────────────────────────────────────────────────────────
    { url: `${BASE}/sign-in`,  lastModified: now, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${BASE}/welcome`,  lastModified: now, changeFrequency: 'yearly', priority: 0.7 },

    // ── Core app (authenticated) ───────────────────────────────────────────
    { url: `${BASE}/home`,          lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/opportunities`, lastModified: now, changeFrequency: 'daily',  priority: 0.8 },
    { url: `${BASE}/profile/me`,    lastModified: now, changeFrequency: 'weekly', priority: 0.7 },

    // ── Public flex profiles are dynamic — generated separately ───────────
    // Use generateSitemaps() if you want to include /flex/[username] URLs
  ]
}
