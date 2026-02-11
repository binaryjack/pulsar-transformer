/**
 * @traced decorator for function tracing
 * Wraps functions to emit start/end/error events
 */

import { getTracerManager } from '../core/tracer-manager.js';
import type {
  IFunctionEndEvent,
  IFunctionErrorEvent,
  IFunctionStartEvent,
} from '../types/trace-event.types.js';
import { generateCallId } from '../utils/call-id-generator.js';

/**
 * Traced decorator for TypeScript methods
 * @param channel Channel name (e.g., 'lexer', 'parser')
 * @returns Method decorator
 *
 * @example
 * ```typescript
 * class Lexer {
 *   @traced('lexer')
 *   scanToken(): void { ... }
 * }
 * ```
 */
export function traced(channel: string) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value as (...args: unknown[]) => unknown;

    descriptor.value = function (this: unknown, ...args: unknown[]): unknown {
      const tracer = getTracerManager();

      // FAST PATH: Early exit if tracing disabled
      if (!tracer.isEnabled()) {
        return originalMethod.apply(this, args);
      }

      // SLOW PATH: Tracing enabled
      const callId = generateCallId();
      const start = performance.now();

      // Emit start event
      tracer.trace(channel, {
        type: 'function.start' as const,
        name: propertyKey,
        args,
        callId,
      } as Omit<IFunctionStartEvent, 'timestamp' | 'channel'>);

      try {
        // Execute original method
        const result = originalMethod.apply(this, args);

        // Emit end event
        tracer.trace(channel, {
          type: 'function.end' as const,
          name: propertyKey,
          callId,
          duration: performance.now() - start,
          result,
        } as Omit<IFunctionEndEvent, 'timestamp' | 'channel'>);

        return result;
      } catch (error) {
        // Emit error event
        tracer.trace(channel, {
          type: 'function.error' as const,
          name: propertyKey,
          callId,
          error: error as Error,
        } as Omit<IFunctionErrorEvent, 'timestamp' | 'channel'>);

        // Create error snapshot for trail back
        tracer.snapshot('error', { function: propertyKey, error });

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Wrap prototype method with traced decorator
 * Use this for prototype-based classes
 *
 * @example
 * ```typescript
 * Lexer.prototype.scanToken = function() { ... };
 * wrapTracedMethod(Lexer.prototype, 'scanToken', 'lexer');
 * ```
 */
export function wrapTracedMethod(
  prototype: Record<string, unknown>,
  methodName: string,
  channel: string
): void {
  const descriptor = Object.getOwnPropertyDescriptor(prototype, methodName);

  if (!descriptor || typeof descriptor.value !== 'function') {
    return; // Skip wrapping if method doesn't exist
  }

  const tracedDescriptor = traced(channel)({}, methodName, descriptor);
  Object.defineProperty(prototype, methodName, tracedDescriptor);
}
