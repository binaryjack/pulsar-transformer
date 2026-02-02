/**
 * Integration Test: ComponentDetector in ProjectTransformer
 * 
 * Simple test to verify ComponentDetector integration works
 */

import ts from 'typescript';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Test source code with variable JSX pattern
const testCode = `
import { useState } from '@pulsar/core';

// Variable JSX pattern (THE BIG FIX)
export const TestVariableJsx = (): HTMLElement => {
  const [count, setCount] = useState(0);
  
  const container = (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => setCount(prev => prev + 1)}>
        Increment
      </button>
    </div>
  );
  
  return container;
};

// Direct JSX pattern (control)
export const TestDirectJsx = (): HTMLElement => {
  return (
    <div>
      <p>Direct JSX</p>
    </div>
  );
};
`;

console.log('🧪 Integration Test: ComponentDetector Detection\n');

try {
  // Write test file
  const testFilePath = path.join(__dirname, 'test-components-temp.tsx');
  fs.writeFileSync(testFilePath, testCode);
  
  console.log('✅ Created test file:', path.basename(testFilePath), '\n');
  
  // Create TypeScript program
  const compilerOptions = {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    jsx: ts.JsxEmit.React,
    jsxFactory: 't_element',
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    allowJs: true,
  };

  const program = ts.createProgram([testFilePath], compilerOptions);
  const sourceFile = program.getSourceFile(testFilePath);
  
  if (!sourceFile) {
    throw new Error('Could not load source file');
  }
  
  console.log('📦 Testing ComponentDetector directly...\n');
  
  // Import and test ComponentDetector
  const { createComponentDetector } = await import('./dist/detector/create-component-detector.js');
  
  const detector = createComponentDetector({
    checker: program.getTypeChecker(),
    sourceFile: sourceFile,
    debug: true,
  });
  
  console.log('✅ ComponentDetector created\n');
  console.log('🔍 Scanning for components...\n');
  
  let foundComponents = [];
  
  const visit = (node) => {
    // Check function declarations
    if (ts.isFunctionDeclaration(node) && node.name) {
      const result = detector.detect(node);
      if (result.isComponent) {
        const name = node.name.text;
        const strategy = result.primaryReason?.strategy || 'unknown';
        const confidence = result.confidence;
        foundComponents.push({ name, strategy, confidence });
        console.log(`  ✅ ${name}`);
        console.log(`     Strategy: ${strategy}`);
        console.log(`     Confidence: ${confidence}\n`);
      }
    }
    
    // Check arrow functions in variable statements
    if (ts.isVariableStatement(node)) {
      const decl = node.declarationList.declarations[0];
      if (decl && ts.isIdentifier(decl.name) && decl.initializer && ts.isArrowFunction(decl.initializer)) {
        const result = detector.detect(decl.initializer);
        if (result.isComponent) {
          const name = decl.name.text;
          const strategy = result.primaryReason?.strategy || 'unknown';
          const confidence = result.confidence;
          foundComponents.push({ name, strategy, confidence });
          console.log(`  ✅ ${name}`);
          console.log(`     Strategy: ${strategy}`);
          console.log(`     Confidence: ${confidence}\n`);
        }
      }
    }
    
    ts.forEachChild(node, visit);
  };
  
  visit(sourceFile);
  
  // Clean up
  fs.unlinkSync(testFilePath);
  
  console.log('🎯 Results:\n');
  console.log(`  Components found: ${foundComponents.length}`);
  
  // Check for variable JSX pattern
  const variableJsxFound = foundComponents.find(c => c.name === 'TestVariableJsx');
  
  if (variableJsxFound) {
    console.log(`\n🎉 SUCCESS: Variable JSX pattern detected!`);
    console.log(`  Strategy: ${variableJsxFound.strategy}`);
    console.log(`  ⭐ THE BIG FIX is working!\n`);
    process.exit(0);
  } else {
    console.log(`\n❌ FAILURE: Variable JSX pattern not detected\n`);
    process.exit(1);
  }
  
} catch (error) {
  console.error('\n❌ Integration test failed:\n');
  console.error(error);
  process.exit(1);
}


// Test source code with variable JSX pattern
const testCode = `
import { useState } from '@pulsar/core';

// Variable JSX pattern (THE BIG FIX)
export const TestVariableJsx = (): HTMLElement => {
  const [count, setCount] = useState(0);
  
  const container = (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => setCount(prev => prev + 1)}>
        Increment
      </button>
    </div>
  );
  
  return container;
};

// Direct JSX pattern (control)
export const TestDirectJsx = (): HTMLElement => {
  return (
    <div>
      <p>Direct JSX</p>
    </div>
  );
};

// Conditional JSX pattern
export const TestConditionalJsx = (): HTMLElement => {
  const [show, setShow] = useState(true);
  return show() ? <div>Visible</div> : <div>Hidden</div>;
};
`;

console.log('🧪 Integration Test: ComponentDetector in ProjectTransformer\n');

try {
  // Create test file
  const testFilePath = path.join(__dirname, 'test-components.tsx');
  
  // Create TypeScript program
  const compilerOptions = {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    jsx: ts.JsxEmit.React,
    jsxFactory: 't_element',
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
  };

  const host = ts.createCompilerHost(compilerOptions);
  const originalGetSourceFile = host.getSourceFile;
  
  host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
    if (fileName === testFilePath) {
      return ts.createSourceFile(fileName, testCode, languageVersion, true);
    }
    return originalGetSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
  };

  const program = ts.createProgram([testFilePath], compilerOptions, host);
  
  // Create ProjectTransformer context
  const context = {
    program,
    rootDir: __dirname,
    filePaths: [testFilePath],
    dependencyGraph: new Map(),
    componentDefinitions: new Map(),
    processedFiles: new Set(),
    transformationResults: new Map(),
    debug: true,
  };

  console.log('📦 Creating ProjectTransformer with ComponentDetector...\n');
  
  const transformer = createProjectTransformer(context);
  
  console.log('🔍 Transforming project...\n');
  
  const result = await transformer.transform();
  
  console.log('\n✅ Transform Results:\n');
  console.log(`  Files Transformed: ${result.filesTransformed}`);
  console.log(`  Components Found: ${result.componentsTransformed}`);
  console.log(`  Errors: ${result.errors.length}`);
  
  if (result.errors.length > 0) {
    console.log('\n❌ Errors:');
    result.errors.forEach(err => console.log(`  - ${err.message}`));
  }
  
  // Check component definitions
  console.log('\n📋 Component Definitions:\n');
  context.componentDefinitions.forEach((comp, name) => {
    console.log(`  ✓ ${name} (${comp.type})`);
  });
  
  // Validate expected components
  const expectedComponents = ['TestVariableJsx', 'TestDirectJsx', 'TestConditionalJsx'];
  const foundComponents = Array.from(context.componentDefinitions.keys());
  
  console.log('\n🎯 Validation:\n');
  
  expectedComponents.forEach(expected => {
    const found = foundComponents.includes(expected);
    console.log(`  ${found ? '✅' : '❌'} ${expected}: ${found ? 'DETECTED' : 'MISSING'}`);
  });
  
  const allFound = expectedComponents.every(name => foundComponents.includes(name));
  
  if (allFound) {
    console.log('\n🎉 SUCCESS: All components detected!\n');
    console.log('  ⭐ Variable JSX pattern (THE BIG FIX) working!\n');
    process.exit(0);
  } else {
    console.log('\n❌ FAILURE: Some components not detected\n');
    process.exit(1);
  }
  
} catch (error) {
  console.error('\n❌ Integration test failed:\n');
  console.error(error);
  process.exit(1);
}
