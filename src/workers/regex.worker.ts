/// <reference lib="webworker" />
import { executeRegex, executeReplace } from '../lib/regex/engine.ts';
import type { RegexRunRequest, ReplaceRunRequest } from '../types/regex.ts';

type WorkerIncomingMessage =
  | { type: 'MATCH'; payload: RegexRunRequest }
  | { type: 'REPLACE'; payload: ReplaceRunRequest };

self.onmessage = (event: MessageEvent<WorkerIncomingMessage>) => {
  const data = event.data;
  if (!data || typeof data !== 'object') {
    return;
  }

  try {
    if (data.type === 'MATCH') {
      const result = executeRegex(data.payload);
      self.postMessage({ type: 'MATCH_RESULT', payload: result });
    } else if (data.type === 'REPLACE') {
      const result = executeReplace(data.payload);
      self.postMessage({ type: 'REPLACE_RESULT', payload: result });
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown worker execution failure';
    if (data.type === 'MATCH') {
      self.postMessage({
        type: 'MATCH_RESULT',
        payload: {
          id: data.payload.id,
          status: 'error',
          matches: [],
          totalMatches: 0,
          executionTimeMs: 0,
          error: errorMsg,
        },
      });
    } else if (data.type === 'REPLACE') {
      self.postMessage({
        type: 'REPLACE_RESULT',
        payload: {
          id: data.payload.id,
          status: 'error',
          resultText: data.payload.text,
          replacementCount: 0,
          executionTimeMs: 0,
          error: errorMsg,
        },
      });
    }
  }
};
