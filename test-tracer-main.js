// Import from main index to trigger init-tracing
import { getTracerManager } from './dist/debug/tracer/index.js';
import './dist/index.js';
import { createLexer } from './dist/lexer/index.js';
import { createParser } from './dist/parser/index.js';

console.log('\n=== TRACER TEST ===');
console.log('Tracing Enabled:', process.env.PULSAR_TRACE);
console.log('Channels:', process.env.PULSAR_TRACE_CHANNELS);

// Set up event listener
const tracer = getTracerManager();
let eventCount = 0;

tracer.subscribeAll((event) => {
  eventCount++;
  if (eventCount <= 20) {
    console.log(
      `[${event.channel.toUpperCase()}] ${event.type} - ${event.type.includes('function') ? event.name : ''}`
    );
  }
});

// Run transformation
console.log('\n=== Running Transformation ===');
const source = `export const Test = () => { return <div>Hello</div>; };`;

const lexer = createLexer(source);
const tokens = lexer.scanTokens();

const parser = createParser(tokens);
const ast = parser.parse();

console.log(`\n=== Results ===`);
console.log(`Tokens: ${tokens.length}`);
console.log(`AST body length: ${ast.body.length}`);
console.log(`Total events captured: ${eventCount}`);

// Get latest events from each channel
console.log(`\n=== Latest Events ===`);
const lexerEvents = tracer.getLatest('lexer', 5);
const parserEvents = tracer.getLatest('parser', 5);

console.log(`\nLexer (last 5):`);
lexerEvents.forEach((e) =>
  console.log(`  - ${e.type}: ${e.type.includes('function') ? e.name : ''}`)
);

console.log(`\nParser (last 5):`);
parserEvents.forEach((e) =>
  console.log(`  - ${e.type}: ${e.type.includes('function') ? e.name : ''}`)
);

// Test breakpoint
console.log(`\n=== Testing Breakpoint ===`);
tracer.markBreakpoint('test-checkpoint', { test: 'data' });
console.log(`Snapshots created: ${tracer.snapshots.size}`);

console.log('\n✅ Tracer test complete!');
