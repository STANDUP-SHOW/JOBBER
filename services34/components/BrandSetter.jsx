'use client';

import { useEffect } from 'react';
import { useBrand } from '../lib/brand-context';
import { CATEGORY_COLORS } from '../lib/categoryColors';

// Drop this at the top of a category page to recolor the header logo and
// swap the wordmark to "<Catégorie> Services 34" while that page is
// mounted — resets to the default look on navigation away.
export default function BrandSetter({ category, label }) {
  const { setBrand, resetBrand } = useBrand();

  useEffect(() => {
    setBrand({ color: CATEGORY_COLORS[category], prefix: `${label} ` });
    return resetBrand;
  }, [category, label]);

  return null;
}
