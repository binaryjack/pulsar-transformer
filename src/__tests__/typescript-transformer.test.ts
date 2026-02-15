/**
 * TypeScript Transformer Test - Basic functionality verification
 * Pattern: Test the new TypeScript transformer approach
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { transformPSR } from '../typescript-transformer-index.js';

describe('TypeScript Transformer', () => {
  it('should transform simple Counter component correctly', async () => {
    // Use the existing golden fixture
    const fixturePath = join(process.cwd(), 'tests/fixtures/real-psr/01-counter.psr');
    const source = readFileSync(fixturePath, 'utf-8');

    console.log('\n=== INPUT PSR ===');
    console.log(source);

    // Transform using new TypeScript transformer
    const result = await transformPSR(source, {
      filePath: 'counter.psr',
      debug: true,
    });

    console.log('\n=== TRANSFORMATION TRACKER ===');
    if (result.tracker) {
      console.log(result.tracker.generateDetailedReport());
    }

    console.log('\n=== OUTPUT JAVASCRIPT ===');
    console.log(result.code);

    console.log('\n=== METRICS ===');
    console.log(`Duration: ${result.metrics?.totalDuration.toFixed(2)}ms`);
    console.log(`Steps: ${result.metrics?.transformationSteps}`);
    console.log(`Success Rate: ${(result.metrics?.successRate * 100).toFixed(1)}%`);
    console.log(`Imports: [${result.imports.join(', ')}]`);
    console.log(`Components: [${result.components.join(', ')}]`);

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

    // Should preserve component parameters
    expect(result.code).toContain('{ id }');
    expect(result.code).toContain('ICounterProps');

    // Should track imports correctly
    expect(result.imports).toContain('$REGISTRY');
    expect(result.imports).toContain('t_element');

    // Should track components correctly
    expect(result.components).toContain('Counter');

    // Should have no errors
    const errors = result.diagnostics.filter((d) => d.type === 'error');
    expect(errors.length).toBe(0);

    // Should have reasonable metrics
    expect(result.metrics?.transformationSteps).toBeGreaterThan(0);
    expect(result.metrics?.successRate).toBe(1); // 100% success
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

    const result = await transformPSR(source, {
      filePath: 'style-test.psr',
      debug: false,
    });

    console.log('\n=== STYLE OBJECT TEST ===');
    console.log(result.code);

    // Should transform style object to string
    expect(result.code).toContain('padding: 20px');
    expect(result.code).toContain('border-radius: 8px'); // camelCase → kebab-case
    expect(result.code).toContain('${color()}'); // reactive value preserved

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

    const result = await transformPSR(source, {
      filePath: 'conditional-test.psr',
      debug: false,
    });

    console.log('\n=== SHOW COMPONENT TEST ===');
    console.log(result.code);

    // Should transform ShowRegistry to conditional expression
    expect(result.code).toContain('show()'); // condition
    expect(result.code).toContain('?'); // conditional operator
    expect(result.code).toContain(':'); // conditional operator

    // Should handle fallback
    expect(result.code).toContain('Hidden'); // fallback content

    // Should have no errors
    const errors = result.diagnostics.filter((d) => d.type === 'error');
    expect(errors.length).toBe(0);
  });
});
