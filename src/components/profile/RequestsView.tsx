'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/profile/ui/Toast'

interface FlexRequest {
  id: string
  org_id: string
  org_name: string
  org_slug: string
  org_logo_url: string | null
  status: 'pending' | 'approved' | 'declined'
  created_at: string
}

export default function RequestsView() {
  const [requests, setRequests] = useState<FlexRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user
      if (!user) { setLoading(false); return }
      supabase
        .from('flex_requests')
        .select('id, org_id, org_name, org_slug, org_logo_url, status, created_at')
        .eq('candidate_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          setRequests((data as FlexRequest[]) ?? [])
          setLoading(false)
        })
    })
  }, [])

  const updateStatus = async (id: string, status: 'approved' | 'declined') => {
    const supabase = createClient()
    const { error } = await supabase
      .from('flex_requests')
      .update({ status })
      .eq('id', id)
    if (error) { toast('Something went wrong'); return }

setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    toast(status === 'approved' ? 'Request approved ✓' : 'Request declined')
  }

  const pending  = requests.filter(r => r.status === 'pending')
  const approved = requests.filter(r => r.status === 'approved')
  const declined = requests.filter(r => r.status === 'declined')

  if (loading) return <p className="text-[12px] text-ink-3 py-12 text-center">Loading…</p>

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange">Flex Access</p>
        <h2 className="text-[20px] font-bold text-ink mt-1">Requests</h2>
        <p className="text-[12px] text-ink-3 mt-1">Organisations requesting access to your Flex.</p>
      </header>

      {requests.length === 0 && (
        <div className="text-center py-16 bg-card rounded-[16px] border border-line">
          <p className="text-[14px] font-semibold text-ink">No requests yet</p>
          <p className="text-[12px] text-ink-3 mt-1">When an org requests your Flex, it will appear here.</p>
        </div>
      )}

      {pending.length > 0 && (
        <section>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-3 mb-3">
            Pending · {pending.length}
          </p>
          <div className="space-y-2">
            {pending.map(r => <RequestCard key={r.id} req={r} onUpdate={updateStatus} />)}
          </div>
        </section>
      )}

      {approved.length > 0 && (
        <section>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-3 mb-3">Approved</p>
          <div className="space-y-2">
            {approved.map(r => <RequestCard key={r.id} req={r} onUpdate={updateStatus} />)}
          </div>
        </section>
      )}

      {declined.length > 0 && (
        <section>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-3 mb-3">Declined</p>
          <div className="space-y-2">
            {declined.map(r => <RequestCard key={r.id} req={r} onUpdate={updateStatus} />)}
          </div>
        </section>
      )}
    </div>
  )
}

function RequestCard({
  req,
  onUpdate,
}: {
  req: FlexRequest
  onUpdate: (id: string, status: 'approved' | 'declined') => void
}) {
  const [busy, setBusy] = useState(false)
  const handle = async (status: 'approved' | 'declined') => {
    setBusy(true)
    await onUpdate(req.id, status)
    setBusy(false)
  }
  const date = new Date(req.created_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <div className="bg-card border border-line rounded-[16px] p-4 flex items-center gap-4">
      {req.org_logo_url
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={req.org_logo_url} alt="" className="w-10 h-10 rounded-[10px] object-cover shrink-0" />
        : <span className="w-10 h-10 rounded-[10px] bg-orange-soft text-orange flex items-center justify-center text-[15px] font-bold shrink-0">
            {req.org_name.charAt(0).toUpperCase()}
          </span>}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-ink truncate">{req.org_name}</p>
        <p className="text-[11px] text-ink-3 mt-0.5">{date}</p>
      </div>
      {req.status === 'pending' && (
        <div className="flex items-center gap-2 shrink-0">
          <button
            disabled={busy}
            onClick={() => handle('approved')}
            className="text-[11.5px] font-semibold text-white bg-gradient-to-br from-orange to-orange-2 rounded-[9px] px-3 py-1.5 disabled:opacity-50 transition-opacity"
          >
            Approve
          </button>
          <button
            disabled={busy}
            onClick={() => handle('declined')}
            className="text-[11.5px] font-semibold text-ink-2 bg-card border border-line rounded-[9px] px-3 py-1.5 disabled:opacity-50 hover:border-orange/30 transition-colors"
          >
            Decline
          </button>
        </div>
      )}
      {req.status === 'approved' && (
        <span className="text-[10px] font-bold text-green bg-green/10 border border-green/20 px-2 py-0.5 rounded-full shrink-0">
          Approved
        </span>
      )}
      {req.status === 'declined' && (
        <span className="text-[10px] font-bold text-ink-3 bg-line/40 border border-line px-2 py-0.5 rounded-full shrink-0">
          Declined
        </span>
      )}
    </div>
  )
}
