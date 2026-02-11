/**
 * Tracer system - Public API exports
 */

export { getTracerManager, resetTracerManager } from './core/tracer-manager.js';
export { startTracedLoop, tracedLoop } from './decorators/traced-loop.js';
export { traced, wrapTracedMethod } from './decorators/traced.js';
export { createHttpTarget } from './targets/http-target.js';
export { generateCallId, generateLoopId, generateSnapshotId } from './utils/call-id-generator.js';
export { getEnabledChannels, getTraceWindowSize, isTracingEnabled } from './utils/env-check.js';

export type {
  IBreakpointEvent,
  IErrorEvent,
  IFunctionEndEvent,
  IFunctionErrorEvent,
  IFunctionStartEvent,
  ILoopEndEvent,
  ILoopIterationEvent,
  ILoopStartEvent,
  ISnapshotEvent,
  ITraceSnapshot,
  TraceEvent,
  TraceEventHandler,
  TraceEventType,
} from './types/trace-event.types.js';

export type { IChannelTracer } from './core/channel-tracer.js';
export type { IRingBuffer } from './core/ring-buffer.js';
export type { ITracerManager } from './core/tracer-manager.js';
export type { IHttpTarget, IHttpTargetConfig } from './targets/http-target.js';
