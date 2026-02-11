# Framework Analysis - Quick Reference for Implementation Plans

**For use in bulk updates - Copy relevant section into each plan**

---

## CONDITIONAL RENDERING (Show, Dynamic)

**React:** Ternary operators and logical AND. Re-renders entire tree.  
**Solid.js:** `<Show when={condition()} fallback={<Loading />}>` component prevents unnecessary re-evaluation.  
**Vue:** `v-if`/`v-else` directives, elements not in DOM when false. `v-show` for CSS display toggle.  
**Svelte:** `{#if}` template syntax, compiler generates efficient DOM manipulation.  
**Insight:** Solid's `<Show>` component approach is optimal for PSR.

---

## LIST RENDERING (For)

**React:** `.map()` with `key` prop, Virtual DOM diffing.  
**Solid.js:** `<For each={items()}>{(item) => <Item />}</For>` with referential keying. Only changed items re-render.  
**Vue:** `v-for` directive with `:key` binding.  
**Svelte:** `{#each items as item (item.id)}` with key expression.  
**Insight:** Solid's `<For>` avoids re-rendering unchanged items. PSR should follow this pattern.

---

## ASYNC DATA / RESOURCES (All resource features)

**React:** `use()` hook + Suspense, or libraries like React Query/SWR.  
**Solid.js:** `createResource(source, fetcher)` returns `[resource, { mutate, refetch }]` with `.loading`, `.error`, `.state` properties.  
**Vue:** Composables like `useAsyncData` (Nuxt), built-in `<Suspense>`.  
**Svelte:** Page-level `load()` functions in SvelteKit.  
**Insight:** Solid's `createResource()` is the gold standard for PSR to model.

---

## ERROR BOUNDARIES (Tryer, Catcher, Propagation)

**React:** Class component with `componentDidCatch`, no function support yet.  
**Solid.js:** `<ErrorBoundary fallback={(err, reset) => ...}>` with reset function.  
**Vue:** `errorCaptured` lifecycle hook, can stop propagation.  
**Svelte:** No formal boundary, `{:catch}` blocks for promises.  
**Insight:** Solid's `<ErrorBoundary>` with reset is most elegant for PSR.

---

## LAZY LOADING / CODE SPLITTING

**React:** `React.lazy(() => import())` + `<Suspense>`  
**Solid.js:** `lazy(() => import())` + `<Suspense>` (nearly identical to React)  
**Vue:** `defineAsyncComponent(() => import())`  
**Svelte:** Manual dynamic imports, route-based splitting in SvelteKit  
**Insight:** React/Solid pattern is standard. PSR should follow `lazy(() => import())`.

---

## PORTALS / TELEPORT

**React:** `ReactDOM.createPortal(children, domNode)` imperative API  
**Solid.js:** `<Portal mount={element}>` component  
**Vue:** `<Teleport to="#selector">` with CSS selector  
**Svelte:** Custom action or library, not built-in  
**Insight:** Vue's selector + Solid's mount prop both useful for PSR.

---

## CONTEXT / DEPENDENCY INJECTION

**React:** `createContext()` + `Provider` + `useContext()`  
**Solid.js:** Nearly identical API, but with fine-grained reactivity  
**Vue:** `provide(key, value)` + `inject(key)` with string keys  
**Svelte:** `setContext(key)` + `getContext(key)` with Symbol keys  
**Insight:** React/Solid pattern is most familiar. Follow this for PSR.

---

## PERFORMANCE PRIMITIVES (batch, untrack, defer)

**React:** Automatic batching, `startTransition()`, `useDeferredValue()`  
**Solid.js:** `batch()`, `untrack()`, `startTransition()` - most comprehensive  
**Vue:** Automatic batching via nextTick queue  
**Svelte:** Automatic batching by compiler  
**Insight:** Solid has most complete primitive set. Provide all three for PSR.

---

## SSR / HYDRATION

**React:** Streaming SSR, Selective Hydration with Suspense, Server Components  
**Solid.js:** `renderToString()`/`renderToStream()`, async resource resolution  
**Vue:** `renderToString()` in `@vue/server-renderer`, async component support  
**Svelte:** SvelteKit handles SSR + routing, partial hydration patterns  
**Insight:** React's Selective Hydration most advanced, Solid's async resolution cleanest.

---

## TYPES / GENERICS

**TypeScript:** Full generic support with constraints, inference, conditional types  
**Flow:** Similar to TS but less adoption  
**Insight:** Follow TypeScript's model exactly. PSR must support full generic syntax.

---
