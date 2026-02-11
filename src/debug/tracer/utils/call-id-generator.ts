/**
 * Generate unique call IDs for tracing
 * Uses timestamp + counter for collision-free IDs
 */

let counter = 0;

/**
 * Generate unique call ID
 * Format: timestamp-counter
 * @returns Unique identifier string
 */
export function generateCallId(): string {
  return `${Date.now()}-${++counter}`;
}

/**
 * Generate unique loop ID
 * Format: loop-timestamp-counter
 * @returns Unique loop identifier string
 */
export function generateLoopId(): string {
  return `loop-${Date.now()}-${++counter}`;
}

/**
 * Generate unique snapshot ID
 * Format: snap-timestamp-counter
 * @returns Unique snapshot identifier string
 */
export function generateSnapshotId(): string {
  return `snap-${Date.now()}-${++counter}`;
}

/**
 * Reset counter (for testing)
 */
export function resetIdGenerator(): void {
  counter = 0;
}
