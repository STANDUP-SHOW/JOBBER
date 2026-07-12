// Google POSTs the ID token here directly (ux_mode: 'redirect' + login_uri
// pointing at our own domain, not the Railway API) — so the consent screen
// shows "jobber-*.vercel.app" instead of the raw backend hostname, and any
// failure lands on a page we control instead of a bare JSON error.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function POST(request) {
  const origin = new URL(request.url).origin;
  const form = await request.formData();
  const credential = form.get('credential');

  if (!credential) {
    return Response.redirect(`${origin}/auth/login?error=google`, 303);
  }

  try {
    const res = await fetch(`${API_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    });
    if (!res.ok) {
      return Response.redirect(`${origin}/auth/login?error=google`, 303);
    }
    const { token } = await res.json();
    return Response.redirect(`${origin}/auth/google-callback?token=${encodeURIComponent(token)}`, 303);
  } catch {
    return Response.redirect(`${origin}/auth/login?error=google`, 303);
  }
}
