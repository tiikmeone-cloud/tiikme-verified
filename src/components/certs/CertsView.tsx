'use client'

/**
 * CertsView — Level Up tab inside Profile (or callable from Jobs > Level Up).
 *
 * Shows the user's certs + lets them import (stub) or add manually.
 */

import { useEffect, useState } from 'react'
import { listMyCerts, addCert, type FlexCert, type CertSource } from '@/lib/certs'
import { Card } from '@/components/profile/ui/Primitives'
import { toast } from '@/components/profile/ui/Toast'

interface ConnectorMeta { id: CertSource; label: string; tagline: string; tint: string }

const CONNECTORS: ConnectorMeta[] = [
  { id: 'credly',   label: 'Credly',   tagline: 'IBM · AWS · Cisco · etc.',         tint: 'bg-orange/10 text-orange' },
  { id: 'coursera', label: 'Coursera', tagline: 'Verified course completions',      tint: 'bg-purple/10 text-purple' },
  { id: 'nsdc',     label: 'NSDC',     tagline: 'India · Skill India certifications', tint: 'bg-teal/10 text-teal' },
  { id: 'google',   label: 'Google',   tagline: 'Google Career Certificates',       tint: 'bg-amber/10 text-amber' },
]

export default function CertsView() {
  const [certs, setCerts] = useState<FlexCert[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState(''); const [issuer, setIssuer] = useState('')

  const refresh = async () => { setLoading(true); setCerts(await listMyCerts()); setLoading(false) }
  useEffect(() => { refresh() }, [])

  const submit = async () => {
    if (!name.trim() || !issuer.trim()) return
    const id = await addCert({ name: name.trim(), issuer: issuer.trim() })
    if (id) {
      toast(`✓ Added “${name}” from ${issuer}`)
      setName(''); setIssuer(''); setAdding(false)
      await refresh()
    }
  }

  const startImport = (c: ConnectorMeta) => {
    toast(`${c.label} import — OAuth will launch when keys are wired`)
  }

  return (
    <div className="space-y-5">
      {/* Connectors — import from external sources */}
      <Card className="p-5">
        <header className="mb-3">
          <h2 className="text-[15px] font-bold text-ink">Import verified certs</h2>
          <p className="text-[11.5px] text-ink-3 mt-0.5">
            OAuth-connected sources land as <b>✓ verified</b> on your Flex. Manual additions show as self-claimed.
          </p>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CONNECTORS.map(c => (
            <button key={c.id} onClick={() => startImport(c)}
              className="flex items-center gap-3 bg-page border border-line rounded-[12px] p-3 hover:border-orange/30 transition-colors text-left group">
              <span className={`w-9 h-9 rounded-[10px] flex items-center justify-center text-[14px] font-bold shrink-0 ${c.tint}`}>
                {c.label.charAt(0)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-semibold text-ink">{c.label}</p>
                <p className="text-[10.5px] text-ink-3 mt-0.5">{c.tagline}</p>
              </div>
              <span className="text-[11px] font-semibold text-orange opacity-0 group-hover:opacity-100 transition-opacity">Connect →</span>
            </button>
          ))}
        </div>
      </Card>

      {/* My certs */}
      <Card className="p-5">
        <header className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-bold text-ink">My certs</h2>
            <p className="text-[11.5px] text-ink-3 mt-0.5">{certs.length} on your Flex</p>
          </div>
          <button onClick={() => setAdding(s => !s)}
            className="text-[11.5px] font-semibold text-orange hover:text-orange-2">
            {adding ? 'Cancel' : '+ Add manually'}
          </button>
        </header>

        {adding && (
          <div className="bg-page border border-line rounded-[14px] p-3 mb-3 space-y-2">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Cert name (e.g. Figma Advanced)"
              className="w-full bg-card border border-line rounded-[10px] px-3 py-2 text-[12.5px] text-ink placeholder-ink-3 outline-none focus:border-orange/40" />
            <input value={issuer} onChange={e => setIssuer(e.target.value)} placeholder="Issuer (e.g. Figma)"
              className="w-full bg-card border border-line rounded-[10px] px-3 py-2 text-[12.5px] text-ink placeholder-ink-3 outline-none focus:border-orange/40" />
            <button onClick={submit} disabled={!name.trim() || !issuer.trim()}
              className="w-full text-[12px] font-semibold text-white bg-gradient-to-br from-orange to-orange-2 rounded-[10px] py-2 hover:opacity-95 disabled:opacity-50 transition-opacity">
              Save cert
            </button>
          </div>
        )}

        {loading && <p className="text-[12px] text-ink-3 py-6 text-center">Loading…</p>}
        {!loading && certs.length === 0 && (
          <p className="text-[12px] text-ink-3 italic py-3">No certs yet — import or add one manually.</p>
        )}

        <div className="space-y-1.5">
          {certs.map(c => (
            <div key={c.id} className="bg-page rounded-[12px] border border-line p-3 flex items-center gap-3">
              <span className="w-9 h-9 rounded-[10px] bg-purple/10 text-purple flex items-center justify-center text-[12px] font-bold shrink-0">
                {c.issuer.charAt(0)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[12.5px] font-semibold text-ink truncate">{c.name}</p>
                  {c.verified && <span className="text-[9px] font-bold text-purple bg-purple/10 px-1.5 py-0.5 rounded-full">✓ verified</span>}
                </div>
                <p className="text-[11px] text-ink-3 truncate">{c.issuer} · {c.source} · {c.issued_on ?? '—'}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
