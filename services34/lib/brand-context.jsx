'use client';

import { createContext, useContext, useState } from 'react';
import { CATEGORY_COLORS } from './categoryColors';

export { CATEGORY_COLORS };

const DEFAULT_BRAND = { color: CATEGORY_COLORS.piscine, prefix: '' };

const BrandContext = createContext(null);

export function BrandProvider({ children }) {
  const [brand, setBrand] = useState(DEFAULT_BRAND);
  return <BrandContext.Provider value={{ brand, setBrand, resetBrand: () => setBrand(DEFAULT_BRAND) }}>{children}</BrandContext.Provider>;
}

export function useBrand() {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error('useBrand doit être utilisé dans <BrandProvider>');
  return ctx;
}
