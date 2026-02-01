/**
 * File hash generator for stable component IDs
 * Uses SHA-256 for deterministic hashing
 */

import * as crypto from 'crypto';

/**
 * Generate stable 8-character hash from file path
 *
 * @param filePath - Absolute file path
 * @returns 8-character hex string
 *
 * @example
 * generateFileHash('/src/components/button.tsx')
 * // => "a3f21c4d"
 */
export function generateFileHash(filePath: string): string {
  // Normalize path separators for cross-platform consistency
  const normalized = filePath.replace(/\\/g, '/');

  // Generate SHA-256 hash
  const hash = crypto.createHash('sha256').update(normalized).digest('hex');

  // Return first 8 characters for compact IDs
  return hash.substring(0, 8);
}
