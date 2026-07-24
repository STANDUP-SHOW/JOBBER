// Plain (non-'use client') module so server components — like
// PrestationDetailPage — can import it directly without crossing a client
// boundary just to read a color constant.
export const CATEGORY_COLORS = {
  piscine: '#123E7A',      // bleu foncé — reste proche de l'original
  menage: '#38BDF8',       // bleu ciel
  jardinage: '#5CB85C',    // vert clair
  bricolage: '#F2871F',    // orange
  conciergerie: '#FBC02D', // jaune
};
