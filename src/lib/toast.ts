export type ToastType = 'success' | 'error' | 'info'

export interface ToastPayload {
  id: string
  message: string
  type: ToastType
}

type Listener = (payload: ToastPayload) => void

const listeners = new Set<Listener>()

export function toast(message: string, type: ToastType = 'success') {
  const payload: ToastPayload = { id: Math.random().toString(36).slice(2), message, type }
  listeners.forEach(l => l(payload))
}

export function subscribeToast(listener: Listener): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
