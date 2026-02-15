// Debug TypeScript factory methods
import ts from 'typescript';

console.log('TypeScript version:', ts.version);
console.log('TypeScript factory available?', !!ts.factory);

if (ts.factory) {
  console.log('Available factory methods containing "Arrow":');
  Object.getOwnPropertyNames(ts.factory)
    .filter((name) => name.toLowerCase().includes('arrow'))
    .forEach((name) => console.log(`  - ${name}`));

  console.log('\nAvailable factory methods containing "Function":');
  Object.getOwnPropertyNames(ts.factory)
    .filter((name) => name.toLowerCase().includes('function'))
    .forEach((name) => console.log(`  - ${name}`));

  console.log('\nFirst 20 factory methods:');
  Object.getOwnPropertyNames(ts.factory)
    .slice(0, 20)
    .forEach((name) => console.log(`  - ${name}`));

  // Check specific method
  if (ts.factory.createArrowFunction) {
    console.log('\n✅ createArrowFunction is available!');
  } else {
    console.log('\n❌ createArrowFunction not found');
  }
}
