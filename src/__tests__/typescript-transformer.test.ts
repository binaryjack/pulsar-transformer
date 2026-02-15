/**
 * TypeScript Transformer Test - Basic functionality verification
 * Pattern: Test the new TypeScript transformer approach
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { createPipeline } from '../index.js';

describe('TypeScript Transformer', () => {
  it('should transform simple Counter component correctly', async () => {
    // Use the existing golden fixture
    const fixturePath = join(process.cwd(), 'tests/fixtures/real-psr/01-counter.psr');
    const source = readFileSync(fixturePath, 'utf-8');

    console.log('\n=== INPUT PSR ===');
    console.log(source);

    // Transform using Babel pipeline
    const pipeline = createPipeline({ filePath: 'counter.psr', debug: true });
    const result = await pipeline.transform(source);

    console.log('\n=== OUTPUT JAVASCRIPT ===');
    console.log(result.code);

    console.log('\n=== METRICS ===');
    console.log(`Total Time: ${result.metrics.totalTime.toFixed(2)}ms`);

    // Basic verification
    expect(result.code).toBeTruthy();
    expect(result.code.length).toBeGreaterThan(100);

    // Should contain framework imports
    expect(result.code).toContain('import {');
    expect(result.code).toContain('@pulsar-framework/pulsar.dev');

    // Should contain $REGISTRY.execute
    expect(result.code).toContain('$REGISTRY.execute');

    // Should contain t_element calls
    expect(result.code).toContain('t_element');

    // Should contain component function with HTMLElement return type
    expect(result.code).toContain('function Counter');
    expect(result.code).toContain(': HTMLElement');

    // Should preserve component parameters (may have newlines between them)
    expect(result.code).toContain('id');
    expect(result.code).toContain('ICounterProps');

    // Should have no errors
    const errors = result.diagnostics.filter((d) => d.type === 'error');
    expect(errors.length).toBe(0);

    // Should have reasonable metrics
    expect(result.metrics.totalTime).toBeGreaterThan(0);
  });

  it('should transform JSX with style objects correctly', async () => {
    const source = `
import { createSignal } from '@pulsar-framework/pulsar.dev';

export component StyleTest() {
  const [color, setColor] = createSignal('#3b82f6');
  
  return (
    <div style={{
      padding: '20px',
      background: color(),
      borderRadius: '8px'
    }}>
      Style test: {color()}
    </div>
  );
}`;

    const pipeline = createPipeline({ filePath: 'style-test.psr', debug: false });
    const result = await pipeline.transform(source);

    console.log('\n=== STYLE OBJECT TEST ===');
    console.log(result.code);

    // Babel transforms style objects to JSX expressions (not serialized)
    expect(result.code).toContain('style:');

    // Should contain t_element call
    expect(result.code).toContain('t_element');

    // Should have no errors
    const errors = result.diagnostics.filter((d) => d.type === 'error');
    expect(errors.length).toBe(0);
  });

  it('should handle ShowRegistry control flow component', async () => {
    const source = `
import { createSignal, ShowRegistry } from '@pulsar-framework/pulsar.dev';

export component ConditionalTest() {
  const [show, setShow] = createSignal(true);
  
  return (
    <div>
      <ShowRegistry when={show()} fallback={<div>Hidden</div>}>
        <div>Visible content</div>
      </ShowRegistry>
    </div>
  );
}`;

    const pipeline = createPipeline({ filePath: 'conditional-test.psr', debug: false });
    const result = await pipeline.transform(source);

    console.log('\n=== SHOW COMPONENT TEST ===');
    console.log(result.code);

    // Babel transforms ShowRegistry calls (control flow component)
    expect(result.code).toContain('ShowRegistry');

    // Should contain conditional logic or component call
    expect(result.code.length).toBeGreaterThan(100);

    // Should have no errors
    const errors = result.diagnostics.filter((d) => d.type === 'error');
    expect(errors.length).toBe(0);
  });
});
