import { createAnalyzer } from './dist/analyzer/create-analyzer.js';
import { createEmitter } from './dist/emitter/create-emitter.js';
import { createParser } from './dist/parser/create-parser.js';

const parser = createParser();
const ast = parser.parse('export * from "./utils";');
console.log('AST:', JSON.stringify(ast, null, 2));

const analyzer = createAnalyzer();
const ir = analyzer.analyze(ast);
console.log('\nIR:', JSON.stringify(ir, null, 2));

const emitter = createEmitter();
const code = emitter.emit(ir);
console.log('\nGenerated Code:');
console.log(code);
