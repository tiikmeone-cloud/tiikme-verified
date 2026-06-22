'use client'

/**
 * SkillsRow — "Employment Skills" pattern from the RecruitSmart screenshots:
 * top skills across the applicant pool, each with an avatar-stack of who has it.
 * Clicking a skill filters the list to only candidates with that skill.
 */

import { useMemo } from 'react'
import type { OrgApplication } from '@/lib/applications'

interface Props {
  apps: OrgApplication[]
  active: string | null
  onPick: (skill: string | null) => void
}

export default function SkillsRow({ apps, active, onPick }: Props) {
  const top = useMemo(() => {
    const map = new Map<string, OrgApplication[]>()
    for (const a of apps) {
      for (const s of a.user_skills ?? []) {
        if (!map.has(s)) map.set(s, [])
        map.get(s)!.push(a)
      }
    }
    return [...map.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 8)
  }, [apps])

  if (top.length === 0) return null

  return (
    <div className="bg-card border border-line rounded-[14px] p-3">
      <div className="flex items-baseline justify-between mb-2.5">
        <p className="text-[11.5px] font-bold text-ink">Skills in this pool</p>
        <p className="text-[10.5px] text-ink-3">Click a skill to filter</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {top.map(([skill, list]) => {
          const isActive = active === skill
          return (
            <button key={skill} onClick={() => onPick(isActive ? null : skill)}
              className={`flex items-center gap-2 rounded-[10px] px-2.5 py-1.5 border transition-colors ${isActive ? 'bg-orange/10 border-orange/40' : 'bg-page border-line hover:border-orange/30'}`}>
              <span className={`text-[11.5px] font-semibold ${isActive ? 'text-orange' : 'text-ink'}`}>{skill}</span>
              <span className="flex -space-x-1.5">
                {list.slice(0, 3).map(a =>
                  a.user_avatar
                    ? <img key={a.app_id} src={a.user_avatar} alt="" className="w-5 h-5 rounded-full object-cover border border-card" /> /* eslint-disable-line @next/next/no-img-element */
                    : <span key={a.app_id} className="w-5 h-5 rounded-full bg-orange-soft text-orange text-[8.5px] font-bold flex items-center justify-center border border-card">
                        {(a.user_full_name ?? a.user_username).charAt(0).toUpperCase()}
                      </span>
                )}
              </span>
              <span className={`text-[10.5px] font-bold ${isActive ? 'text-orange' : 'text-ink-3'}`}>{list.length}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
