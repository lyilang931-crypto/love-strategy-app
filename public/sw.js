// ── Service Worker for 恋愛戦略AI Push Notifications ──

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

self.addEventListener('push', (event) => {
  let data = { title: '恋愛戦略AI', body: '今日の恋愛アクションを確認しましょう 💕', url: '/plan' }

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() }
    }
  } catch (_) {
    // JSON parse error は無視してデフォルトを使用
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'love-strategy-reminder',
    renotify: true,
    data: { url: data.url || '/plan' },
    actions: [
      { action: 'open', title: '今すぐ確認する' },
      { action: 'dismiss', title: '後で' },
    ],
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const targetUrl = (event.notification.data && event.notification.data.url) || '/plan'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})
