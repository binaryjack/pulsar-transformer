import { getTracerManager } from './dist/debug/tracer/index.js';
import { getEnabledChannels, isTracingEnabled } from './dist/debug/tracer/utils/env-check.js';

console.log('=== Environment Check ===');
console.log('PULSAR_TRACE:', process.env.PULSAR_TRACE);
console.log('PULSAR_TRACE_CHANNELS:', process.env.PULSAR_TRACE_CHANNELS);
console.log('isTracingEnabled():', isTracingEnabled());
console.log('getEnabledChannels():', getEnabledChannels());

const tracer = getTracerManager();
console.log('\n=== Tracer Manager ===');
console.log('tracer.enabled:', tracer.enabled);
console.log('tracer.isEnabled():', tracer.isEnabled());
console.log('tracer.channels.size:', tracer.channels.size);

// Manually emit events on enabled channels
console.log('\n=== Manual Event Test ===');
let received = 0;
tracer.subscribeAll((event) => {
  console.log('Event received:', event.type, event.channel, event.name || '');
  received++;
});

tracer.trace('lexer', {
  type: 'function.start',
  name: 'testFunction',
  args: [],
  callId: 'test-123',
});

tracer.trace('parser', {
  type: 'function.start',
  name: 'anotherTest',
  args: [],
  callId: 'test-456',
});

console.log('Events received:', received);
