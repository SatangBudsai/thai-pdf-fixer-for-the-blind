// This is a placeholder service worker that unregisters itself.
// A proper service worker will be generated during production build by next-pwa.
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', () => {
  self.registration.unregister().then(() => {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => client.navigate(client.url))
    })
  })
})
