'use client'

import { useEffect, useState } from 'react'

// Fire from anywhere: toast('Saved!')
export function toast(message: string) {
  window.dispatchEvent(new CustomEvent('tk-toast', { detail: message }))
}

export function ToastHost() {
  const [items, setItems] = useState<{ id: number; msg: string }[]>([])

  useEffect(() => {
    const onToast = (e: Event) => {
      const msg = (e as CustomEvent<string>).detail
      const id = Date.now() + Math.random()
      setItems(prev => [...prev, { id, msg }])
      setTimeout(() => setItems(prev => prev.filter(i => i.id !== id)), 2600)
    }
    window.addEventListener('tk-toast', onToast)
    return () => window.removeEventListener('tk-toast', onToast)
  }, [])

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] flex flex-col items-center gap-2">
      {items.map(i => (
        <div key={i.id} className="bg-ink text-white text-[12px] font-medium px-4 py-2.5 rounded-[12px] shadow-[0_8px_24px_rgba(0,0,0,.25)] animate-[fadeup_.2s_ease]">
          {i.msg}
        </div>
      ))}
      <style>{`@keyframes fadeup{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
    </div>
  )
}
