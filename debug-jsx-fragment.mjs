import { ASTNodeType } from '../parser/ast/ast-node-types.js';
import { createParser } from '../parser/create-parser.js';

const parser = createParser();
const source = '<></>';
console.log('Testing JSX fragment parsing...');
console.log('Source:', source);

const program = parser.parse(source);
console.log('Program:', program);
console.log('Body:', program.body);
if (program.body[0]) {
  console.log('First statement type:', program.body[0].type);
  console.log('Expected:', ASTNodeType.PSR_FRAGMENT);
  console.log('Match:', program.body[0].type === ASTNodeType.PSR_FRAGMENT);
}
