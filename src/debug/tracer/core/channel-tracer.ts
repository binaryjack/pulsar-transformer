/**
 * Channel-specific tracer
 * Manages events and subscriptions for a single channel
 */

import type { TraceEvent, TraceEventHandler } from '../types/trace-event.types.js';
import type { IRingBuffer } from './ring-buffer.js';
import { createRingBuffer } from './ring-buffer.js';

/**
 * Channel tracer interface
 */
export interface IChannelTracer {
  name: string;
  buffer: IRingBuffer;
  emit(event: TraceEvent): void;
  subscribe(handler: TraceEventHandler): () => void;
  getLatest(count?: number): TraceEvent[];
  clear(): void;
}

/**
 * Channel tracer constructor (prototype-based)
 * @param name Channel name (e.g., 'lexer', 'parser')
 * @param windowSize Buffer capacity (default: channel-specific)
 */
export function ChannelTracer(this: IChannelTracer, name: string, windowSize: number): void {
  this.name = name;
  this.buffer = createRingBuffer(windowSize);
  (this as ChannelTracer).subscribers = new Set<TraceEventHandler>();
}

/**
 * Internal subscriber storage
 */
interface ChannelTracer extends IChannelTracer {
  subscribers: Set<TraceEventHandler>;
}

/**
 * Emit trace event
 * Adds to buffer and notifies subscribers
 */
ChannelTracer.prototype.emit = function (this: ChannelTracer, event: TraceEvent): void {
  // Add to buffer
  this.buffer.push(event);

  // Notify subscribers
  this.subscribers.forEach((handler) => {
    try {
      handler(event);
    } catch (error) {
      // Swallow subscriber errors to avoid breaking tracing
      console.error('[Tracer] Subscriber error:', error);
    }
  });
};

/**
 * Subscribe to trace events
 * @param handler Event handler callback
 * @returns Unsubscribe function
 */
ChannelTracer.prototype.subscribe = function (
  this: ChannelTracer,
  handler: TraceEventHandler
): () => void {
  this.subscribers.add(handler);

  // Return unsubscribe function
  return () => {
    this.subscribers.delete(handler);
  };
};

/**
 * Get latest N events from buffer
 */
ChannelTracer.prototype.getLatest = function (this: ChannelTracer, count?: number): TraceEvent[] {
  return this.buffer.getLatest(count);
};

/**
 * Clear buffer and subscribers
 */
ChannelTracer.prototype.clear = function (this: ChannelTracer): void {
  this.buffer.clear();
  this.subscribers.clear();
};

/**
 * Create new channel tracer instance
 */
export function createChannelTracer(name: string, windowSize: number): IChannelTracer {
  return new (ChannelTracer as unknown as new (name: string, windowSize: number) => IChannelTracer)(
    name,
    windowSize
  );
}

