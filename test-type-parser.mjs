// Test the type-alias parser directly
import { createParser } from './dist/parser/create-parser.js'

console.log('Testing type-alias parser...\n');

// Test 1: String literal type
const test1 = "type Status = 'active';";
const parser1 = createParser();
const ast1 = parser1.parse(test1);
const typeAlias1 = ast1.body[0];
console.log(`Test 1 - String literal type:`);
console.log(`  Expected: 'active'`);
console.log(`  Got:      ${typeAlias1.typeAnnotation}`);
console.log(`  Pass:     ${typeAlias1.typeAnnotation === "'active'" ? '✓' : '✗'}\n`);

// Test 2: Array type
const test2 = 'type Items = string[];';
const parser2 = createParser();
const ast2 = parser2.parse(test2);
const typeAlias2 = ast2.body[0];
console.log(`Test 2 - Array type:`);
console.log(`  Expected: string[]`);
console.log(`  Got:      ${typeAlias2.typeAnnotation}`);
console.log(`  Pass:     ${typeAlias2.typeAnnotation === "string[]" ? '✓' : '✗'}\n`);

// Test 3: Generic type
const test3 = 'type Nullable<T> = T | null;';
const parser3 = createParser();
const ast3 = parser3.parse(test3);
const typeAlias3 = ast3.body[0];
console.log(`Test 3 - Generic type:`);
console.log(`  Expected: T | null`);
console.log(`  Got:      ${typeAlias3.typeAnnotation}`);
console.log(`  Pass:     ${typeAlias3.typeAnnotation === "T | null" ? '✓' : '✗'}\n`);

// Test 4: Function type
const test4 = 'type Handler = () => void;';
const parser4 = createParser();
const ast4 = parser4.parse(test4);
const typeAlias4 = ast4.body[0];
console.log(`Test 4 - Function type:`);
console.log(`  Expected: () => void`);
console.log(`  Got:      ${typeAlias4.typeAnnotation}`);
console.log(`  Pass:     ${typeAlias4.typeAnnotation === "() => void" ? '✓' : '✗'}\n`);
