// Simple test script for component routing
import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load and run transformer
const transformerPath = path.join(__dirname, 'dist', 'index.js');
const module = await import(transformerPath);
const pulsarTransformer = module.default;

const testCode = fs.readFileSync('../../test-component-routing.tsx', 'utf-8');

// Transform using ts.transpileModule
const result = ts.transpileModule(testCode, {
  compilerOptions: {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    jsx: ts.JsxEmit.React,
    jsxFactory: 'createElement',
    jsxFragmentFactory: 'Fragment',
  },
  fileName: 'test.tsx',
  transformers: {
    before: [
      (ctx) => {
        // Create a simple program
        const sourceFile = ts.createSourceFile('test.tsx', testCode, ts.ScriptTarget.ESNext, true);
        return pulsarTransformer(null)(ctx);
      },
    ],
  },
});

console.log('=== TRANSFORMATION RESULT ===');
console.log(result.outputText);
console.log('=== END ===');
