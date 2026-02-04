/**
 * PSR Avatar Test - Pipeline Test
 * Testing the full PSR transformation pipeline with real-world components
 */

import { describe, it, expect } from 'vitest';
import { createPipeline } from '../pipeline/create-pipeline.js';

describe('PSR Real-World Component Transformation', () => {
  it('should transform Avatar component to JavaScript', () => {
    const psrAvatarCode = `
component Avatar({ size = 'md', src, alt, name }) {
  return (
    <div className="avatar">
      {src ? (
        <img src={src} alt={alt || name || 'Avatar'} />
      ) : (
        <span>{name}</span>
      )}
    </div>
  );
}
    `;

    const pipeline = createPipeline();
    const result = pipeline.transform(psrAvatarCode);

    console.log('\n=== 🎉 PSR AVATAR → JAVASCRIPT ===');
    console.log(result.code);
    console.log('=== END ===\n');

    expect(result.code).toContain('function Avatar');
    expect(result.code).toContain('$REGISTRY.execute');
    expect(result.code).toContain('component:Avatar');
    expect(result.code).toContain('t_element');
    expect(result.code).toContain('import');
    expect(result.diagnostics).toHaveLength(0);
  });

  it('should transform Counter with signals', () => {
    const psrCounterCode = `
component Counter() {
  const [count, setCount] = signal(0);
  
  return (
    <div>
      <button onClick={() => setCount(count() + 1)}>
        Count: {count()}
      </button>
    </div>
  );
}
    `;

    const pipeline = createPipeline();
    const result = pipeline.transform(psrCounterCode);

    console.log('\n=== 🎉 PSR COUNTER → JAVASCRIPT ===');
    console.log(result.code);
    console.log('=== END ===\n');

    expect(result.code).toContain('createSignal');
    expect(result.code).toContain('function Counter');
    expect(result.code).toContain('$REGISTRY.execute');
    expect(result.diagnostics).toHaveLength(0);
  });

  it('should transform Form with multiple signals and validation', () => {
    const psrFormCode = `
component UserForm() {
  const [name, setName] = signal('');
  const [email, setEmail] = signal('');
  const [isValid, setIsValid] = signal(false);
  
  return (
    <form>
      <input 
        type="text" 
        value={name()} 
        onInput={(e) => setName(e.target.value)} 
      />
      <input 
        type="email" 
        value={email()} 
        onInput={(e) => setEmail(e.target.value)} 
      />
      <button disabled={!isValid()}>Submit</button>
    </form>
  );
}
    `;

    const pipeline = createPipeline();
    const result = pipeline.transform(psrFormCode);

    console.log('\n=== 🎉 PSR FORM → JAVASCRIPT ===');
    console.log(result.code);
    console.log('=== END ===\n');

    const signalCount = (result.code.match(/= createSignal\(/g) || []).length;
    expect(signalCount).toBe(3);
    expect(result.code).toContain('function UserForm');
    expect(result.diagnostics).toHaveLength(0);
  });
});
