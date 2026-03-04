// ── Service Worker for 恋愛戦略AI ──
// Push通知 + PWAオフラインキャッシュ

const CACHE_NAME = 'love-strategy-v1'
const CACHE_URLS = [
  '/',
  '/hearing',
  '/diagnosis',
  '/plan',
  '/progress',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
]

// ── インストール: アプリシェルをキャッシュ ──
self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(CACHE_URLS).catch(() => {
        // 一部が失敗してもインストールを続行
      })
    )
  )
})

// ── アクティベート: 古いキャッシュを削除 ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME)
            .map((k) => caches.delete(k))
        )
      ),
    ])
  )
})

// ── フェッチ: Network-first（API）/ Cache-first（静的）──
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // API・外部リソースはキャッシュしない
  if (
    url.pathname.startsWith('/api/') ||
    url.origin !== self.location.origin ||
    request.method !== 'GET'
  ) {
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      // バックグラウンドでキャッシュを更新（stale-while-revalidate）
      const fetchPromise = fetch(request)
        .then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone()
            caches.open(CACHE_NAME).then((c) => c.put(request, clone))
          }
          return res
        })
        .catch(() => cached)

      return cached || fetchPromise
    })
  )
})

// ── プッシュ通知受信 ──
self.addEventListener('push', (event) => {
  let data = {
    title: '恋愛戦略AI',
    body: '今日の恋愛アクションを確認しましょう 💕',
    url: '/plan',
  }

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() }
    }
  } catch (_) {
    // JSON parse error は無視
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

// ── 通知クリック ──
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
