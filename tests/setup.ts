import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { executeRegex, executeReplace } from '../src/lib/regex/engine.ts';

if (typeof Range !== 'undefined') {
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
  Range.prototype.getBoundingClientRect = () => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON: () => {},
  });
}

// Mock matchMedia for jsdom
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// Standard mock Worker for jsdom environment (executes asynchronously via macrotask queue)
if (typeof window !== 'undefined' && typeof window.Worker === 'undefined') {
  class JSDOMWorker {
    public onmessage: ((e: MessageEvent) => void) | null = null;
    public onerror: ((e: ErrorEvent) => void) | null = null;
    private timer: ReturnType<typeof setTimeout> | null = null;

    postMessage(data: unknown) {
      this.timer = setTimeout(() => {
        if (!this.onmessage) return;
        const msg = data as {
          type?: string;
          payload?: Parameters<typeof executeRegex>[0] & Parameters<typeof executeReplace>[0];
        };
        try {
          if (msg?.type === 'MATCH') {
            const result = executeRegex(msg.payload);
            this.onmessage({ data: { type: 'MATCH_RESULT', payload: result } } as MessageEvent);
          } else if (msg?.type === 'REPLACE') {
            const result = executeReplace(msg.payload);
            this.onmessage({ data: { type: 'REPLACE_RESULT', payload: result } } as MessageEvent);
          }
        } catch (err: unknown) {
          if (this.onerror) {
            const message = err instanceof Error ? err.message : 'Worker execution error';
            this.onerror(new ErrorEvent('error', { message }));
          }
        }
      }, 0);
    }

    terminate() {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      this.onmessage = null;
      this.onerror = null;
    }

    addEventListener() {}
    removeEventListener() {}
  }

  // @ts-expect-error Mock Worker in JSDOM
  globalThis.Worker = JSDOMWorker;
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});
