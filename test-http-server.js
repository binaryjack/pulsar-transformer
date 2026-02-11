/**
 * Test HTTP target integration
 * Simulates VS Code extension by starting local server
 */

import http from 'http';

// Minimal HTTP server simulating VS Code extension
const server = http.createServer((req, res) => {
  if (req.method === 'POST') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const { events } = JSON.parse(body);

        console.log(`\n📦 Received batch of ${events.length} events:`);

        events.forEach((event) => {
          const timestamp = new Date(event.timestamp).toLocaleTimeString();
          const channel = event.channel.toUpperCase().padEnd(10);
          const type = event.type.padEnd(18);
          const name = event.name || '';
          let line = `[${timestamp}] [${channel}] ${type}`;

          if (name) {
            line += ` ${name}`;
          }

          if (event.duration !== undefined) {
            line += ` (${event.duration.toFixed(2)}ms)`;
          }

          console.log(line);
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, received: events.length }));
      } catch (error) {
        console.error('Parse error:', error);
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

const PORT = 9339;

server.listen(PORT, () => {
  console.log('🚀 Mock VS Code Tracer Server Started');
  console.log(`📡 Listening on http://localhost:${PORT}/trace`);
  console.log('');
  console.log('Set environment variables:');
  console.log('  PULSAR_TRACE=1');
  console.log('  PULSAR_TRACE_HTTP=http://localhost:9339/trace');
  console.log('');
  console.log('Press Ctrl+C to stop');
  console.log('');
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error('Server error:', error);
    process.exit(1);
  }
});

process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});
