/**
 * HTTP target for tracer events
 * Sends events to VS Code extension or other HTTP servers
 */

import type { TraceEvent } from '../types/trace-event.types.js';

/**
 * HTTP target configuration
 */
export interface IHttpTargetConfig {
  url: string;
  batchSize?: number;
  flushInterval?: number;
}

/**
 * HTTP target for sending trace events to external consumers
 */
export interface IHttpTarget {
  url: string;
  buffer: TraceEvent[];
  batchSize: number;
  flushInterval: number;
  timer: NodeJS.Timeout | null;
  send(event: TraceEvent): void;
  flush(): Promise<void>;
  close(): void;
}

/**
 * HTTP target constructor (prototype-based)
 */
export function HttpTarget(this: IHttpTarget, config: IHttpTargetConfig): void {
  this.url = config.url;
  this.buffer = [];
  this.batchSize = config.batchSize ?? 10;
  this.flushInterval = config.flushInterval ?? 1000;
  this.timer = null;

  // Start flush timer
  this.timer = setInterval(() => {
    this.flush().catch((err) => {
      console.error('[HTTP-TARGET] Flush error:', err.message);
    });
  }, this.flushInterval);
}

/**
 * Send event (batched)
 */
HttpTarget.prototype.send = function (this: IHttpTarget, event: TraceEvent): void {
  this.buffer.push(event);

  // Flush if buffer full
  if (this.buffer.length >= this.batchSize) {
    this.flush().catch((err) => {
      console.error('[HTTP-TARGET] Send error:', err.message);
    });
  }
};

/**
 * Flush buffered events to HTTP endpoint
 */
HttpTarget.prototype.flush = async function (this: IHttpTarget): Promise<void> {
  if (this.buffer.length === 0) return;

  const events = this.buffer.splice(0, this.buffer.length);

  try {
    const response = await fetch(this.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    // Silent fail - don't break transformer if VS Code extension not running
    if (process.env.PULSAR_TRACE_DEBUG === '1') {
      console.warn('[HTTP-TARGET] Failed to send events:', (error as Error).message);
    }
  }
};

/**
 * Close target and flush remaining events
 */
HttpTarget.prototype.close = function (this: IHttpTarget): void {
  if (this.timer) {
    clearInterval(this.timer);
    this.timer = null;
  }

  // Final flush (synchronous)
  if (this.buffer.length > 0) {
    this.flush().catch(() => {
      // Ignore errors on close
    });
  }
};

/**
 * Create HTTP target
 */
export function createHttpTarget(config: IHttpTargetConfig): IHttpTarget {
  return new (HttpTarget as unknown as new (config: IHttpTargetConfig) => IHttpTarget)(config);
}
