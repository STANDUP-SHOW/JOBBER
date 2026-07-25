'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { agencyApi } from './agencyApi';

// Entirely separate from AuthProvider (visitor accounts) — a different
// localStorage key, a different token, a different backend auth path
// (identifiant + PIN, not email/password).
const AgencyAuthContext = createContext(null);

export function AgencyAuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [agency, setAgency] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('services34_agency_token') : null;
    if (saved) {
      setToken(saved);
      agencyApi.me(saved).then(({ agency }) => setAgency(agency)).catch(() => logout()).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  function login(newToken, newAgency) {
    localStorage.setItem('services34_agency_token', newToken);
    setToken(newToken);
    setAgency(newAgency);
  }

  function logout() {
    localStorage.removeItem('services34_agency_token');
    setToken(null);
    setAgency(null);
  }

  return (
    <AgencyAuthContext.Provider value={{ token, agency, loading, login, logout }}>
      {children}
    </AgencyAuthContext.Provider>
  );
}

export function useAgencyAuth() {
  const ctx = useContext(AgencyAuthContext);
  if (!ctx) throw new Error('useAgencyAuth doit être utilisé dans <AgencyAuthProvider>');
  return ctx;
}
