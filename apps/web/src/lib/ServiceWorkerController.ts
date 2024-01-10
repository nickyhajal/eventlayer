export let NotificationWorker: ServiceWorker
export async function initWorkers() {
  const check = () => {
    if (!('serviceWorker' in navigator)) {
      return false
      // throw new Error('No Service Worker support!')
    }
    if (!('PushManager' in window)) {
      return false
      // throw new Error('No Push API Support!')
    }
    return true
  }
  if (check()) {
    const registerServiceWorker = async () => {
      const worker = await navigator.serviceWorker.register(
        '/notification-worker.js'
      )

      // if the worker is still installing, it will be done by the time it tries to re-register
      if (worker.installing) {
        await navigator.serviceWorker.register('/notification-worker.js')
      }
      return worker
    }
    const registration = await registerServiceWorker()
    if (registration.active) {
      NotificationWorker = registration.active
    }
  }
}
