// Set environment BEFORE any imports (even hoisted ones can't run yet)
process.env.PULSAR_TRACE = '1';
process.env.PULSAR_TRACE_CHANNELS = 'lexer,parser';
process.env.PULSAR_TRACE_WINDOW = '1000';

// Now import and run the test
import('./test-tracer-main.js').catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
