/**
 * Traced loop wrapper
 * Emits loop start/iteration/end events for debugging
 */

import { getTracerManager } from '../core/tracer-manager.js';
import type {
  ILoopEndEvent,
  ILoopIterationEvent,
  ILoopStartEvent,
} from '../types/trace-event.types.js';
import { generateLoopId } from '../utils/call-id-generator.js';

/**
 * Wrap array iteration with tracing
 * @param channel Channel name (e.g., 'lexer', 'parser')
 * @param loopName Descriptive name for the loop
 * @param array Array to iterate
 * @param callback Iteration callback
 *
 * @example
 * ```typescript
 * tracedLoop('parser', 'parse-attributes', attributes, (attr, index) => {
 *   // Process attribute
 * });
 * ```
 */
export function tracedLoop<T>(
  channel: string,
  loopName: string,
  array: T[],
  callback: (item: T, index: number) => void
): void {
  const tracer = getTracerManager();

  // FAST PATH: Early exit if tracing disabled
  if (!tracer.isEnabled()) {
    array.forEach(callback);
    return;
  }

  // SLOW PATH: Tracing enabled
  const loopId = generateLoopId();
  const start = performance.now();

  // Emit loop start
  tracer.trace(channel, {
    type: 'loop.start' as const,
    name: loopName,
    loopId,
    length: array.length,
  } as Omit<ILoopStartEvent, 'timestamp' | 'channel'>);

  // Iterate with tracing
  for (let i = 0; i < array.length; i++) {
    const item = array[i];

    // Emit iteration event (throttled for large loops)
    if (i < 10 || i % Math.ceil(array.length / 50) === 0 || i === array.length - 1) {
      tracer.trace(channel, {
        type: 'loop.iteration' as const,
        name: loopName,
        loopId,
        index: i,
        value: item,
      } as Omit<ILoopIterationEvent, 'timestamp' | 'channel'>);
    }

    // Execute callback
    callback(item, i);
  }

  // Emit loop end
  tracer.trace(channel, {
    type: 'loop.end' as const,
    name: loopName,
    loopId,
    iterations: array.length,
    duration: performance.now() - start,
  } as Omit<ILoopEndEvent, 'timestamp' | 'channel'>);
}

/**
 * Wrap while/for loop with manual tracing
 * Use this for non-array loops
 *
 * @example
 * ```typescript
 * const loop = startTracedLoop('lexer', 'tokenization', 100);
 * while (condition) {
 *   loop.iteration(index, { token: current });
 *   // ... work
 * }
 * loop.end();
 * ```
 */
export function startTracedLoop(
  channel: string,
  loopName: string,
  estimatedLength?: number
): {
  iteration: (index: number, value?: unknown) => void;
  end: (actualIterations: number) => void;
} {
  const tracer = getTracerManager();
  const loopId = generateLoopId();
  const start = performance.now();

  // Emit loop start
  if (tracer.isEnabled()) {
    tracer.trace(channel, {
      type: 'loop.start' as const,
      name: loopName,
      loopId,
      length: estimatedLength ?? -1,
    } as Omit<ILoopStartEvent, 'timestamp' | 'channel'>);
  }

  return {
    iteration(index: number, value?: unknown): void {
      if (!tracer.isEnabled()) return;

      // Emit iteration (throttled)
      if (index < 10 || index % 10 === 0) {
        tracer.trace(channel, {
          type: 'loop.iteration' as const,
          name: loopName,
          loopId,
          index,
          value,
        } as Omit<ILoopIterationEvent, 'timestamp' | 'channel'>);
      }
    },

    end(actualIterations: number): void {
      if (!tracer.isEnabled()) return;

      tracer.trace(channel, {
        type: 'loop.end' as const,
        name: loopName,
        loopId,
        iterations: actualIterations,
        duration: performance.now() - start,
      } as Omit<ILoopEndEvent, 'timestamp' | 'channel'>);
    },
  };
}

