# Hydration Markers Implementation Plan

## Short Description

Implement transformation support for hydration markers to enable proper client-side hydration of server-rendered content.

## Mandatory AI Task Before Start

- Read carefully and respect the following rules
- Link to ai-collaboration-rules: `C:\Users\Piana Tadeo\source\repos\visual-schema-builder\packages\pulsar-transformer\docs\ai-collaboration-rules.json`

## What to Do

1. Parse hydration marker requirements
2. Transform to marker injection system
3. Handle marker generation and placement
4. Implement hydration boundary detection
5. Support selective hydration strategies
6. Optimize marker performance and size

## Framework Analysis

**How Major Frameworks Handle Hydration Markers:**

**React:**
- Comment nodes as markers: `<!-- -->` boundaries
- Data attributes: `data-reactroot`, `data-reactid`
- Selective Hydration (React 18): `<Suspense>` boundaries allow progressive hydration
- Matches server HTML to client component tree

**Solid.js:**
- Minimal markers: comment nodes for dynamic boundaries
- Hydration keys: `data-hk` attributes for identification
- Serialized data in script tag, not inline
- Clean HTML - markers removed after hydration

**Vue:**
- Comment markers: `<!--[-->` and `<!--]-->` for fragments
- `v-if` boundaries marked for hydration
- SSR-specific attributes: `data-v-ssr`
- Hydration mismatches logged as warnings

**Svelte:**
- Minimal hydration markers
- SvelteKit adds data attributes for hydration
- Anchor comments for dynamic content

**Key Insights for PSR Implementation:**
1. **Comment Nodes:** Standard approach across frameworks
2. **Minimal Markers:** Only add what's necessary for hydration
3. **Boundaries:** Mark dynamic content, Suspense boundaries, lists
4. **Cleanup:** Remove markers after successful hydration
5. **Mismatch Detection:** Warn on server/client HTML differences

**Implementation Strategy:**
- Insert comment markers around dynamic content
- Add `data-hk` attributes for component identification
- Mark Suspense and ErrorBoundary boundaries
- Serialize data separately, not inline in HTML
- Validate server/client match during hydration
- Remove markers after hydration complete

## Debug Tracking Requirements

**CRITICAL:** While implementing this feature, ensure the debug tracker system has comprehensive tracing:

### 1-4. Debug Integration (Standard Pattern)

See DEBUG-TRACKING-TEMPLATE.md for full implementation. Key points:
- Wrap marker generation with `@traced`
- Log marker placement decisions
- Track hydration boundary detection
- Collect diagnostics for selective hydration

## Test Requirements

Ask the agent to create test files:

- Integration tests for marker transformations
- Unit tests for marker generation logic
- E2E tests for hydration performance

## Final Step

Invoke supervisor for review of implementation completion.
