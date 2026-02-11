# Use Context Consumption Implementation Plan

## Short Description

Implement transformation support for `useContext()` consumption patterns for accessing context values in components.

## Mandatory AI Task Before Start

- Read carefully and respect the following rules
- Link to ai-collaboration-rules: `C:\Users\Piana Tadeo\source\repos\visual-schema-builder\packages\pulsar-transformer\docs\ai-collaboration-rules.json`

## What to Do

1. Parse `useContext()` function calls
2. Transform to reactive context consumption
3. Handle context value subscriptions
4. Implement context dependency tracking
5. Support context value caching
6. Optimize re-render minimization

## Framework Analysis

**How Major Frameworks Consume Context:**

**React:**
- `const value = useContext(MyContext)`
- Hook-based API
- Returns current context value from nearest Provider
- Component re-renders when context value changes (entire value, not granular)

**Solid.js:**
- `const value = useContext(MyContext)`
- Same API as React
- Fine-grained reactivity - only re-runs when accessed properties change
- Can return signals: `const [count, setCount] = useContext(CountContext)`

**Vue:**
- `const value = inject(key, defaultValue)`
- Key-based (string/Symbol) instead of context object
- Can inject refs - automatically reactive
- Optional default value if no provider found

**Svelte:**
- `const value = getContext(key)`
- Must be called during component initialization
- Value is static (not reactive) unless it's a store

**Key Insights for PSR Implementation:**
1. **Hook API:** `useContext(Context)` is standard (React/Solid)
2. **Fine-Grained Best:** Track which properties accessed, only re-run when those change
3. **Provider Lookup:** Walk component tree to find nearest Provider
4. **Default Value:** Use context's default if no Provider found
5. **Type Safety:** Return type matches Provider value type

**Implementation Strategy:**
- Transform `useContext(Ctx)` to context lookup function
- Walk owner tree to find nearest `Ctx.Provider`
- Return Provider's value signal
- Track property access for fine-grained updates
- Throw helpful error if context not provided and no default

## Debug Tracking Requirements

**CRITICAL:** While implementing this feature, ensure the debug tracker system has comprehensive tracing:

### 1-4. Debug Integration (Standard Pattern)

See DEBUG-TRACKING-TEMPLATE.md for full implementation. Key points:
- Wrap useContext transformation with `@traced`
- Log context subscription creation
- Track dependency tracking for re-renders
- Collect diagnostics for missing context

## Test Requirements

Ask the agent to create test files:

- Integration tests for context consumption transformations
- Unit tests for subscription logic
- E2E tests for performance optimization scenarios

## Final Step

Invoke supervisor for review of implementation completion.
