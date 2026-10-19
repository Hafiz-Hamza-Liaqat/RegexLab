import { useEffect, useState, useCallback } from 'react';

export const REDUCED_MOTION_STORAGE_KEY = 'regexlab_reduced_motion';

export function getInitialMotionPreference(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem(REDUCED_MOTION_STORAGE_KEY);
    if (stored !== null) return stored === 'true';
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  } catch {
    return false;
  }
}

export function syncDocumentMotionAttribute(prefersReduced: boolean): void {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute(
      'data-regexlab-motion',
      prefersReduced ? 'reduced' : 'full'
    );
  }
}

export function useReducedMotion() {
  const [hasExplicitPreference, setHasExplicitPreference] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(REDUCED_MOTION_STORAGE_KEY) !== null;
    } catch {
      return false;
    }
  });

  const [prefersReduced, setPrefersReduced] = useState<boolean>(() => {
    const initial = getInitialMotionPreference();
    syncDocumentMotionAttribute(initial);
    return initial;
  });

  // Keep DOM attribute synchronized whenever state changes
  useEffect(() => {
    syncDocumentMotionAttribute(prefersReduced);
  }, [prefersReduced]);

  // If no explicit user override is stored, respond to OS-level media query changes.
  // Once the user makes an explicit choice in this session, unbind the listener.
  useEffect(() => {
    if (hasExplicitPreference || typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMediaChange = (event: MediaQueryListEvent) => {
      try {
        if (localStorage.getItem(REDUCED_MOTION_STORAGE_KEY) !== null) {
          setHasExplicitPreference(true);
          return;
        }
      } catch {
        // ignore
      }
      setPrefersReduced(event.matches);
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleMediaChange);
      return () => mediaQuery.removeEventListener('change', handleMediaChange);
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handleMediaChange);
      return () => mediaQuery.removeListener(handleMediaChange);
    }
  }, [hasExplicitPreference]);

  const updatePrefersReduced = useCallback((valOrUpdater: boolean | ((prev: boolean) => boolean)) => {
    setHasExplicitPreference(true);
    setPrefersReduced((prev) => {
      const next = typeof valOrUpdater === 'function' ? valOrUpdater(prev) : valOrUpdater;
      try {
        localStorage.setItem(REDUCED_MOTION_STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const toggleReducedMotion = useCallback(() => {
    updatePrefersReduced((prev) => !prev);
  }, [updatePrefersReduced]);

  const setMotionEnabled = useCallback((enabled: boolean) => {
    updatePrefersReduced(!enabled);
  }, [updatePrefersReduced]);

  return {
    prefersReduced,
    motionEnabled: !prefersReduced,
    setPrefersReduced: updatePrefersReduced,
    setMotionEnabled,
    toggleReducedMotion,
    toggleMotion: toggleReducedMotion,
  };
}

