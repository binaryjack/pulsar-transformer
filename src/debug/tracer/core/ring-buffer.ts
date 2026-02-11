/**
 * Ring buffer for trace events
 * Sliding window of recent events with automatic overwrite
 */

import type { TraceEvent } from '../types/trace-event.types.js';

/**
 * Ring buffer interface
 */
export interface IRingBuffer {
  capacity: number;
  size: number;
  push(event: TraceEvent): void;
  getLatest(count?: number): TraceEvent[];
  getAll(): TraceEvent[];
  clear(): void;
  isFull(): boolean;
}

/**
 * Ring buffer constructor (prototype-based)
 * @param capacity Maximum number of events to store
 */
export function RingBuffer(this: IRingBuffer, capacity: number): void {
  this.capacity = capacity;
  this.size = 0;
  (this as RingBuffer).buffer = new Array<TraceEvent>(capacity);
  (this as RingBuffer).head = 0;
}

/**
 * Internal buffer storage
 */
interface RingBuffer extends IRingBuffer {
  buffer: TraceEvent[];
  head: number;
}

/**
 * Push event into ring buffer
 * Oldest events automatically overwritten when full
 */
RingBuffer.prototype.push = function (this: RingBuffer, event: TraceEvent): void {
  this.buffer[this.head] = event;
  this.head = (this.head + 1) % this.capacity;
  if (this.size < this.capacity) {
    this.size++;
  }
};

/**
 * Get latest N events
 * @param count Number of events to retrieve (default: all)
 * @returns Array of most recent events (oldest first)
 */
RingBuffer.prototype.getLatest = function (this: RingBuffer, count?: number): TraceEvent[] {
  const n = Math.min(count ?? this.size, this.size);
  const result: TraceEvent[] = [];

  for (let i = 0; i < n; i++) {
    const idx = (this.head - 1 - i + this.capacity) % this.capacity;
    if (this.buffer[idx]) {
      result.unshift(this.buffer[idx]);
    }
  }

  return result;
};

/**
 * Get all events in buffer
 * @returns Array of all events (oldest first)
 */
RingBuffer.prototype.getAll = function (this: RingBuffer): TraceEvent[] {
  return this.getLatest(this.size);
};

/**
 * Clear all events from buffer
 */
RingBuffer.prototype.clear = function (this: RingBuffer): void {
  this.buffer = new Array(this.capacity);
  this.head = 0;
  this.size = 0;
};

/**
 * Check if buffer is full
 */
RingBuffer.prototype.isFull = function (this: RingBuffer): boolean {
  return this.size === this.capacity;
};

/**
 * Create new ring buffer instance
 */
export function createRingBuffer(capacity: number): IRingBuffer {
  return new (RingBuffer as unknown as new (capacity: number) => IRingBuffer)(capacity);
}
