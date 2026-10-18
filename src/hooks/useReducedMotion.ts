import { useEffect, useState } from 'react';

export function useReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const stored = localStorage.getItem('regexlab_reduced_motion');
      if (stored !== null) return stored === 'true';
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('regexlab_reduced_motion', String(prefersReduced));
    } catch {
      // ignore
    }
  }, [prefersReduced]);

  const toggleReducedMotion = () => {
    setPrefersReduced((prev) => !prev);
  };

  return { prefersReduced, setPrefersReduced, toggleReducedMotion };
}
