import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegexWorkerManager } from '../../src/lib/regex/workerManager.ts';
import * as engine from '../../src/lib/regex/engine.ts';

describe('RegexWorkerManager — Concurrency, Safety & Lifecycle', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('Worker creation failure returns an error without running regex work on the main thread', async () => {
    const spyRegex = vi.spyOn(engine, 'executeRegex');
    const spyReplace = vi.spyOn(engine, 'executeReplace');

    const failingManager = new RegexWorkerManager({
      workerFactory: () => {
        throw new Error('Worker disabled by policy');
      },
    });

    // Match request must fail safely without touching main thread
    const matchResult = await failingManager.runMatch({
      id: 'fail-match',
      pattern: '(a+)+$',
      flags: 'g',
      text: 'aaaaaaaaaaaaa',
    });

    expect(matchResult.status).toBe('error');
    expect(matchResult.error).toContain('Web Worker is unavailable or failed to initialize');
    expect(spyRegex).not.toHaveBeenCalled();

    // Replace request must fail safely without touching main thread
    const replaceResult = await failingManager.runReplace({
      id: 'fail-replace',
      pattern: '(a+)+$',
      flags: 'g',
      text: 'aaaaaaaaaaaaa',
      replacement: 'x',
    });

    expect(replaceResult.status).toBe('error');
    expect(replaceResult.error).toContain('Web Worker is unavailable or failed to initialize');
    expect(spyReplace).not.toHaveBeenCalled();
  });

  it('Match and replace requests started close together both settle correctly without ID/state collision', async () => {
    const manager = new RegexWorkerManager();

    const matchPromise = manager.runMatch({
      id: 'match-concurrent',
      pattern: '[A-Z]\\d{3}',
      flags: 'g',
      text: 'Order A102 confirmed, Order B305 shipped',
    });

    const replacePromise = manager.runReplace({
      id: 'replace-concurrent',
      pattern: 'Order ([A-Z]\\d{3})',
      flags: 'g',
      text: 'Order A102 confirmed, Order B305 shipped',
      replacement: 'Shipment [$1]',
    });

    const [matchResult, replaceResult] = await Promise.all([matchPromise, replacePromise]);

    expect(matchResult.id).toBe('match-concurrent');
    expect(matchResult.status).toBe('success');
    expect(matchResult.totalMatches).toBe(2);
    expect(matchResult.matches[0]?.value).toBe('A102');
    expect(matchResult.matches[1]?.value).toBe('B305');

    expect(replaceResult.id).toBe('replace-concurrent');
    expect(replaceResult.status).toBe('success');
    expect(replaceResult.replacementCount).toBe(2);
    expect(replaceResult.resultText).toBe('Shipment [A102] confirmed, Shipment [B305] shipped');
  });

  it('A timed-out request settles with timeout status and the worker recovers for subsequent requests', async () => {
    let callCount = 0;
    const mockTerminate = vi.fn();

    class ControllableMockWorker {
      public onmessage: ((e: MessageEvent) => void) | null = null;
      public onerror: ((e: ErrorEvent) => void) | null = null;

      constructor() {
        callCount++;
      }

      postMessage(data: unknown) {
        // First worker hangs indefinitely (simulating catastrophic ReDoS)
        if (callCount === 1) {
          return;
        }

        const msg = data as { type?: string; payload: Parameters<typeof engine.executeRegex>[0] };
        // Subsequent worker responds promptly (simulating recovery)
        setTimeout(() => {
          if (!this.onmessage) return;
          if (msg?.type === 'MATCH') {
            const res = engine.executeRegex(msg.payload);
            this.onmessage({ data: { type: 'MATCH_RESULT', payload: res } } as MessageEvent);
          }
        }, 5);
      }

      terminate = mockTerminate;
      addEventListener() {}
      removeEventListener() {}
    }

    const manager = new RegexWorkerManager({
      timeoutMs: 25,
      workerFactory: () => new ControllableMockWorker() as unknown as Worker,
    });

    // First request times out
    const timeoutResult = await manager.runMatch({
      id: 'hung-req',
      pattern: '(a+)+$',
      flags: 'g',
      text: 'aaaaaaaaaa',
      timeoutMs: 25,
    });

    expect(timeoutResult.status).toBe('timeout');
    expect(timeoutResult.error).toContain('exceeded deadline of 25ms');
    expect(mockTerminate).toHaveBeenCalled();

    // Second request should recover cleanly using a fresh worker
    const recoveredResult = await manager.runMatch({
      id: 'recovered-req',
      pattern: '\\d+',
      flags: 'g',
      text: 'Desk 12',
    });

    expect(recoveredResult.status).toBe('success');
    expect(recoveredResult.totalMatches).toBe(1);
    expect(recoveredResult.id).toBe('recovered-req');
  });

  it('Superseded requests settle or cancel cleanly', async () => {
    const manager = new RegexWorkerManager();

    // Dispatch request 1
    const p1 = manager.runMatch({
      id: 'req-superseded-1',
      pattern: 'foo',
      flags: 'g',
      text: 'foo bar',
    });

    // Immediately dispatch request 2 on the same channel
    const p2 = manager.runMatch({
      id: 'req-active-2',
      pattern: 'bar',
      flags: 'g',
      text: 'foo bar',
    });

    const [r1, r2] = await Promise.all([p1, p2]);

    expect(r1.id).toBe('req-superseded-1');
    expect(r1.status).toBe('cancelled');
    expect(r1.error).toContain('superseded');

    expect(r2.id).toBe('req-active-2');
    expect(r2.status).toBe('success');
    expect(r2.totalMatches).toBe(1);
    expect(r2.matches[0]?.value).toBe('bar');
  });

  it('Ensures deterministic listener and timeout cleanup on rapid editing', async () => {
    let listenerCount = 0;

    class MonitoredWorker {
      public onmessage: ((e: MessageEvent) => void) | null = null;
      public onerror: ((e: ErrorEvent) => void) | null = null;

      constructor() {
        listenerCount++;
      }

      postMessage(data: unknown) {
        const msg = data as { type?: string; payload: Parameters<typeof engine.executeRegex>[0] };
        setTimeout(() => {
          if (!this.onmessage) return;
          if (msg?.type === 'MATCH') {
            const res = engine.executeRegex(msg.payload);
            this.onmessage({ data: { type: 'MATCH_RESULT', payload: res } } as MessageEvent);
          }
        }, 5);
      }

      terminate() {}
      addEventListener() {}
      removeEventListener() {}
    }

    const manager = new RegexWorkerManager({
      workerFactory: () => new MonitoredWorker() as unknown as Worker,
    });

    // Fire 10 rapid match requests
    const promises = Array.from({ length: 10 }, (_, i) =>
      manager.runMatch({
        id: `rapid-${i}`,
        pattern: `test-${i}`,
        flags: 'g',
        text: 'test-9 is here',
      })
    );

    const results = await Promise.all(promises);

    // Only the final request should succeed; all earlier 9 should be cancelled cleanly
    for (let i = 0; i < 9; i++) {
      expect(results[i]?.status).toBe('cancelled');
    }
    expect(results[9]?.status).toBe('success');

    // Only one worker was spawned for the channel, no worker leaks
    expect(listenerCount).toBe(1);

    // All pending requests settled; pending count is 0
    expect(manager.getPendingCounts().match).toBe(0);
  });

  it('Stale results arriving out of order do not overwrite newer results', async () => {
    let triggerFirstCallback: (() => void) | null = null;
    let triggerSecondCallback: (() => void) | null = null;

    class OutOfOrderWorker {
      public onmessage: ((e: MessageEvent) => void) | null = null;
      public onerror: ((e: ErrorEvent) => void) | null = null;

      postMessage(data: unknown) {
        const msg = data as { type?: string; payload: Parameters<typeof engine.executeRegex>[0] };
        if (msg.payload.id === 'stale-first') {
          triggerFirstCallback = () => {
            if (this.onmessage) {
              const res = engine.executeRegex(msg.payload);
              this.onmessage({ data: { type: 'MATCH_RESULT', payload: res } } as MessageEvent);
            }
          };
        } else if (msg.payload.id === 'fresh-second') {
          triggerSecondCallback = () => {
            if (this.onmessage) {
              const res = engine.executeRegex(msg.payload);
              this.onmessage({ data: { type: 'MATCH_RESULT', payload: res } } as MessageEvent);
            }
          };
        }
      }

      terminate() {}
      addEventListener() {}
      removeEventListener() {}
    }

    const manager = new RegexWorkerManager({
      workerFactory: () => new OutOfOrderWorker() as unknown as Worker,
    });

    const p1 = manager.runMatch({
      id: 'stale-first',
      pattern: 'old',
      flags: 'g',
      text: 'old new',
    });

    const p2 = manager.runMatch({
      id: 'fresh-second',
      pattern: 'new',
      flags: 'g',
      text: 'old new',
    });

    // p1 was immediately settled as cancelled when p2 was posted
    const r1 = await p1;
    expect(r1.status).toBe('cancelled');

    // Deliver fresh second response first
    triggerSecondCallback?.();
    const r2 = await p2;
    expect(r2.status).toBe('success');
    expect(r2.matches[0]?.value).toBe('new');

    // Now late message for stale-first arrives from the worker
    expect(() => triggerFirstCallback?.()).not.toThrow();

    // Verify manager pending state remains clean
    expect(manager.getPendingCounts().match).toBe(0);
  });

  it('Explicit allowDirectExecutionForTests opt-in executes synchronously for isolated tests', async () => {
    const manager = new RegexWorkerManager({
      allowDirectExecutionForTests: true,
    });

    const matchRes = await manager.runMatch({
      id: 'direct-match',
      pattern: '\\d+',
      flags: 'g',
      text: '123 test',
    });
    expect(matchRes.status).toBe('success');
    expect(matchRes.totalMatches).toBe(1);

    const replaceRes = await manager.runReplace({
      id: 'direct-replace',
      pattern: 'test',
      flags: 'g',
      text: '123 test',
      replacement: 'ok',
    });
    expect(replaceRes.status).toBe('success');
    expect(replaceRes.resultText).toBe('123 ok');
  });

  it('Worker termination settles all outstanding requests cleanly', async () => {
    class PausedWorker {
      public onmessage: ((e: MessageEvent) => void) | null = null;
      public onerror: ((e: ErrorEvent) => void) | null = null;
      postMessage() {}
      terminate() {}
      addEventListener() {}
      removeEventListener() {}
    }

    const manager = new RegexWorkerManager({
      workerFactory: () => new PausedWorker() as unknown as Worker,
    });

    const matchPromise = manager.runMatch({
      id: 'terminate-me',
      pattern: 'abc',
      flags: 'g',
      text: 'abc',
    });

    // Terminate while in flight
    manager.terminateCurrentWorker();

    const result = await matchPromise;
    expect(result.status).toBe('cancelled');
    expect(result.error).toContain('Worker was terminated');
    expect(manager.getPendingCounts().match).toBe(0);
  });
});
