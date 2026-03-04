// ── Web Push クライアントサイドヘルパー ──

const PUBLIC_VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  // ArrayBuffer を明示することで Uint8Array<ArrayBuffer> 型になる
  const buffer = new ArrayBuffer(rawData.length)
  const outputArray = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/** 通知権限の現在状態を返す */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined') return 'unsupported'
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

/** Service Worker を登録して Push 購読を作成し、サーバーへ送信する */
export async function subscribeToPush(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push API 未対応ブラウザ')
      return false
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false

    const reg = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready

    // 既存購読を解除してから再購読（VAPID 鍵変更に対応）
    const existing = await reg.pushManager.getSubscription()
    if (existing) await existing.unsubscribe()

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
    })

    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub),
    })
    if (!res.ok) throw new Error('サーバー登録に失敗しました')

    localStorage.setItem('push_enabled', 'true')
    return true
  } catch (err) {
    console.error('[push] subscribe error:', err)
    return false
  }
}

/** Push 購読を解除しサーバーにも通知する */
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js')
    if (!reg) return false
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      })
      await sub.unsubscribe()
    }
    localStorage.removeItem('push_enabled')
    return true
  } catch (err) {
    console.error('[push] unsubscribe error:', err)
    return false
  }
}

/** 現在 Push が有効かどうかを確認する */
export function isPushEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('push_enabled') === 'true'
    && Notification.permission === 'granted'
}
