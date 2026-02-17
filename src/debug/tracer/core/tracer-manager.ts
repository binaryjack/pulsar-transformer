/**
 * Singleton tracer manager
 * Manages all trace channels and snapshots
 */

import type { IHttpTarget } from '../targets/http-target.js';
import { createHttpTarget } from '../targets/http-target.js';
import type {
  IBreakpointEvent,
  ISnapshotEvent,
  ITraceSnapshot,
  TraceEvent,
  TraceEventHandler,
} from '../types/trace-event.types.js';
import { generateSnapshotId } from '../utils/call-id-generator.js';
import { getEnabledChannels, getTraceWindowSize, isTracingEnabled } from '../utils/env-check.js';
import type { IChannelTracer } from './channel-tracer.js';
import { createChannelTracer } from './channel-tracer.js';

/**
 * Channel-specific window sizes based on operation density
 */
const CHANNEL_WINDOW_SIZES: Record<string, number> = {
  lexer: 500, // High frequency token operations
  parser: 1000, // Medium frequency AST operations
  semantic: 1500, // Lower frequency analysis
  transformer: 2000, // Complex transformations
  codegen: 1000, // Medium frequency generation
  system: 100, // System events (errors, snapshots)
};

/**
 * Tracer manager interface
 */
export interface ITracerManager {
  channels: Map<string, IChannelTracer>;
  snapshots: Map<string, ITraceSnapshot>;
  httpTarget: IHttpTarget | null;
  isEnabled(): boolean;
  trace(channel: string, event: Omit<TraceEvent, 'timestamp' | 'channel'>): void;
  subscribe(channel: string, handler: TraceEventHandler): () => void;
  subscribeAll(handler: TraceEventHandler): () => void;
  getChannel(channel: string): IChannelTracer | undefined;
  getLatest(channel: string, count?: number): TraceEvent[];
  snapshot(reason: 'error' | 'breakpoint' | 'manual', data?: unknown): ITraceSnapshot;
  getSnapshot(id: string): ITraceSnapshot | undefined;
  markBreakpoint(name: string, data?: Record<string, unknown>): void;
  clear(): void;
}

/**
 * Tracer manager constructor (prototype-based, singleton)
 */
export function TracerManager(this: ITracerManager): void {
  // Don't cache enabled - check dynamically for runtime configuration support
  this.channels = new Map<string, IChannelTracer>();
  this.snapshots = new Map<string, ITraceSnapshot>();
  this.httpTarget = null;
  (this as TracerManagerInternal).enabledChannels = getEnabledChannels();
  (this as TracerManagerInternal).globalSubscribers = new Set<TraceEventHandler>();

  // Initialize HTTP target if configured
  const httpUrl = process.env.PULSAR_TRACE_HTTP;
  if (httpUrl) {
    try {
      this.httpTarget = createHttpTarget({ url: httpUrl });
    } catch (error) {
      console.warn('[TRACER] Failed to create HTTP target:', (error as Error).message);
    }
  }
}

/**
 * Internal state
 */
interface TracerManagerInternal extends ITracerManager {
  enabledChannels: string[];
  globalSubscribers: Set<TraceEventHandler>;
}

/**
 * Check if tracing is enabled (dynamic check for runtime configuration)
 */
TracerManager.prototype.isEnabled = function (this: ITracerManager): boolean {
  return isTracingEnabled();
};

/**
 * Get or create channel tracer
 */
function getOrCreateChannel(this: TracerManagerInternal, channel: string): IChannelTracer {
  if (!this.channels.has(channel)) {
    const windowSize = CHANNEL_WINDOW_SIZES[channel] || getTraceWindowSize();
    const tracer = createChannelTracer(channel, windowSize);
    this.channels.set(channel, tracer);
  }
  return this.channels.get(channel)!;
}

/**
 * Check if channel is enabled (filtered)
 */
function isChannelEnabled(this: TracerManagerInternal, channel: string): boolean {
  // If no filter, all channels enabled
  if (this.enabledChannels.length === 0) return true;
  // Otherwise check filter
  return this.enabledChannels.includes(channel);
}

/**
 * Emit trace event to channel
 * FAST PATH: Early return if tracing disabled
 */
TracerManager.prototype.trace = function (
  this: TracerManagerInternal,
  channel: string,
  event: Omit<TraceEvent, 'timestamp' | 'channel'>
): void {
  // FAST PATH: Early exit if disabled
  if (!this.isEnabled()) return;

  // Check channel filter
  if (!isChannelEnabled.call(this, channel)) return;

  // Build complete event
  const fullEvent: TraceEvent = {
    ...event,
    timestamp: Date.now(),
    channel,
  } as TraceEvent;

  // Output to console for terminal visibility
  if (fullEvent.type === 'function.start') {
    console.log(`[TRACE:${channel}] START ${fullEvent.name}`);
  } else if (fullEvent.type === 'function.end') {
    console.log(`[TRACE:${channel}] END ${fullEvent.name} (${fullEvent.duration}ms)`);
  } else if (fullEvent.type === 'function.error') {
    console.log(`[TRACE:${channel}] ERROR ${fullEvent.name}:`, fullEvent.error.message);
  } else if (fullEvent.type === 'loop.start') {
    console.log(`[TRACE:${channel}] LOOP START ${fullEvent.name} (${fullEvent.length} items)`);
  } else if (fullEvent.type === 'loop.iteration') {
    console.log(`[TRACE:${channel}] LOOP ${fullEvent.name}[${fullEvent.index}]`);
  }

  // Send to HTTP target if configured
  if (this.httpTarget) {
    this.httpTarget.send(fullEvent);
  }
  // Get or create channel and emit
  const channelTracer = getOrCreateChannel.call(this, channel);
  channelTracer.emit(fullEvent);

  // Notify global subscribers
  this.globalSubscribers.forEach((handler) => {
    try {
      handler(fullEvent);
    } catch (error) {
      console.error('[Tracer] Global subscriber error:', error);
    }
  });
};

/**
 * Subscribe to specific channel
 */
TracerManager.prototype.subscribe = function (
  this: TracerManagerInternal,
  channel: string,
  handler: TraceEventHandler
): () => void {
  const channelTracer = getOrCreateChannel.call(this, channel);
  return channelTracer.subscribe(handler);
};

/**
 * Subscribe to all channels
 */
TracerManager.prototype.subscribeAll = function (
  this: TracerManagerInternal,
  handler: TraceEventHandler
): () => void {
  this.globalSubscribers.add(handler);
  return () => {
    this.globalSubscribers.delete(handler);
  };
};

/**
 * Get channel tracer
 */
TracerManager.prototype.getChannel = function (
  this: ITracerManager,
  channel: string
): IChannelTracer | undefined {
  return this.channels.get(channel);
};

/**
 * Get latest N events from channel
 */
TracerManager.prototype.getLatest = function (
  this: ITracerManager,
  channel: string,
  count?: number
): TraceEvent[] {
  const channelTracer = this.channels.get(channel);
  return channelTracer ? channelTracer.getLatest(count) : [];
};

/**
 * Create snapshot of all channel buffers
 * TRAIL BACK: Freeze current state for debugging
 */
TracerManager.prototype.snapshot = function (
  this: ITracerManager,
  reason: 'error' | 'breakpoint' | 'manual',
  data?: unknown
): ITraceSnapshot {
  const id = generateSnapshotId();
  const snapshot: ITraceSnapshot = {
    id,
    timestamp: Date.now(),
    reason,
    channels: {},
  };

  // Freeze all channel buffers
  let totalEvents = 0;
  this.channels.forEach((channel, name) => {
    const events = channel.getLatest();
    snapshot.channels[name] = events;
    totalEvents += events.length;
  });

  // Store snapshot
  this.snapshots.set(id, snapshot);

  // Emit snapshot event
  this.trace('system', {
    type: 'snapshot' as const,
    snapshotId: id,
    reason,
    eventCount: totalEvents,
  } as Omit<ISnapshotEvent, 'timestamp' | 'channel'>);

  return snapshot;
};

/**
 * Get stored snapshot
 */
TracerManager.prototype.getSnapshot = function (
  this: ITracerManager,
  id: string
): ITraceSnapshot | undefined {
  return this.snapshots.get(id);
};

/**
 * Mark breakpoint and create snapshot
 * TRAIL BACK: User-defined trace point
 */
TracerManager.prototype.markBreakpoint = function (
  this: ITracerManager,
  name: string,
  data?: Record<string, unknown>
): void {
  if (!this.isEnabled()) return;

  // Emit breakpoint event
  this.trace('system', {
    type: 'breakpoint' as const,
    name,
    data,
  } as Omit<IBreakpointEvent, 'timestamp' | 'channel'>);

  // Create snapshot
  this.snapshot('breakpoint', data);
};

/**
 * Clear all channels and snapshots
 */
TracerManager.prototype.clear = function (this: ITracerManager): void {
  this.channels.forEach((channel) => channel.clear());
  this.channels.clear();
  this.snapshots.clear();

  // Close HTTP target
  if (this.httpTarget) {
    this.httpTarget.close();
    this.httpTarget = null;
  }
};

/**
 * Singleton instance
 */
let instance: ITracerManager | null = null;

/**
 * Get tracer manager singleton
 */
export function getTracerManager(): ITracerManager {
  if (!instance) {
    instance = new (TracerManager as unknown as new () => ITracerManager)();
  }
  return instance;
}

/**
 * Reset singleton (for testing)
 */
export function resetTracerManager(): void {
  if (instance) {
    instance.clear();
  }
  instance = null;
}

