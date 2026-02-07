import { createParser } from './src/parser/factory/parser-factory';

// Test the exact same code as the failing test
const source = `import { Button } from './components';`;

console.log('Source:', source);

const parser = createParser();
const ast = parser.parse(source);

console.log('AST body[0] type:', ast.body[0].type);
console.log('AST body[0] location:', JSON.stringify(ast.body[0].location, null, 2));
console.log('AST body[0] location.start:', JSON.stringify(ast.body[0].location?.start, null, 2));
console.log('AST body[0] location.start.line:', ast.body[0].location?.start?.line);
console.log('AST body[0] location.start.column:', ast.body[0].location?.start?.column);
