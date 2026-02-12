/**
 * Unit tests for semantic analyzer - reactivity validation
 */

import { describe, expect, it } from 'vitest';
import { createLexer } from '../../lexer/index.js';
import { createParser } from '../../parser/index.js';
import { SemanticAnalyzer } from '../../semantic-analyzer/index.js';

describe('SemanticAnalyzer - Reactivity', () => {
  it('should warn when useEffect is missing dependency array', () => {
    const source = `component App() {
  const [count, setCount] = createSignal(0);
  
  useEffect(() => {
    console.log(count());
  });
  
  return <div>{count()}</div>;
}`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer(ast);

    const result = analyzer.analyze();

    expect(result.warnings.some((w) => w.message.includes('missing dependency array'))).toBe(true);
  });

  it('should warn about missing dependencies in useEffect', () => {
    const source = `component App() {
  const [count, setCount] = createSignal(0);
  const [name, setName] = createSignal('test');
  
  useEffect(() => {
    console.log(count());
    console.log(name());
  }, [count]);
  
  return <div>{count()}</div>;
}`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer(ast);

    const result = analyzer.analyze();

    const missingDepWarning = result.warnings.find((w) =>
      w.message.includes('missing dependencies')
    );
    expect(missingDepWarning).toBeDefined();
    expect(missingDepWarning?.message).toContain('name');
  });

  it('should warn about unnecessary dependencies in useEffect', () => {
    const source = `component App() {
  const [count, setCount] = createSignal(0);
  const [name, setName] = createSignal('test');
  
  useEffect(() => {
    console.log(count());
  }, [count, name]);
  
  return <div>{count()}</div>;
}`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer(ast);

    const result = analyzer.analyze();

    const unnecessaryWarning = result.warnings.find((w) =>
      w.message.includes('unnecessary dependencies')
    );
    expect(unnecessaryWarning).toBeDefined();
    expect(unnecessaryWarning?.message).toContain('name');
  });

  it('should not warn when dependencies are correct', () => {
    const source = `component App() {
  const [count, setCount] = createSignal(0);
  
  useEffect(() => {
    console.log(count());
  }, [count]);
  
  return <div>{count()}</div>;
}`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer(ast);

    const result = analyzer.analyze();

    const effectWarnings = result.warnings.filter(
      (w) =>
        w.message.includes('missing dependencies') || w.message.includes('unnecessary dependencies')
    );
    expect(effectWarnings).toHaveLength(0);
  });

  it('should ignore local variables declared inside effect', () => {
    const source = `component App() {
  const [count, setCount] = createSignal(0);
  
  useEffect(() => {
    const local = 123;
    console.log(count());
    console.log(local);
  }, [count]);
  
  return <div>{count()}</div>;
}`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer(ast);

    const result = analyzer.analyze();

    const effectWarnings = result.warnings.filter(
      (w) =>
        w.message.includes('missing dependencies') || w.message.includes('unnecessary dependencies')
    );
    expect(effectWarnings).toHaveLength(0);
  });

  it('should ignore built-in objects', () => {
    const source = `component App() {
  const [count, setCount] = createSignal(0);
  
  useEffect(() => {
    console.log(count());
    Math.random();
  }, [count]);
  
  return <div>{count()}</div>;
}`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer(ast);

    const result = analyzer.analyze();

    const effectWarnings = result.warnings.filter(
      (w) =>
        w.message.includes('missing dependencies') || w.message.includes('unnecessary dependencies')
    );
    expect(effectWarnings).toHaveLength(0);
  });

  it('should handle empty dependency array correctly', () => {
    const source = `component App() {
  const [count, setCount] = createSignal(0);
  
  useEffect(() => {
    console.log('mount');
  }, []);
  
  return <div>{count()}</div>;
}`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer(ast);

    const result = analyzer.analyze();

    // Empty deps array with no captured vars - should be fine
    const effectWarnings = result.warnings.filter(
      (w) =>
        w.message.includes('missing dependencies') || w.message.includes('unnecessary dependencies')
    );
    expect(effectWarnings).toHaveLength(0);
  });

  it('should detect missing dependencies with empty array', () => {
    const source = `component App() {
  const [count, setCount] = createSignal(0);
  
  useEffect(() => {
    console.log(count());
  }, []);
  
  return <div>{count()}</div>;
}`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer(ast);

    const result = analyzer.analyze();

    const missingDepWarning = result.warnings.find((w) =>
      w.message.includes('missing dependencies')
    );
    expect(missingDepWarning).toBeDefined();
    expect(missingDepWarning?.message).toContain('count');
  });
});
