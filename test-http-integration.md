# Testing HTTP Target Integration

## Prerequisites

1. Build transformer:

   ```bash
   pnpm run build
   ```

2. Install VS Code extension (or use mock server)

## Option 1: With VS Code Extension

1. **Start VS Code Extension Tracer:**
   - Open Command Palette (`Ctrl+Shift+P`)
   - Run: `Pulsar: Start Tracer`

2. **Run test:**

   ```bash
   cd packages/pulsar-transformer

   # Windows (PowerShell)
   $env:PULSAR_TRACE='1'
   $env:PULSAR_TRACE_HTTP='http://localhost:9339/trace'
   $env:PULSAR_TRACE_CHANNELS='lexer,parser'
   node test-http-client.js

   # Windows (cmd)
   set PULSAR_TRACE=1
   set PULSAR_TRACE_HTTP=http://localhost:9339/trace
   set PULSAR_TRACE_CHANNELS=lexer,parser
   node test-http-client.js
   ```

3. **Check VS Code:**
   - View → Output → "Pulsar Tracer"
   - You should see real-time events!

## Option 2: With Mock Server

1. **Start mock server:**

   ```bash
   cd packages/pulsar-transformer
   node test-http-server.js
   ```

   Server starts on `http://localhost:9339`

2. **In another terminal, run test:**

   ```bash
   cd packages/pulsar-transformer

   # Windows (PowerShell)
   $env:PULSAR_TRACE='1'
   $env:PULSAR_TRACE_HTTP='http://localhost:9339/trace'
   $env:PULSAR_TRACE_CHANNELS='lexer,parser'
   node test-http-client.js
   ```

3. **Check server terminal:**
   You should see:
   ```
   📦 Received batch of XX events:
   [14:23:45] [LEXER     ] function.start    scanTokens
   [14:23:45] [LEXER     ] function.start    scanToken
   [14:23:45] [LEXER     ] function.start    scanIdentifier
   ...
   ```

## Expected Output

### Client (test-http-client.js):

```
🧪 Testing HTTP Target Integration

Environment:
  PULSAR_TRACE: 1
  PULSAR_TRACE_HTTP: http://localhost:9339/trace
  PULSAR_TRACE_CHANNELS: lexer,parser

📝 Running transformation...
✅ Transformation complete: 45 tokens, 1 statements

Check the server terminal for received events!

🎉 Test complete!
```

### Server (VS Code or mock):

```
📦 Received batch of 10 events:
[14:23:45] [LEXER     ] function.start    scanTokens
[14:23:45] [LEXER     ] function.start    scanToken
[14:23:45] [LEXER     ] function.start    scanIdentifier
[14:23:45] [LEXER     ] function.end      scanIdentifier (0.42ms)
[14:23:45] [LEXER     ] function.end      scanToken (0.58ms)
...
```

## Troubleshooting

### "ECONNREFUSED"

- Server not running
- Start `test-http-server.js` or VS Code extension

### "Port 9339 in use"

- Another tracer running
- Stop other instances or change port

### No events received

- Check `PULSAR_TRACE=1` is set
- Check `PULSAR_TRACE_HTTP` URL is correct (include `/trace`)
- Verify transformer build is up to date

## Performance Test

Run multiple transformations:

```bash
for i in {1..5}; do node test-http-client.js; done
```

Check latency - should be <50ms per batch.
