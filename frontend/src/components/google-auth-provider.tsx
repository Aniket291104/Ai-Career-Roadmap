'use client';

import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { api } from '@/lib/api';

export function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  const [clientId, setClientId] = useState<string>("");

  useEffect(() => {
    // Check if it was defined at build-time
    const buildTimeId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (buildTimeId && buildTimeId !== "YOUR_GOOGLE_CLIENT_ID" && buildTimeId !== "") {
      setClientId(buildTimeId);
      return;
    }

    // Otherwise, fetch dynamic client ID from backend at runtime
    api.get('/auth/google-client-id')
      .then(res => {
        if (res.data && res.data.clientId) {
          setClientId(res.data.clientId);
        }
      })
      .catch(err => {
        console.error('Failed to load Google Client ID dynamically:', err);
      });
  }, []);

  // Return a fallback dummy if not loaded yet to prevent react-oauth errors
  const activeClientId = clientId || "100000000000-mockclientid.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={activeClientId}>
      {children}
    </GoogleOAuthProvider>
  );
}
