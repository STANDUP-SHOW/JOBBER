'use client';

import { createContext, useContext, useState } from 'react';

export const CATEGORY_COLORS = {
  piscine: '#123E7A',      // bleu foncé — reste proche de l'original
  menage: '#38BDF8',       // bleu ciel
  jardinage: '#5CB85C',    // vert clair
  bricolage: '#F2871F',    // orange
  conciergerie: '#FBC02D', // jaune
};

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
