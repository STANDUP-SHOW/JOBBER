'use client';

import { useEffect, useRef } from 'react';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function GoogleSignInButton() {
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    function render() {
      if (!window.google || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        ux_mode: 'redirect',
        // Same-origin route (not the Railway API) so Google's consent
        // screen shows our own domain, and failures land on a page we
        // control instead of a bare JSON error from the backend.
        login_uri: `${window.location.origin}/api/auth/google-callback`,
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'continue_with',
        locale: 'fr',
      });
    }

    if (window.google?.accounts?.id) {
      render();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = render;
    document.body.appendChild(script);
  }, []);

  if (!GOOGLE_CLIENT_ID) return null;

  return <div ref={buttonRef} />;
}
