'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getBrandForHost, DEFAULT_BRAND } from './brandConfig';

const BrandContext = createContext(DEFAULT_BRAND);

// Resolves once, client-side, from window.location.hostname — this is an
// internal back-office tool, not a public marketing page, so the brief
// flash of the default brand before hydration is a non-issue (there's
// nothing to render meaningfully before the auth check runs anyway).
export function BrandProvider({ children }) {
  const [brand, setBrand] = useState(DEFAULT_BRAND);

  useEffect(() => {
    setBrand(getBrandForHost(window.location.hostname));
  }, []);

  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

export function useBrand() {
  return useContext(BrandContext);
}
