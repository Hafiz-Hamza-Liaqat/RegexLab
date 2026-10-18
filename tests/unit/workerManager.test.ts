import { describe, it, expect, vi } from 'vitest';
import { RegexWorkerManager } from '../../src/lib/regex/workerManager.ts';

describe('RegexWorkerManager', () => {
  it('executes match requests successfully', async () => {
    const manager = new RegexWorkerManager({ useFallbackDirectExecution: true });

    const result = await manager.runMatch({
      id: 'req-1',
      pattern: '\\d+',
      flags: 'g',
      text: 'Room 12, desk 4',
    });

    expect(result.status).toBe('success');
    expect(result.totalMatches).toBe(2);
    expect(result.id).toBe('req-1');
  });

  it('executes replace requests successfully', async () => {
    const manager = new RegexWorkerManager({ useFallbackDirectExecution: true });

    const result = await manager.runReplace({
      id: 'req-rep',
      pattern: 'cat',
      flags: 'g',
      text: 'cat and cat',
      replacement: 'dog',
    });

    expect(result.status).toBe('success');
    expect(result.resultText).toBe('dog and dog');
  });

  it('handles stale requests by ignoring earlier IDs', async () => {
    const manager = new RegexWorkerManager({ useFallbackDirectExecution: true });

    // Fire first request
    const p1 = manager.runMatch({
      id: 'stale-1',
      pattern: 'a',
      flags: 'g',
      text: 'aaa',
    });

    // Immediately fire second request
    const p2 = manager.runMatch({
      id: 'fresh-2',
      pattern: 'b',
      flags: 'g',
      text: 'bbb',
    });

    const [, r2] = await Promise.all([p1, p2]);

    expect(r2.status).toBe('success');
    expect(r2.id).toBe('fresh-2');
  });

  it('triggers timeout and returns timeout status when deadline expires', async () => {
    // Configurable timeout 10ms
    const manager = new RegexWorkerManager({
      timeoutMs: 10,
      useFallbackDirectExecution: false,
    });

    const mockTerminate = vi.fn();

    // Mock a Worker that never posts message back to simulate an infinite ReDoS loop
    class MockHungWorker {
      public onmessage: ((e: MessageEvent) => void) | null = null;
      public onerror: ((e: ErrorEvent) => void) | null = null;
      private listeners: Record<string, EventListener[]> = {};

      public addEventListener(type: string, listener: EventListener) {
        if (!this.listeners[type]) this.listeners[type] = [];
        this.listeners[type]!.push(listener);
      }

      public removeEventListener(type: string, listener: EventListener) {
        if (!this.listeners[type]) return;
        this.listeners[type] = this.listeners[type]!.filter((l) => l !== listener);
      }

      public postMessage() {
        // Never reply: simulating hung / ReDoS worker
      }

      public terminate = mockTerminate;
    }

    // Temporarily stub global Worker
    const originalWorker = globalThis.Worker;

    // @ts-expect-error Mocking Worker constructor
    globalThis.Worker = MockHungWorker;

    try {
      const resultPromise = manager.runMatch({
        id: 'hung-req',
        pattern: '(a+)+$',
        flags: 'g',
        text: 'aaaaaaaaaaaaaaaaaaaa!',
        timeoutMs: 25,
      });

      const result = await resultPromise;

      expect(result.status).toBe('timeout');
      expect(result.error).toContain('exceeded deadline');
      expect(mockTerminate).toHaveBeenCalled();
    } finally {
      globalThis.Worker = originalWorker;
      manager.terminateCurrentWorker();
    }
  });

  it('recovers cleanly after worker termination and processes subsequent requests', async () => {
    const manager = new RegexWorkerManager({ useFallbackDirectExecution: true });

    // Force termination
    manager.terminateCurrentWorker();

    // Next request should execute cleanly without crashing
    const result = await manager.runMatch({
      id: 'recovery-req',
      pattern: '\\w+',
      flags: 'g',
      text: 'hello',
    });

    expect(result.status).toBe('success');
    expect(result.totalMatches).toBe(1);
  });
});
