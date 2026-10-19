import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useReducedMotion,
  REDUCED_MOTION_STORAGE_KEY,
  getInitialMotionPreference,
  syncDocumentMotionAttribute,
} from '../../src/hooks/useReducedMotion.ts';

describe('useReducedMotion Hook & Motion Attribute Sync', () => {
  let mediaQueryMatches = false;
  let mediaQueryListeners: ((event: MediaQueryListEvent) => void)[] = [];

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-regexlab-motion');
    mediaQueryMatches = false;
    mediaQueryListeners = [];

    vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
      matches: mediaQueryMatches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event: string, cb: EventListenerOrEventListenerObject) => {
        if (event === 'change') {
          mediaQueryListeners.push(cb as (event: MediaQueryListEvent) => void);
        }
      }),
      removeEventListener: vi.fn((event: string, cb: EventListenerOrEventListenerObject) => {
        if (event === 'change') {
          mediaQueryListeners = mediaQueryListeners.filter((l) => l !== cb);
        }
      }),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.removeAttribute('data-regexlab-motion');
  });

  it('initializes to false and sets data-regexlab-motion="full" when OS has no reduced motion preference', () => {
    mediaQueryMatches = false;
    const initial = getInitialMotionPreference();
    expect(initial).toBe(false);

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current.prefersReduced).toBe(false);
    expect(result.current.motionEnabled).toBe(true);
    expect(document.documentElement.getAttribute('data-regexlab-motion')).toBe('full');
  });

  it('initializes to true and sets data-regexlab-motion="reduced" when OS prefers reduced motion', () => {
    mediaQueryMatches = true;
    const initial = getInitialMotionPreference();
    expect(initial).toBe(true);

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current.prefersReduced).toBe(true);
    expect(result.current.motionEnabled).toBe(false);
    expect(document.documentElement.getAttribute('data-regexlab-motion')).toBe('reduced');
  });

  it('respects explicit localStorage preference over OS matchMedia setting', () => {
    // OS prefers reduced motion, but user previously enabled motion effects
    mediaQueryMatches = true;
    localStorage.setItem(REDUCED_MOTION_STORAGE_KEY, 'false');

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current.prefersReduced).toBe(false);
    expect(result.current.motionEnabled).toBe(true);
    expect(document.documentElement.getAttribute('data-regexlab-motion')).toBe('full');
  });

  it('toggles motion preference, synchronizing localStorage and data-regexlab-motion attribute', () => {
    mediaQueryMatches = false;
    const { result } = renderHook(() => useReducedMotion());

    expect(result.current.motionEnabled).toBe(true);
    expect(document.documentElement.getAttribute('data-regexlab-motion')).toBe('full');

    // Toggle to reduce motion
    act(() => {
      result.current.toggleReducedMotion();
    });

    expect(result.current.prefersReduced).toBe(true);
    expect(result.current.motionEnabled).toBe(false);
    expect(localStorage.getItem(REDUCED_MOTION_STORAGE_KEY)).toBe('true');
    expect(document.documentElement.getAttribute('data-regexlab-motion')).toBe('reduced');

    // Toggle back to full motion
    act(() => {
      result.current.toggleMotion();
    });

    expect(result.current.prefersReduced).toBe(false);
    expect(result.current.motionEnabled).toBe(true);
    expect(localStorage.getItem(REDUCED_MOTION_STORAGE_KEY)).toBe('false');
    expect(document.documentElement.getAttribute('data-regexlab-motion')).toBe('full');
  });

  it('updates state when OS preference changes and no explicit user override exists', () => {
    mediaQueryMatches = false;
    const { result } = renderHook(() => useReducedMotion());

    expect(result.current.motionEnabled).toBe(true);
    expect(mediaQueryListeners.length).toBeGreaterThanOrEqual(1);

    // Simulate OS-level preference change to reduced motion
    act(() => {
      for (const listener of mediaQueryListeners) {
        listener({ matches: true } as MediaQueryListEvent);
      }
    });

    expect(result.current.prefersReduced).toBe(true);
    expect(result.current.motionEnabled).toBe(false);
    expect(document.documentElement.getAttribute('data-regexlab-motion')).toBe('reduced');
  });

  it('ignores OS preference change if user has an explicit localStorage choice', () => {
    mediaQueryMatches = false;
    localStorage.setItem(REDUCED_MOTION_STORAGE_KEY, 'false');

    const { result } = renderHook(() => useReducedMotion());

    // Because explicit setting is in localStorage, listener is not attached
    expect(mediaQueryListeners.length).toBe(0);
    expect(result.current.motionEnabled).toBe(true);
  });

  it('regression: explicitly enabling full motion when OS requests reduced motion is not overridden by subsequent OS change events', () => {
    // Mount with no stored preference and OS requesting reduced motion
    mediaQueryMatches = true;
    const { result } = renderHook(() => useReducedMotion());

    expect(result.current.prefersReduced).toBe(true);
    expect(result.current.motionEnabled).toBe(false);
    expect(document.documentElement.getAttribute('data-regexlab-motion')).toBe('reduced');
    expect(mediaQueryListeners.length).toBe(1);

    const initialListener = mediaQueryListeners[0];

    // User explicitly enables full motion during this session
    act(() => {
      result.current.toggleMotion();
    });

    expect(result.current.prefersReduced).toBe(false);
    expect(result.current.motionEnabled).toBe(true);
    expect(document.documentElement.getAttribute('data-regexlab-motion')).toBe('full');
    expect(localStorage.getItem(REDUCED_MOTION_STORAGE_KEY)).toBe('false');

    // Listener is detached upon explicit choice
    expect(mediaQueryListeners.length).toBe(0);

    // Simulate subsequent OS change event firing (e.g. requesting reduced motion)
    act(() => {
      initialListener?.({ matches: true } as MediaQueryListEvent);
    });

    // User's explicit choice MUST NOT be overwritten
    expect(result.current.prefersReduced).toBe(false);
    expect(result.current.motionEnabled).toBe(true);
    expect(document.documentElement.getAttribute('data-regexlab-motion')).toBe('full');
    expect(localStorage.getItem(REDUCED_MOTION_STORAGE_KEY)).toBe('false');
  });

  it('regression: explicitly enabling reduced motion when OS requests full motion is not overridden by subsequent OS change events', () => {
    // Mount with no stored preference and OS requesting full motion
    mediaQueryMatches = false;
    const { result } = renderHook(() => useReducedMotion());

    expect(result.current.prefersReduced).toBe(false);
    expect(result.current.motionEnabled).toBe(true);
    expect(document.documentElement.getAttribute('data-regexlab-motion')).toBe('full');
    expect(mediaQueryListeners.length).toBe(1);

    const initialListener = mediaQueryListeners[0];

    // User explicitly enables reduced motion during this session
    act(() => {
      result.current.toggleReducedMotion();
    });

    expect(result.current.prefersReduced).toBe(true);
    expect(result.current.motionEnabled).toBe(false);
    expect(document.documentElement.getAttribute('data-regexlab-motion')).toBe('reduced');
    expect(localStorage.getItem(REDUCED_MOTION_STORAGE_KEY)).toBe('true');

    // Listener is detached upon explicit choice
    expect(mediaQueryListeners.length).toBe(0);

    // Simulate subsequent OS change event firing (requesting full motion)
    act(() => {
      initialListener?.({ matches: false } as MediaQueryListEvent);
    });

    // User's explicit choice MUST NOT be overwritten
    expect(result.current.prefersReduced).toBe(true);
    expect(result.current.motionEnabled).toBe(false);
    expect(document.documentElement.getAttribute('data-regexlab-motion')).toBe('reduced');
    expect(localStorage.getItem(REDUCED_MOTION_STORAGE_KEY)).toBe('true');
  });

  it('syncDocumentMotionAttribute directly modifies documentElement', () => {
    syncDocumentMotionAttribute(true);
    expect(document.documentElement.getAttribute('data-regexlab-motion')).toBe('reduced');

    syncDocumentMotionAttribute(false);
    expect(document.documentElement.getAttribute('data-regexlab-motion')).toBe('full');
  });
});
