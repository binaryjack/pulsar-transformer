import { createParser } from './dist/index.js';

// Test each incrementally
const tests = [
  { name: 'Simple', code: 'const fn = ({ a }) => {}' },
  { name: 'With default', code: 'const fn = ({ a = 1 }) => {}' },
  { name: 'Two params', code: 'const fn = ({ a, b }) => {}' },
  { name: 'Two with defaults', code: 'const fn = ({ a = 1, b = 2 }) => {}' },
  { name: 'With type', code: 'const fn = ({ a = 1 }: T) => {}' },
];

const parser = createParser();
for (const test of tests) {
  try {
    parser.parse(test.code);
    console.log('✅', test.name);
  } catch (e) {
    console.error('❌', test.name, ':', e.message);
  }
}
