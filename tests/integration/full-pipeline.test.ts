/**
 * Integration Test: Full PSR → TypeScript Pipeline
 * Tests complete transformation with golden fixtures
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

describe('Full Pipeline Integration', () => {
  const fixturesPath = join(__dirname, '../fixtures');
  const psrPath = join(fixturesPath, 'real-psr');
  const expectedPath = join(fixturesPath, 'expected-output');

  // Helper to normalize whitespace for comparison
  const normalize = (code: string): string => {
    return code
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\(\s+/g, '(')
      .replace(/\s+\)/g, ')')
      .replace(/\{\s+/g, '{')
      .replace(/\s+\}/g, '}')
      .replace(/\[\s+/g, '[')
      .replace(/\s+\]/g, ']');
  };

  it('should transform 01-counter.psr correctly', async () => {
    const input = readFileSync(join(psrPath, '01-counter.psr'), 'utf-8');
    const expected = readFileSync(join(expectedPath, '01-counter.expected.ts'), 'utf-8');

    // Import and use createPipeline with debug enabled
    const { createPipeline } = await import('../../src/index.js');
    const pipeline = createPipeline({
      filePath: '01-counter.psr',
      debug: true,
      debugLevel: 'debug',
      debugChannels: ['pipeline', 'jsx', 'codegen'],
    });
    const result = await pipeline.transform(input);

    // For debugging: log the result
    console.log('\n===== GENERATED CODE =====\n');
    console.log(result.code);
    console.log('\n===== EXPECTED CODE =====\n');
    console.log(expected);
    console.log('\n===== END =====\n');

    // Compare normalized versions
    expect(normalize(result.code)).toBe(normalize(expected));
  });

  it('should transform 02-badge.psr correctly', async () => {
    const input = readFileSync(join(psrPath, '02-badge.psr'), 'utf-8');
    const expected = readFileSync(join(expectedPath, '02-badge.expected.ts'), 'utf-8');

    try {
      const { createPipeline } = await import('../../src/index.js');
      const pipeline = createPipeline({
        enabled: true,
        level: 'debug',
        channels: ['pipeline', 'codegen'],
        timestamps: true,
        colors: true,
        performance: true,
      });

      const result = await pipeline.transform(input);

      console.log('\n===== GENERATED CODE =====\n');
      console.log(result.code);
      if (result.diagnostics && result.diagnostics.length > 0) {
        console.log('\n===== DIAGNOSTICS/ERRORS =====\n');
        console.log(JSON.stringify(result.diagnostics, null, 2));
      }
      console.log('\n===== EXPECTED CODE =====\n');
      console.log(expected);
      console.log('\n===== END =====\n');

      expect(normalize(result.code)).toBe(normalize(expected));
    } catch (error) {
      console.error('\n===== TEST ERROR =====\n');
      console.error(error);
      throw error;
    }
  });

  it('should transform 03-drawer.psr correctly', async () => {
    const input = readFileSync(join(psrPath, '03-drawer.psr'), 'utf-8');
    const expected = readFileSync(join(expectedPath, '03-drawer.expected.ts'), 'utf-8');

    const { createPipeline } = await import('../../src/index.js');
    const pipeline = createPipeline({
      enabled: true,
      level: 'debug',
      channels: ['pipeline', 'codegen'],
      timestamps: true,
      colors: true,
      performance: true,
    });

    const result = await pipeline.transform(input);

    console.log('\n===== DIAGNOSTICS =====\n');
    console.log(JSON.stringify(result.diagnostics, null, 2));
    console.log('\n===== GENERATED CODE =====\n');
    console.log(result.code);
    console.log('\n===== EXPECTED CODE =====\n');
    console.log(expected);
    console.log('\n===== END =====\n');

    expect(normalize(result.code)).toBe(normalize(expected));
  });
});
