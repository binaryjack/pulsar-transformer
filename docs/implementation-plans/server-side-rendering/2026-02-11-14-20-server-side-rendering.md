# Server Side Rendering Implementation Plan

## Short Description

Implement transformation support for server-side rendering (SSR) including server/client code generation and hydration preparation.

## Mandatory AI Task Before Start

- Read carefully and respect the following rules
- Link to ai-collaboration-rules: `C:\Users\Piana Tadeo\source\repos\visual-schema-builder\packages\pulsar-transformer\docs\ai-collaboration-rules.json`

## What to Do

1. Parse SSR-specific patterns and directives
2. Transform to SSR-compatible code
3. Handle server/client code splitting
4. Implement hydration preparation
5. Support SSR optimization strategies
6. Generate server rendering pipeline

## Framework Analysis

**How Major Frameworks Handle Server-Side Rendering:**

**React:**
- `renderToString(element)` - synchronous, waits for all data
- `renderToStreamableContent()` - streaming, sends HTML as ready
- Selective Hydration - hydrates interactive parts first
- Server Components - components that never ship to client

**Solid.js:**
- `renderToString(() => <App />)` - async, waits for resources
- `renderToStream(() => <App />)` - streaming SSR
- Serializes resource data to client for hydration
- Clean separation: server renders, client hydrates from data

**Vue:**
- `renderToString(app)` from `@vue/server-renderer`
- Streaming support with `renderToNodeStream()`
- Async component resolution during SSR
- Context preservation across SSR boundary

**Svelte/SvelteKit:**
- `render(Component)` returns HTML + CSS + head
- Built into SvelteKit routing
- Load functions pre-fetch data before render
- Hydration automatic with minimal JS

**Key Insights for PSR Implementation:**
1. **Async Resource Resolution:** Wait for `createResource()` to resolve before rendering
2. **Streaming Preferred:** Send HTML progressively, not all at once
3. **Data Serialization:** Pass resource data to client in `<script>` tag
4. **Isomorphic Code:** Same components work on server and client
5. **Solid's Model Gold Standard:** Async renderToString, clean data serialization

**Implementation Strategy:**
- Implement `renderToString()` that awaits resources
- Serialize resource data to `__PSR_DATA__` global
- Support streaming with `renderToStream()`
- Handle server-only code removal for client bundle
- Preserve context/providers during SSR

## Debug Tracking Requirements

**CRITICAL:** While implementing this feature, ensure the debug tracker system has comprehensive tracing:

### 1-4. Debug Integration (Standard Pattern)

See DEBUG-TRACKING-TEMPLATE.md for full implementation. Key points:
- Wrap SSR transformation with `@traced`
- Log server vs client code split decisions
- Track hydration preparation steps
- Collect diagnostics for SSR compatibility issues

## Test Requirements

Ask the agent to create test files:

- Integration tests for SSR transformations
- Unit tests for server/client separation
- E2E tests for hydration scenarios

## Final Step

Invoke supervisor for review of implementation completion.
