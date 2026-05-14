'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { subscribeToast, type ToastPayload } from '@/lib/toast'
import { cn } from '@/lib/utils'

export function Toaster() {
  const [toasts, setToasts] = useState<ToastPayload[]>([])

  useEffect(() => {
    return subscribeToast(payload => {
      setToasts(prev => [...prev, payload])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== payload.id))
      }, 4000)
    })
  }, [])

  if (!toasts.length) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4">
      {toasts.map(t => (
        <div
          key={t.id}
          className={cn(
            'slide-in-bottom pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg text-sm font-medium bg-card',
            t.type === 'success' && 'border-green-200',
            t.type === 'error' && 'border-red-200',
            t.type === 'info' && 'border-blue-200',
          )}
        >
          {t.type === 'success' && <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />}
          {t.type === 'error' && <XCircle className="h-4 w-4 shrink-0 text-red-500" />}
          {t.type === 'info' && <Info className="h-4 w-4 shrink-0 text-blue-500" />}
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => setToasts(p => p.filter(x => x.id !== t.id))}
            className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
