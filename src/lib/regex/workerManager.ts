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
  useFallbackDirectExecution?: boolean;
}

export class RegexWorkerManager {
  private worker: Worker | null = null;
  private currentRequestId: string | null = null;
  private timeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private defaultTimeoutMs: number;
  private forceDirectExecution: boolean;

  constructor(options?: WorkerManagerOptions) {
    this.defaultTimeoutMs = options?.timeoutMs ?? DEFAULT_EXECUTION_TIMEOUT_MS;
    this.forceDirectExecution = options?.useFallbackDirectExecution ?? false;
  }

  private ensureWorker(): Worker | null {
    if (this.forceDirectExecution) {
      return null;
    }

    if (typeof Worker === 'undefined') {
      return null;
    }

    if (!this.worker) {
      try {
        this.worker = new Worker(
          new URL('../../workers/regex.worker.ts', import.meta.url),
          { type: 'module' }
        );
      } catch (e) {
        console.warn('Failed to initialize Web Worker, falling back to direct execution:', e);
        this.worker = null;
      }
    }

    return this.worker;
  }

  public terminateCurrentWorker(): void {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.currentRequestId = null;
  }

  public async runMatch(request: RegexRunRequest): Promise<RegexRunResult> {
    const timeoutMs = request.timeoutMs ?? this.defaultTimeoutMs;
    this.currentRequestId = request.id;

    // Clear any pending timeout from previous call
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }

    const worker = this.ensureWorker();

    // If workers are not supported or direct fallback is forced
    if (!worker) {
      return new Promise<RegexRunResult>((resolve) => {
        // Enforce timeout even in direct mode
        const timer = setTimeout(() => {
          if (this.currentRequestId === request.id) {
            resolve({
              id: request.id,
              status: 'timeout',
              matches: [],
              totalMatches: 0,
              executionTimeMs: timeoutMs,
              error: `Regex execution exceeded deadline of ${timeoutMs}ms. Your pattern may contain catastrophic backtracking.`,
            });
          }
        }, timeoutMs);

        try {
          const result = executeRegex(request);
          clearTimeout(timer);
          if (this.currentRequestId === request.id) {
            resolve(result);
          }
        } catch (err) {
          clearTimeout(timer);
          if (this.currentRequestId === request.id) {
            resolve({
              id: request.id,
              status: 'error',
              matches: [],
              totalMatches: 0,
              executionTimeMs: 0,
              error: err instanceof Error ? err.message : 'Execution failed.',
            });
          }
        }
      });
    }

    return new Promise<RegexRunResult>((resolve) => {
      // Set deadline timer
      this.timeoutTimer = setTimeout(() => {
        if (this.currentRequestId === request.id) {
          // Terminate hung worker and recreate fresh worker
          this.terminateCurrentWorker();
          resolve({
            id: request.id,
            status: 'timeout',
            matches: [],
            totalMatches: 0,
            executionTimeMs: timeoutMs,
            error: `Regex execution exceeded deadline of ${timeoutMs}ms. The Web Worker was terminated to protect browser responsiveness. Check for exponential backtracking (ReDoS).`,
          });
        }
      }, timeoutMs);

      const messageHandler = (event: MessageEvent) => {
        const data = event.data;
        if (!data || data.type !== 'MATCH_RESULT') return;

        const payload: RegexRunResult = data.payload;
        // Ignore stale requests
        if (payload.id !== this.currentRequestId) {
          return;
        }

        if (this.timeoutTimer) {
          clearTimeout(this.timeoutTimer);
          this.timeoutTimer = null;
        }

        worker.removeEventListener('message', messageHandler);
        worker.removeEventListener('error', errorHandler);
        resolve(payload);
      };

      const errorHandler = (err: ErrorEvent) => {
        if (this.timeoutTimer) {
          clearTimeout(this.timeoutTimer);
          this.timeoutTimer = null;
        }
        worker.removeEventListener('message', messageHandler);
        worker.removeEventListener('error', errorHandler);
        this.terminateCurrentWorker();

        resolve({
          id: request.id,
          status: 'error',
          matches: [],
          totalMatches: 0,
          executionTimeMs: 0,
          error: `Worker error: ${err.message || 'Worker failure'}`,
        });
      };

      worker.addEventListener('message', messageHandler);
      worker.addEventListener('error', errorHandler);

      worker.postMessage({ type: 'MATCH', payload: request });
    });
  }

  public async runReplace(request: ReplaceRunRequest): Promise<ReplaceRunResult> {
    const timeoutMs = request.timeoutMs ?? this.defaultTimeoutMs;
    this.currentRequestId = request.id;

    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }

    const worker = this.ensureWorker();

    if (!worker) {
      return new Promise<ReplaceRunResult>((resolve) => {
        const timer = setTimeout(() => {
          if (this.currentRequestId === request.id) {
            resolve({
              id: request.id,
              status: 'timeout',
              resultText: request.text,
              replacementCount: 0,
              executionTimeMs: timeoutMs,
              error: `Replacement exceeded deadline of ${timeoutMs}ms.`,
            });
          }
        }, timeoutMs);

        try {
          const result = executeReplace(request);
          clearTimeout(timer);
          if (this.currentRequestId === request.id) {
            resolve(result);
          }
        } catch (err) {
          clearTimeout(timer);
          if (this.currentRequestId === request.id) {
            resolve({
              id: request.id,
              status: 'error',
              resultText: request.text,
              replacementCount: 0,
              executionTimeMs: 0,
              error: err instanceof Error ? err.message : 'Replacement failed.',
            });
          }
        }
      });
    }

    return new Promise<ReplaceRunResult>((resolve) => {
      this.timeoutTimer = setTimeout(() => {
        if (this.currentRequestId === request.id) {
          this.terminateCurrentWorker();
          resolve({
            id: request.id,
            status: 'timeout',
            resultText: request.text,
            replacementCount: 0,
            executionTimeMs: timeoutMs,
            error: `Replacement exceeded deadline of ${timeoutMs}ms. Web Worker terminated.`,
          });
        }
      }, timeoutMs);

      const messageHandler = (event: MessageEvent) => {
        const data = event.data;
        if (!data || data.type !== 'REPLACE_RESULT') return;

        const payload: ReplaceRunResult = data.payload;
        if (payload.id !== this.currentRequestId) {
          return;
        }

        if (this.timeoutTimer) {
          clearTimeout(this.timeoutTimer);
          this.timeoutTimer = null;
        }

        worker.removeEventListener('message', messageHandler);
        worker.removeEventListener('error', errorHandler);
        resolve(payload);
      };

      const errorHandler = (err: ErrorEvent) => {
        if (this.timeoutTimer) {
          clearTimeout(this.timeoutTimer);
          this.timeoutTimer = null;
        }
        worker.removeEventListener('message', messageHandler);
        worker.removeEventListener('error', errorHandler);
        this.terminateCurrentWorker();

        resolve({
          id: request.id,
          status: 'error',
          resultText: request.text,
          replacementCount: 0,
          executionTimeMs: 0,
          error: `Worker error: ${err.message || 'Worker failure'}`,
        });
      };

      worker.addEventListener('message', messageHandler);
      worker.addEventListener('error', errorHandler);

      worker.postMessage({ type: 'REPLACE', payload: request });
    });
  }
}

export const defaultWorkerManager = new RegexWorkerManager();
