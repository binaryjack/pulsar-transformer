console.log('process.env.PULSAR_TRACE:', process.env.PULSAR_TRACE);
console.log('String check:', process.env.PULSAR_TRACE === '1');
console.log('Type:', typeof process.env.PULSAR_TRACE);
console.log(
  'Value bytes:',
  process.env.PULSAR_TRACE ? [...process.env.PULSAR_TRACE].map((c) => c.charCodeAt(0)) : 'undefined'
);
