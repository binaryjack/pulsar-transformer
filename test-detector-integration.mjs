/**
 * Integration Test: ComponentDetector Detection
 */

import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const testCode = `
export const TestVariableJsx = (): HTMLElement => {
  const container = <div><p>Test</p></div>;
  return container;
};

export const TestDirectJsx = (): HTMLElement => {
  return <div><p>Direct</p></div>;
};
`;

console.log('🧪 ComponentDetector Integration Test\n');

const testFilePath = path.join(__dirname, 'temp-test.tsx');
fs.writeFileSync(testFilePath, testCode);

const program = ts.createProgram([testFilePath], {
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
  jsx: ts.JsxEmit.React,
});

const sourceFile = program.getSourceFile(testFilePath);

const { createComponentDetector } = await import('./dist/detector/create-component-detector.js');

const detector = createComponentDetector({
  checker: program.getTypeChecker(),
  sourceFile: sourceFile,
  debug: false,
});

let found = [];

const visit = (node) => {
  if (ts.isVariableStatement(node)) {
    const decl = node.declarationList.declarations[0];
    if (decl?.initializer && ts.isArrowFunction(decl.initializer)) {
      const result = detector.detect(decl.initializer);
      if (result.isComponent) {
        found.push({
          name: decl.name.text,
          strategy: result.primaryReason?.strategy,
        });
      }
    }
  }
  ts.forEachChild(node, visit);
};

visit(sourceFile);
fs.unlinkSync(testFilePath);

console.log(`Found ${found.length} components:\n`);
found.forEach((c) => console.log(`  ✅ ${c.name} (${c.strategy})`));

const variableDetected = found.some((c) => c.name === 'TestVariableJsx');
const directDetected = found.some((c) => c.name === 'TestDirectJsx');

if (variableDetected && directDetected) {
  console.log(`\n🎉 SUCCESS: All components detected!`);
  console.log(`  ⭐ Variable JSX pattern (TestVariableJsx) detected`);
  console.log(`  ⭐ Direct JSX pattern (TestDirectJsx) detected`);
  console.log(`\n  Note: Both use ReturnTypeStrategy (P1 highest priority)`);
  console.log(`  because they have ': HTMLElement' return type annotations.\n`);
  console.log(`  ComponentDetector integration is working correctly!\n`);
  process.exit(0);
} else {
  console.log(`\n❌ FAILED: Not all components detected\n`);
  process.exit(1);
}
