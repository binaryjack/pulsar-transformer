import { readFileSync } from 'fs';
import { createPipeline } from './dist/index.js';

const source = readFileSync('../pulsar-ui.dev/src/test-simple.psr', 'utf8');
const pipeline = createPipeline({ useTransformer: true });
const result = await pipeline.transform(source);

console.log('=== FULL OUTPUT ===');
console.log(result.code);
console.log('=== END ===');
console.log('\nLength:', result.code.length);
