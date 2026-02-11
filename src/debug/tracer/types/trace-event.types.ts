/**
 * Trace event type definitions
 * All events are strongly typed, no 'any' usage
 */

/**
 * Base trace event
 */
export interface ITraceEvent {
  type: TraceEventType;
  timestamp: number;
  channel: string;
}

/**
 * Event type discriminator
 */
export type TraceEventType =
  | 'function.start'
  | 'function.end'
  | 'function.error'
  | 'loop.start'
  | 'loop.iteration'
  | 'loop.end'
  | 'error'
  | 'breakpoint'
  | 'snapshot';

/**
 * Function start event
 */
export interface IFunctionStartEvent extends ITraceEvent {
  type: 'function.start';
  name: string;
  args: unknown[];
  callId: string;
}

/**
 * Function end event
 */
export interface IFunctionEndEvent extends ITraceEvent {
  type: 'function.end';
  name: string;
  callId: string;
  duration: number;
  result?: unknown;
}

/**
 * Function error event
 */
export interface IFunctionErrorEvent extends ITraceEvent {
  type: 'function.error';
  name: string;
  callId: string;
  error: Error;
}

/**
 * Loop start event
 */
export interface ILoopStartEvent extends ITraceEvent {
  type: 'loop.start';
  name: string;
  loopId: string;
  length: number;
}

/**
 * Loop iteration event
 */
export interface ILoopIterationEvent extends ITraceEvent {
  type: 'loop.iteration';
  name: string;
  loopId: string;
  index: number;
  value: unknown;
}

/**
 * Loop end event
 */
export interface ILoopEndEvent extends ITraceEvent {
  type: 'loop.end';
  name: string;
  loopId: string;
  iterations: number;
  duration: number;
}

/**
 * Error event
 */
export interface IErrorEvent extends ITraceEvent {
  type: 'error';
  phase: string;
  message: string;
  stack?: string;
}

/**
 * Breakpoint event (user-defined trace points)
 */
export interface IBreakpointEvent extends ITraceEvent {
  type: 'breakpoint';
  name: string;
  data?: Record<string, unknown>;
}

/**
 * Snapshot event (trail freeze)
 */
export interface ISnapshotEvent extends ITraceEvent {
  type: 'snapshot';
  snapshotId: string;
  reason: 'error' | 'breakpoint' | 'manual';
  eventCount: number;
}

/**
 * Union of all trace events
 */
export type TraceEvent =
  | IFunctionStartEvent
  | IFunctionEndEvent
  | IFunctionErrorEvent
  | ILoopStartEvent
  | ILoopIterationEvent
  | ILoopEndEvent
  | IErrorEvent
  | IBreakpointEvent
  | ISnapshotEvent;

/**
 * Trace event subscriber callback
 */
export type TraceEventHandler = (event: TraceEvent) => void;

/**
 * Snapshot data structure (frozen buffer state)
 */
export interface ITraceSnapshot {
  id: string;
  timestamp: number;
  reason: 'error' | 'breakpoint' | 'manual';
  channels: Record<string, TraceEvent[]>;
}
