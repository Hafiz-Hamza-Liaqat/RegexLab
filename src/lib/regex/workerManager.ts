import { executeRegex, executeReplace } from './engine.ts';
import type {
  RegexRunRequest,
  RegexRunResult,
  ReplaceRunRequest,
  ReplaceRunResult,
} from '../../types/regex.ts';

export const DEFAULT_EXECUTION_TIMEOUT_MS = 2000;

export interface WorkerManagerOptions {
  timeoutMs?: number;
  /**
   * Explicitly opt into direct synchronous execution for isolated, safe unit tests only.
   * MUST NEVER be used in production. Default is false.
   */
  allowDirectExecutionForTests?: boolean;
  /**
   * Custom worker factory for deterministic unit testing (e.g. testing worker init failures).
   */
  workerFactory?: () => Worker;
}

interface PendingRequest<TResult> {
  id: string;
  timer: ReturnType<typeof setTimeout> | null;
  resolve: (result: TResult) => void;
  settled: boolean;
}

interface WorkerChannelConfig<TRequest extends { id: string; timeoutMs?: number }, TResult extends { id: string }> {
  channelName: string;
  actionType: 'MATCH' | 'REPLACE';
  resultType: 'MATCH_RESULT' | 'REPLACE_RESULT';
  options: WorkerManagerOptions;
  makeTimeoutResult: (id: string, timeoutMs: number) => TResult;
  makeErrorResult: (id: string, error: string) => TResult;
  makeCancelledResult: (id: string, reason: string) => TResult;
  executeDirectly: (request: TRequest) => TResult;
}

/**
 * Isolated worker client managing a dedicated Web Worker channel (e.g. match or replace).
 * Provides thread isolation, deterministic timeout handling, clean request superseding,
 * and zero listener leaks.
 */
class IsolatedWorkerClient<TRequest extends { id: string; timeoutMs?: number }, TResult extends { id: string }> {
  private worker: Worker | null = null;
  private pendingRequests = new Map<string, PendingRequest<TResult>>();
  private currentActiveId: string | null = null;
  private config: WorkerChannelConfig<TRequest, TResult>;

  constructor(config: WorkerChannelConfig<TRequest, TResult>) {
    this.config = config;
  }

  /**
   * Spawns or returns existing dedicated worker with single-attachment listeners.
   */
  private ensureWorker(): Worker | null {
    if (this.config.options.allowDirectExecutionForTests) {
      return null;
    }

    if (this.worker) {
      return this.worker;
    }

    if (typeof Worker === 'undefined' && !this.config.options.workerFactory) {
      return null;
    }

    try {
      const worker = this.config.options.workerFactory
        ? this.config.options.workerFactory()
        : new Worker(new URL('../../workers/regex.worker.ts', import.meta.url), {
            type: 'module',
          });

      // Attach event listeners ONCE per worker lifecycle to avoid listener leaks
      worker.onmessage = (event: MessageEvent) => {
        const data = event.data;
        if (!data || data.type !== this.config.resultType) return;

        const payload: TResult = data.payload;
        this.settleRequest(payload.id, payload);
      };

      worker.onerror = (err: ErrorEvent) => {
        const errorMsg = err.message || `${this.config.channelName} worker failure`;
        this.settleAllWithError(`Worker error: ${errorMsg}`);
        this.terminateInternalWorker();
      };

      this.worker = worker;
      return this.worker;
    } catch (err) {
      console.warn(`[RegexLab] Failed to initialize Web Worker for ${this.config.channelName}:`, err);
      this.worker = null;
      return null;
    }
  }

  /**
   * Settles a pending request exactly once, clearing its timeout and removing from pending map.
   */
  private settleRequest(id: string, result: TResult): void {
    const pending = this.pendingRequests.get(id);
    if (!pending || pending.settled) {
      return;
    }

    pending.settled = true;
    if (pending.timer !== null) {
      clearTimeout(pending.timer);
      pending.timer = null;
    }

    this.pendingRequests.delete(id);
    if (this.currentActiveId === id) {
      this.currentActiveId = null;
    }

    pending.resolve(result);
  }

  /**
   * Settles all pending requests with an error message and cleans up.
   */
  private settleAllWithError(error: string): void {
    for (const [id, pending] of this.pendingRequests.entries()) {
      if (!pending.settled) {
        pending.settled = true;
        if (pending.timer !== null) {
          clearTimeout(pending.timer);
          pending.timer = null;
        }
        pending.resolve(this.config.makeErrorResult(id, error));
      }
    }
    this.pendingRequests.clear();
    this.currentActiveId = null;
  }

  /**
   * Internal termination of worker instance without calling resolve (handled by caller).
   */
  private terminateInternalWorker(): void {
    if (this.worker) {
      this.worker.onmessage = null;
      this.worker.onerror = null;
      try {
        this.worker.terminate();
      } catch {
        // ignore
      }
      this.worker = null;
    }
  }

  /**
   * Executes a request asynchronously on the worker channel.
   * If a previous request is still in flight on this channel, it is superseded immediately.
   */
  public run(request: TRequest): Promise<TResult> {
    const timeoutMs = request.timeoutMs ?? this.config.options.timeoutMs ?? DEFAULT_EXECUTION_TIMEOUT_MS;

    // Supersede any active request on this channel cleanly
    if (this.currentActiveId && this.currentActiveId !== request.id) {
      const prevId = this.currentActiveId;
      this.settleRequest(
        prevId,
        this.config.makeCancelledResult(prevId, 'Request superseded by a newer request.')
      );
    }

    this.currentActiveId = request.id;

    // Check if direct execution is explicitly enabled for unit tests only
    if (this.config.options.allowDirectExecutionForTests) {
      return new Promise<TResult>((resolve) => {
        try {
          const result = this.config.executeDirectly(request);
          resolve(result);
        } catch (err) {
          resolve(this.config.makeErrorResult(request.id, err instanceof Error ? err.message : 'Execution failed'));
        }
      });
    }

    const worker = this.ensureWorker();

    // Production policy: NEVER execute untrusted regex synchronously on UI thread if Worker is unavailable
    if (!worker) {
      return Promise.resolve(
        this.config.makeErrorResult(
          request.id,
          'Web Worker is unavailable or failed to initialize. Execution was safely blocked on the main thread.'
        )
      );
    }

    return new Promise<TResult>((resolve) => {
      // Set deadline timer for this specific request
      const timer = setTimeout(() => {
        // If this request is still active and timed out, terminate hung worker and recreate fresh
        this.terminateInternalWorker();
        this.settleRequest(request.id, this.config.makeTimeoutResult(request.id, timeoutMs));

        // Settle any other pending requests that were blocked behind the hung worker
        this.settleAllWithError(`Worker was terminated due to timeout on request ${request.id}.`);
      }, timeoutMs);

      this.pendingRequests.set(request.id, {
        id: request.id,
        timer,
        resolve,
        settled: false,
      });

      worker.postMessage({
        type: this.config.actionType,
        payload: request,
      });
    });
  }

  /**
   * Terminates current worker and cleanly cancels all outstanding requests.
   */
  public terminate(): void {
    this.terminateInternalWorker();

    for (const [id, pending] of this.pendingRequests.entries()) {
      if (!pending.settled) {
        pending.settled = true;
        if (pending.timer !== null) {
          clearTimeout(pending.timer);
          pending.timer = null;
        }
        pending.resolve(this.config.makeCancelledResult(id, 'Worker was terminated.'));
      }
    }

    this.pendingRequests.clear();
    this.currentActiveId = null;
  }

  /**
   * Explicitly cancels a specific request or the active request.
   */
  public cancel(id?: string): void {
    const targetId = id ?? this.currentActiveId;
    if (targetId && this.pendingRequests.has(targetId)) {
      this.settleRequest(targetId, this.config.makeCancelledResult(targetId, 'Request cancelled explicitly.'));
    }
  }

  /**
   * Returns whether a worker instance is currently alive.
   */
  public isWorkerAlive(): boolean {
    return this.worker !== null;
  }

  /**
   * Returns current pending request count.
   */
  public getPendingCount(): number {
    return this.pendingRequests.size;
  }
}

/**
 * High-performance regex worker manager providing isolated match and replace execution channels.
 * Prevents ID collisions, eliminates listener leaks, handles ReDoS timeouts safely, and guarantees
 * that untrusted regular expressions never block the main UI thread.
 */
export class RegexWorkerManager {
  private matchClient: IsolatedWorkerClient<RegexRunRequest, RegexRunResult>;
  private replaceClient: IsolatedWorkerClient<ReplaceRunRequest, ReplaceRunResult>;

  constructor(options?: WorkerManagerOptions) {
    const opts = options ?? {};

    this.matchClient = new IsolatedWorkerClient<RegexRunRequest, RegexRunResult>({
      channelName: 'match',
      actionType: 'MATCH',
      resultType: 'MATCH_RESULT',
      options: opts,
      makeTimeoutResult: (id, timeoutMs) => ({
        id,
        status: 'timeout',
        matches: [],
        totalMatches: 0,
        executionTimeMs: timeoutMs,
        error: `Regex execution exceeded deadline of ${timeoutMs}ms. The Web Worker was terminated to protect browser responsiveness. Check for exponential backtracking (ReDoS).`,
      }),
      makeErrorResult: (id, error) => ({
        id,
        status: 'error',
        matches: [],
        totalMatches: 0,
        executionTimeMs: 0,
        error,
      }),
      makeCancelledResult: (id, reason) => ({
        id,
        status: 'cancelled',
        matches: [],
        totalMatches: 0,
        executionTimeMs: 0,
        error: reason,
      }),
      executeDirectly: (req) => executeRegex(req),
    });

    this.replaceClient = new IsolatedWorkerClient<ReplaceRunRequest, ReplaceRunResult>({
      channelName: 'replace',
      actionType: 'REPLACE',
      resultType: 'REPLACE_RESULT',
      options: opts,
      makeTimeoutResult: (id, timeoutMs) => ({
        id,
        status: 'timeout',
        resultText: '',
        replacementCount: 0,
        executionTimeMs: timeoutMs,
        error: `Replacement exceeded deadline of ${timeoutMs}ms. Web Worker was terminated.`,
      }),
      makeErrorResult: (id, error) => ({
        id,
        status: 'error',
        resultText: '',
        replacementCount: 0,
        executionTimeMs: 0,
        error,
      }),
      makeCancelledResult: (id, reason) => ({
        id,
        status: 'cancelled',
        resultText: '',
        replacementCount: 0,
        executionTimeMs: 0,
        error: reason,
      }),
      executeDirectly: (req) => executeReplace(req),
    });
  }

  /**
   * Executes a regex match request on the isolated match worker channel.
   */
  public runMatch(request: RegexRunRequest): Promise<RegexRunResult> {
    return this.matchClient.run(request);
  }

  /**
   * Executes a regex replacement request on the isolated replace worker channel.
   */
  public runReplace(request: ReplaceRunRequest): Promise<ReplaceRunResult> {
    return this.replaceClient.run(request);
  }

  /**
   * Terminates all worker channels and cleanly settles all pending requests.
   */
  public terminateCurrentWorker(): void {
    this.matchClient.terminate();
    this.replaceClient.terminate();
  }

  /**
   * Explicitly cancels match requests.
   */
  public cancelMatch(id?: string): void {
    this.matchClient.cancel(id);
  }

  /**
   * Explicitly cancels replace requests.
   */
  public cancelReplace(id?: string): void {
    this.replaceClient.cancel(id);
  }

  /**
   * Diagnostic inspection for testing.
   */
  public getPendingCounts(): { match: number; replace: number } {
    return {
      match: this.matchClient.getPendingCount(),
      replace: this.replaceClient.getPendingCount(),
    };
  }
}

export const defaultWorkerManager = new RegexWorkerManager();
