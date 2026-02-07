import { createAnalyzer } from './src/analyzer/factory/analyzer-factory';
import { createParser } from './src/parser/factory/parser-factory';

// Test the exact same code as the failing test
const source = `import { Button } from './components';`;

console.log('Source:', source);

const parser = createParser();
const ast = parser.parse(source);

console.log('AST:', JSON.stringify(ast, null, 2));

const analyzer = createAnalyzer({});
const ir = analyzer.analyze(ast);

console.log('IR type:', ir.type);
console.log('IR metadata:', JSON.stringify(ir.metadata, null, 2));
console.log('IR metadata line:', ir.metadata?.line);
console.log('IR metadata column:', ir.metadata?.column);
