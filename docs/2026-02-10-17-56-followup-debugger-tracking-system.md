# 2026-02-10-17-56 NEXT SESSION - Debugger Channel Tracking System

## 🎯 PRIMARY OBJECTIVE

Implement non-intrusive, channel-based debugger tracking system for transformer pipeline with real-time monitoring capability.

---

## 📋 IMMEDIATE PRIORITIES (DO FIRST)

### Priority 0: Verify Current State ⚠️
**BEFORE IMPLEMENTING ANYTHING**:

1. Run existing t_element tests:
   ```bash
   cd packages/pulsar.dev
   pnpm test -- t-element.test.ts
   ```
   **Expected**: FAILURES - API signature changed from `(tag, attrs, isSSR)` → `(tag, attrs, children, isSSR)`

2. Test main.psr (has keyword attribute):
   ```bash
   # Change main.ts: import { TestSimple } from './test-simple.psr'
   # To: import { HomePage } from './main.psr'
   # Open browser, check for errors
   ```

3. Test counter.psr (has expressions + emoji):
   ```bash
   # Import Counter component
   # Expected: FAIL - expressions in text not handled
   ```

**DO NOT PROCEED TO DEBUGGER SYSTEM UNTIL**:
- You know what broke from API change
- You have list of real failures from actual PSR files
- User approves continuing vs fixing breaking changes first

---

## 🔧 MAIN TASK: Debugger Channel Tracking System

### Requirements (From User)

1. **Non-intrusive**: Zero impact when disabled
2. **Channel-based**: Subscribe to specific debug channels
3. **Function tracking**: Start/End for every function
4. **Loop tracking**: Track each iteration with pertinent values
5. **Callstack tracking**: Full process callstack without stack overflow
6. **Real-time**: Output subscribable for live monitoring
7. **Production safe**: Must be disable-able (no traces in prod)
8. **Non-blocking**: Never stops execution, always passes through

---

## 🎨 RECOMMENDED DESIGN PATTERN

### Pattern: Event-Driven Tracing with Ring Buffer

**Why This Pattern**:
- ✅ Non-blocking (async event emission)
- ✅ Subscribable (EventEmitter pattern)
- ✅ Ring buffer prevents memory overflow
- ✅ Channel-based (separate emitters per channel)
- ✅ Zero overhead when disabled (early return)

### Architecture Overview

```typescript
┌─────────────────────────────────────────────────┐
│          TracerManager (Singleton)              │
│  - enabled: boolean                             │
│  - channels: Map<string, ChannelTracer>         │
│  - subscribe(channel, handler)                  │
│  - unsubscribe(channel, handler)                │
└─────────────────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
┌───────▼──────────┐      ┌────────▼─────────┐
│ ChannelTracer    │      │ ChannelTracer    │
│  channel: lexer  │      │  channel: parser │
│  buffer: Ring    │      │  buffer: Ring     │
│  emit(event)     │      │  emit(event)      │
└──────────────────┘      └───────────────────┘

Each ChannelTracer emits events:
- function.start   { name, args, timestamp, callId }
- function.end     { name, result, duration, callId }
- loop.start       { name, collection, length }
- loop.iteration   { index, value, pertinent }
- loop.end         { name, totalIterations }
- error            { phase, message, stack }
```

### Key Components

#### 1. TraceEvent Types
```typescript
type TraceEventType = 
  | 'function.start'
  | 'function.end'
  | 'loop.start'
  | 'loop.iteration'
  | 'loop.end'
  | 'error';

interface ITraceEvent {
  type: TraceEventType;
  channel: string;
  timestamp: number;
  callId: string;  // UUID for correlating start/end
  data: unknown;
}
```

#### 2. Ring Buffer (Prevent Memory Overflow)
```typescript
class RingBuffer<T> {
  private buffer: T[];
  private size: number;
  private writeIndex: number;
  
  // Circular buffer - overwrites oldest when full
  push(item: T): void;
  getRecent(count: number): T[];
}
```

#### 3. Function Decorator Pattern
```typescript
function traced(channel: string) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value;
    
    descriptor.value = function(...args: any[]) {
      if (!TracerManager.enabled) return original.apply(this, args);
      
      const callId = generateCallId();
      const tracer = TracerManager.getChannel(channel);
      
      tracer.emit('function.start', { name: propertyKey, args, callId });
      
      try {
        const result = original.apply(this, args);
        tracer.emit('function.end', { name: propertyKey, result, callId });
        return result;
      } catch (error) {
        tracer.emit('error', { name: propertyKey, error, callId });
        throw error;
      }
    };
  };
}
```

#### 4. Loop Tracking Helper
```typescript
function tracedLoop<T>(
  channel: string,
  name: string,
  collection: T[],
  callback: (item: T, index: number) => void
): void {
  if (!TracerManager.enabled) {
    collection.forEach(callback);
    return;
  }
  
  const tracer = TracerManager.getChannel(channel);
  tracer.emit('loop.start', { name, length: collection.length });
  
  collection.forEach((item, index) => {
    tracer.emit('loop.iteration', { 
      name, 
      index, 
      value: item,
      pertinent: extractPertinent(item)  // Extract key properties
    });
    callback(item, index);
  });
  
  tracer.emit('loop.end', { name, totalIterations: collection.length });
}
```

---

## 📁 FILE STRUCTURE

```
packages/pulsar-transformer/src/
  debug/
    tracer/
      tracer-manager.ts           # Singleton manager
      tracer-manager.types.ts     # Interfaces
      channel-tracer.ts           # Per-channel tracer
      channel-tracer.types.ts     # Channel types
      ring-buffer.ts              # Circular buffer
      ring-buffer.types.ts        # Buffer types
      prototypes/
        subscribe.ts              # Subscribe to channel
        unsubscribe.ts            # Unsubscribe from channel
        get-channel.ts            # Get/create channel
        enable.ts                 # Enable tracing
        disable.ts                # Disable tracing
    decorators/
      traced.ts                   # Function decorator
      traced-loop.ts              # Loop helper
    utils/
      generate-call-id.ts         # UUID generation
      extract-pertinent.ts        # Extract key properties
      format-trace-event.ts       # Format for display
```

---

## 🔨 IMPLEMENTATION STEPS

### Step 1: Core Tracer Infrastructure (2 hours)
- [ ] Create TracerManager singleton with prototype pattern
- [ ] Implement ChannelTracer with EventEmitter
- [ ] Implement RingBuffer with overwrite logic
- [ ] Define all trace event types
- [ ] Add enable/disable toggle
- [ ] **TEST**: Enable/disable overhead measurement

### Step 2: Function Tracing (1 hour)
- [ ] Create @traced decorator
- [ ] Add callId generation (UUID v4)
- [ ] Implement start/end/error emission
- [ ] Handle sync and async functions
- [ ] **TEST**: Decorate sample function, verify events

### Step 3: Loop Tracing (1 hour)
- [ ] Create tracedLoop() helper
- [ ] Implement iteration tracking
- [ ] Add pertinent value extraction
- [ ] Handle arrays, Maps, Sets
- [ ] **TEST**: Track loop with 100 items, verify

### Step 4: Integration with Lexer (2 hours)
- [ ] Add @traced to all scan-* functions
- [ ] Add tracedLoop to token iteration
- [ ] Track pertinent: token type, value (truncated), position
- [ ] **TEST**: Transform simple.psr, verify lexer events

### Step 5: Integration with Parser (2 hours)
- [ ] Add @traced to all parse-* functions
- [ ] Add tracedLoop to statement/expression loops
- [ ] Track pertinent: node type, line/col
- [ ] **TEST**: Transform simple.psr, verify parser events

### Step 6: Integration with Transformer (2 hours)
- [ ] Add @traced to all transform-* functions
- [ ] Add tracedLoop to AST traversal
- [ ] Track pertinent: node type before/after
- [ ] **TEST**: Transform simple.psr, verify transformer events

### Step 7: Integration with Code Generator (1 hour)
- [ ] Add @traced to all generate-* functions
- [ ] Track pertinent: generated code snippets
- [ ] **TEST**: Transform simple.psr, verify codegen events

### Step 8: Real-Time Monitoring (2 hours)
- [ ] Create CLI monitor tool
- [ ] Implement channel filtering
- [ ] Add collapsible callstack view
- [ ] Add color coding by event type
- [ ] **TEST**: Run monitor, transform file, see live output

### Step 9: Production Safety (1 hour)
- [ ] Add environment variable check (PULSAR_TRACE=1)
- [ ] Ensure zero overhead when disabled
- [ ] Benchmark: disabled vs enabled performance
- [ ] **TEST**: Measure overhead < 5% when enabled

---

## 🎯 SUCCESS CRITERIA

1. ✅ Enable tracing via `PULSAR_TRACE=1`
2. ✅ Subscribe to specific channels: `lexer`, `parser`, `transformer`, `codegen`
3. ✅ See function start/end with duration
4. ✅ See loop iterations with index + pertinent values
5. ✅ Full callstack reconstructable from events
6. ✅ Real-time console monitor displays events as they happen
7. ✅ Zero performance impact when disabled
8. ✅ Ring buffer prevents memory overflow (max 10k events)

---

## 📊 EXAMPLE OUTPUT (Goal)

```bash
$ PULSAR_TRACE=1 pnpm run build

[LEXER] function.start scanToken (callId: abc123) +0ms
[LEXER]   loop.start tokenization length:312
[LEXER]     loop.iteration index:0 char:'e' type:IDENTIFIER
[LEXER]     loop.iteration index:1 char:'x' type:IDENTIFIER
[LEXER]   loop.end tokenization iterations:312
[LEXER] function.end scanToken duration:2.3ms

[PARSER] function.start parseComponentDeclaration (callId: def456) +2.3ms
[PARSER]   function.start parseJSXElement (callId: ghi789) +2.5ms
[PARSER]     loop.start attributes length:1
[PARSER]       loop.iteration index:0 name:'style' value:'padding: 20px...'
[PARSER]     loop.end attributes iterations:1
[PARSER]   function.end parseJSXElement duration:1.2ms
[PARSER] function.end parseComponentDeclaration duration:3.5ms
```

---

## ⚠️ CRITICAL CONSTRAINTS

### DO NOT:
1. Use console.log directly - all output via tracer
2. Create blocking operations - tracing must not slow execution
3. Store unbounded data - ring buffer REQUIRED
4. Modify function signatures - decorator pattern only
5. Add production overhead - disabled check must be first line

### MUST:
1. Handle circular references in data
2. Truncate large objects (max 200 chars)
3. Use prototype-based classes (NO ES6 classes)
4. One function per file
5. Full TypeScript types (NO any)

---

## 🧪 TEST FILES TO USE

1. `test-simple.psr` - Basic test (already works)
2. `counter.psr` - Has expressions (will expose bugs)
3. `main.psr` - Has keyword attributes (test fix)

**Test Each File With**:
```bash
PULSAR_TRACE=1 PULSAR_TRACE_CHANNELS=lexer,parser node transform.js test-simple.psr
```

---

## 📚 RESEARCH RESOURCES

### Similar Systems to Study:
1. **Babel Plugin Debug**: `@babel/helper-plugin-utils` - function tracing
2. **SWC Trace**: `swc_common::HANDLER` - diagnostic system
3. **TypeScript Trace**: `ts.trace()` - compiler tracing
4. **Chrome DevTools Protocol**: Event streaming architecture

### Design Patterns:
1. **Observer Pattern**: Event subscription
2. **Decorator Pattern**: Function wrapping
3. **Chain of Responsibility**: Event propagation
4. **Ring Buffer**: Memory-bounded logging

---

## 🚨 FAILURE POINTS TO WATCH

1. **Performance**: Tracing overhead > 10% unacceptable
2. **Memory**: Ring buffer must enforce max size
3. **Callstack**: Recursive functions must handle depth
4. **Async**: Promise chains need correlation IDs
5. **Errors**: Tracer failures must not crash transformer

---

## 📝 DELIVERABLES

1. Tracer system implemented (all steps complete)
2. All transformer functions decorated with @traced
3. All loops wrapped with tracedLoop()
4. CLI monitor tool working
5. Documentation: Usage guide
6. Tests: Overhead benchmarks
7. Example: Annotated trace output for test-simple.psr

---

## 🎯 NEXT AGENT START HERE

1. Read this file completely
2. Verify current state (run tests)
3. Get user approval: "Fix breaking changes first OR implement tracer?"
4. If approved for tracer: Start Step 1
5. DO NOT assume anything works
6. TEST after each step
7. Report BINARY results (works/doesn't work)

---

**Time Estimate**: 15-20 hours for full implementation + testing
**Priority**: HIGH - critical for debugging future transformer issues
**Risk**: MEDIUM - non-intrusive design minimizes breakage risk
