'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  bucket: string
  ownerId: string
  currentUrl: string | null
  fallback: string
  shape?: 'circle' | 'rounded'
  size?: number
  onUploaded: (publicUrl: string) => void | Promise<void>
}

export default function AvatarUpload({
  bucket, ownerId, currentUrl, fallback,
  shape = 'circle', size = 64, onUploaded,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl)

  const radius = shape === 'circle' ? 'rounded-full' : 'rounded-[16px]'

  const onPick = () => inputRef.current?.click()

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 4 * 1024 * 1024) { setError('Max 4 MB'); return }
    if (!/^image\//.test(file.type)) { setError('Image only'); return }

    setUploading(true)
    setError(null)
    const supabase = createClient()
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const path = `${ownerId}/${Date.now()}.${ext}`

    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(path, file, { cacheControl: '3600', upsert: true, contentType: file.type })

    if (upErr) { setUploading(false); setError(upErr.message); return }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    const publicUrl = data.publicUrl
    setPreviewUrl(publicUrl)
    try { await onUploaded(publicUrl) } finally { setUploading(false) }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={onPick}
        title="Change photo"
        className={[
          radius,
          'relative overflow-hidden bg-gradient-to-br from-orange to-orange-2 flex items-center justify-center text-white font-bold shrink-0 group',
        ].join(' ')}
        style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}>
        {previewUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={previewUrl} alt="" className="w-full h-full object-cover" />
          : <span>{fallback.charAt(0).toUpperCase()}</span>}
        <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-semibold">
          {uploading ? 'Uploading…' : 'Change'}
        </span>
      </button>
      <div>
        <button type="button" onClick={onPick} disabled={uploading}
          className="text-[12px] text-orange font-semibold hover:text-orange-2 transition-colors disabled:opacity-50">
          {uploading ? 'Uploading…' : previewUrl ? 'Change photo →' : 'Upload photo →'}
        </button>
        {error && <p className="text-[11px] text-red mt-1">{error}</p>}
        <p className="text-[10px] text-ink-3 mt-0.5">PNG/JPG · max 4 MB</p>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
    </div>
  )
}
