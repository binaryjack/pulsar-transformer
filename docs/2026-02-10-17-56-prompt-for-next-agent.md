# PROMPT FOR NEXT AI AGENT - 2026-02-10-17-56

Copy this entire prompt to the next AI agent session:

---

## 🎯 YOUR MISSION

Implement a **non-intrusive, channel-based debugger tracking system** for the PSR transformer pipeline.

**Context**: Previous ses
sion fixed basic JSX transformation but left it FRAGILE. Only trivial cases work. You will implement a tracing system to debug future issues visually.

---

## 📋 CRITICAL FIRST STEPS

**BEFORE DOING ANYTHING**:

1. Read these files IN ORDER:
   - `docs/sessions/2026-02-10-17-55-jsx-transformation-fixes-learnings.md` - What got fixed (and broken)
   - `docs/sessions/2026-02-10-17-56-followup-debugger-tracking-system.md` - Your implementation plan
   - `packages/pulsar-transformer/docs/ai-collaboration-rules.json` - Your behavior rules

2. Verify current state:

   ```bash
   cd packages/pulsar.dev
   pnpm test -- t-element.test.ts
   ```

   **Expected**: FAILURES - API signature changed

3. Ask user: "Fix breaking changes first OR proceed with tracer implementation?"
   **DO NOT ASSUME** - get explicit approval

---

## 🎯 REQUIREMENTS

### User Demands (Non-Negotiable):

1. **Non-intrusive**: Zero overhead when disabled
2. **Channel-based**: Subscribe to `lexer`, `parser`, `transformer`, `codegen` separately
3. **Function tracking**: START and END for EVERY function
4. **Loop tracking**: Track EVERY iteration with pertinent values
5. **Callstack tracking**: Full process callstack without stack overflow
6. **Real-time subscribable**: Monitor output as it happens
7. **Production safe**: Must be disable-able (env var check)
8. **Non-blocking**: Never stops execution

### Technical Constraints:

- ❌ NO ES6 classes - prototype-based ONLY
- ❌ NO `any` types - full TypeScript interfaces
- ❌ NO stubs - complete implementation only
- ❌ NO console.log - all output via tracer
- ✅ ONE function per file
- ✅ Ring buffer for memory safety (max 10k events)
- ✅ Decorator pattern for function wrapping

---

## 🏗️ RECOMMENDED ARCHITECTURE

### Pattern: Event-Driven Tracing with Ring Buffer

```typescript
TracerManager (singleton)
  ├─ channels: Map<string, ChannelTracer>
  ├─ enabled: boolean (check env var)
  ├─ subscribe(channel, handler)
  └─ unsubscribe(channel, handler)

ChannelTracer (per channel)
  ├─ buffer: RingBuffer<TraceEvent>
  ├─ emit(eventType, data)
  └─ subscribers: Set<(event) => void>

TraceEvent types:
  - function.start   { name, args, callId, timestamp }
  - function.end     { name, result, duration, callId }
  - loop.start       { name, collection, length }
  - loop.iteration   { index, value, pertinent }
  - loop.end         { name, totalIterations }
  - error            { phase, message, stack }
```

### Usage Example:

```typescript
// Function tracing (decorator)
@traced('lexer')
scanToken() {
  // ... implementation
}

// Loop tracing (helper)
tracedLoop('parser', 'attributes', attributes, (attr, index) => {
  // ... process attribute
});
```

---

## 📁 FILE STRUCTURE TO CREATE

```
packages/pulsar-transformer/src/debug/
  tracer/
    tracer-manager.ts              # Singleton
    tracer-manager.types.ts
    channel-tracer.ts              # Per-channel
    channel-tracer.types.ts
    ring-buffer.ts                 # Circular buffer
    ring-buffer.types.ts
    prototypes/
      subscribe.ts
      unsubscribe.ts
      get-channel.ts
      enable.ts
      disable.ts
  decorators/
    traced.ts                      # @traced decorator
    traced-loop.ts                 # Loop wrapper
  utils/
    generate-call-id.ts            # UUID v4
    extract-pertinent.ts           # Extract key props
    format-trace-event.ts          # Display formatting
```

---

## 🔨 IMPLEMENTATION STEPS

### Phase 1: Core Infrastructure (2-3 hours)

1. Create TracerManager with prototype pattern
2. Create ChannelTracer with EventEmitter
3. Create RingBuffer with overwrite
4. Define all TraceEvent interfaces
5. **TEST**: Enable/disable overhead < 1%

### Phase 2: Decorators (1-2 hours)

6. Implement @traced decorator
7. Implement tracedLoop() helper
8. **TEST**: Sample function with decorator works

### Phase 3: Integration (4-6 hours)

9. Add @traced to all lexer functions
10. Add @traced to all parser functions
11. Add @traced to all transformer functions
12. Add @traced to all codegen functions
13. Wrap all loops with tracedLoop()
14. **TEST**: Transform test-simple.psr, see events

### Phase 4: Monitoring (2-3 hours)

15. Create CLI monitor tool
16. Add channel filtering
17. Add collapsible callstack view
18. **TEST**: Real-time display works

### Phase 5: Production Safety (1 hour)

19. Add PULSAR_TRACE env var check
20. Benchmark: disabled overhead = 0%
21. Benchmark: enabled overhead < 5%

---

## ✅ SUCCESS CRITERIA

You are DONE when:

1. ✅ `PULSAR_TRACE=1` enables tracing
2. ✅ `PULSAR_TRACE_CHANNELS=lexer,parser` filters channels
3. ✅ Every function shows start/end with duration
4. ✅ Every loop shows iterations with values
5. ✅ Real-time monitor displays events as they happen
6. ✅ Disabled mode has ZERO overhead (benchmarked)
7. ✅ Ring buffer prevents memory overflow
8. ✅ Callstack is reconstructable from events

---

## 🎯 EXAMPLE OUTPUT (What User Wants to See)

```bash
$ PULSAR_TRACE=1 PULSAR_TRACE_CHANNELS=lexer,parser pnpm run build

[LEXER] function.start scanToken (callId: abc123) +0ms
[LEXER]   loop.start tokenization length:312
[LEXER]     loop.iteration index:0 char:'e' type:IDENTIFIER
[LEXER]     loop.iteration index:1 char:'x' type:IDENTIFIER
[LEXER]   loop.end tokenization iterations:312
[LEXER] function.end scanToken duration:2.3ms (callId: abc123)

[PARSER] function.start parseComponentDeclaration (callId: def456) +2.3ms
[PARSER]   function.start parseJSXElement (callId: ghi789) +2.5ms
[PARSER]     loop.start attributes length:1
[PARSER]       loop.iteration index:0 name:'style' value:'padding: 20px...'
[PARSER]     loop.end attributes iterations:1
[PARSER]   function.end parseJSXElement duration:1.2ms (callId: ghi789)
[PARSER] function.end parseComponentDeclaration duration:3.5ms (callId: def456)
```

---

## ⚠️ CRITICAL RULES (User is DEMANDING)

### FORBIDDEN BEHAVIORS:

1. ❌ Claiming "works" without testing
2. ❌ Using "should work", "probably", "might"
3. ❌ Creating stubs or TODOs
4. ❌ Using ES6 classes
5. ❌ Using `any` types
6. ❌ Delegating to subagent without context

### REQUIRED BEHAVIORS:

1. ✅ Test after EVERY step
2. ✅ Report BINARY results (works/doesn't work)
3. ✅ Stop and ask if uncertain
4. ✅ One function per file
5. ✅ Prototype-based classes ONLY
6. ✅ Full TypeScript interfaces

### WORKFLOW:

1. Read docs (learnings + followup + rules)
2. Verify current state (run tests)
3. Ask user for approval to proceed
4. Implement ONE step at a time
5. TEST that step
6. Report result HONESTLY
7. Continue to next step

---

## 🚨 KNOWN FRAGILITIES (From Previous Session)

**What's Broken**:

- t_element() API changed - tests will fail
- JSX expressions in text don't work yet
- Component hierarchy (parentId) not tracked
- Conditional rendering not handled
- Array mapping not handled

**What Works**:

- test-simple.psr (basic nested JSX)
- Static text with spaces preserved
- Keyword attributes in JSX

**DO NOT**:

- Assume main.psr works (untested)
- Assume counter.psr works (untested)
- Assume anything beyond test-simple.psr works

---

## 📚 RESEARCH RESOURCES

If stuck, research these:

1. Babel plugin debug system
2. SWC diagnostic system
3. TypeScript compiler tracing
4. Chrome DevTools Protocol event streaming

---

## 🎯 YOUR FIRST ACTIONS

1. Read 3 docs files (learnings, followup, rules)
2. Run `pnpm test -- t-element.test.ts` in pulsar.dev
3. Report what broke
4. Ask user: "Fix t_element tests first OR implement tracer?"
5. Wait for approval
6. Begin implementation ONLY after approval

---

## 📝 EXPECTED DELIVERABLES

1. Tracer system fully implemented
2. All transformer functions decorated
3. All loops wrapped with tracedLoop
4. CLI monitor tool working
5. Benchmark showing < 5% overhead when enabled
6. Benchmark showing 0% overhead when disabled
7. Documentation with usage examples
8. Example trace output from test-simple.psr

---

## ⏱️ TIME ESTIMATE

**Total**: 15-20 hours  
**Priority**: HIGH  
**Risk**: MEDIUM (non-intrusive design)

---

## 🚀 START HERE

User said: "finalize this session, write learnings, write followup, write prompt for next agent"

**Your response should be**:

"I've read:

- 2026-02-10-17-55-jsx-transformation-fixes-learnings.md
- 2026-02-10-17-56-followup-debugger-tracking-system.md
- ai-collaboration-rules.json

Running tests to verify current state...

[Run tests and report results]

Do you want me to:
A) Fix breaking t_element API changes first
B) Implement debugger tracking system (and fix API later)
C) Other approach

Waiting for your decision."

---

**DO NOT PROCEED WITHOUT USER APPROVAL**

**BE HONEST - IF TESTS FAIL, REPORT IT**

**NEVER CLAIM SUCCESS WITHOUT ACTUAL TESTING**
