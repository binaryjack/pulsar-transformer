/**
 * Environment variable check for tracer enablement
 * NO caching - always read from process.env to support runtime configuration
 */

/**
 * Check if tracing is enabled via PULSAR_TRACE environment variable
 * @returns true if PULSAR_TRACE=1 or 'true', false otherwise
 */
export function isTracingEnabled(): boolean {
  const value = (process.env.PULSAR_TRACE || '').trim(); // Trim to handle cmd /c trailing spaces
  return value === '1' || value === 'true';
}

/**
 * Get enabled trace channels from PULSAR_TRACE_CHANNELS
 * @returns Array of channel names, or empty array for all channels
 * @example PULSAR_TRACE_CHANNELS=lexer,parser
 */
export function getEnabledChannels(): string[] {
  const channels = process.env.PULSAR_TRACE_CHANNELS;
  return channels ? channels.split(',').map((c) => c.trim()) : [];
}

/**
 * Get trace window size from PULSAR_TRACE_WINDOW
 * @returns Window size (default 1000, min 100, max 10000)
 */
export function getTraceWindowSize(): number {
  const size = parseInt(process.env.PULSAR_TRACE_WINDOW || '1000', 10);
  return isNaN(size) ? 1000 : Math.max(100, Math.min(size, 10000));
}

