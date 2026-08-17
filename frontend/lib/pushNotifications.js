import { api, API_URL } from './api';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function pushSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
}

// Registers the service worker, asks for notification permission (must be
// called from a user gesture — e.g. a toggle click, never on page load),
// subscribes via the Push API, and saves the subscription server-side.
// Returns false (without throwing) on anything short of full success, so
// callers can just revert their toggle UI.
export async function subscribeToPush(token) {
  if (!pushSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const { publicKey } = await fetch(`${API_URL}/api/notifications/vapid-public-key`).then((r) => r.json());
    if (!publicKey) return false;

    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    const json = subscription.toJSON();
    await api.pushSubscribe({ endpoint: json.endpoint, keys: json.keys }, token);
    return true;
  } catch (err) {
    console.error('subscribeToPush failed:', err);
    return false;
  }
}

export async function unsubscribeFromPush(token) {
  if (!pushSupported()) return;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  await api.pushUnsubscribe({ endpoint: subscription.endpoint }, token).catch(() => {});
  await subscription.unsubscribe();
}
