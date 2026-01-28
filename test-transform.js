import ts from 'typescript';
import transformer from './dist/index.js';

const code = `
import React from 'react';

export const TestComponent = () => {
  return (
    <div className="test">
      <button onClick={() => console.log('test')}>
        Click me
      </button>
    </div>
  );
};
`;

try {
  const result = ts.transpileModule(code, {
    compilerOptions: { module: ts.ModuleKind.ESNext },
    transformers: { before: [transformer()] },
  });
  console.log('✓ Transformation successful');
  console.log('\nTransformed code (first 500 chars):');
  console.log(result.outputText.substring(0, 500));
} catch (e) {
  console.error('✗ Transformation failed');
  console.error(e.message);
  console.error(e.stack);
}
