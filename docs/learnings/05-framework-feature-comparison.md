# Framework Feature Comparison - For PSR Transformer

**Research Date:** 2026-02-11  
**Frameworks Analyzed:** React, Solid.js, Vue 3, Svelte, Angular  
**Purpose:** Understand how major frameworks solve each PSR transformation feature

---

## 1. Template Literals & String Interpolation

### React (JSX)
```jsx
<div>Hello {name}! You have {count} messages</div>
```
- Direct JavaScript expression insertion with `{}`
- Evaluated at render time
- No special string interpolation syntax

### Solid.js
```jsx
<div>Hello {name()}! You have {count()} messages</div>
```
- Signal calls within JSX: `{signal()}`
- Fine-grained updates - only the text node updates
- Compiled to efficient DOM updates

### Vue 3
```vue
<div>Hello {{ name }}! You have {{ count }} messages</div>
```
- Mustache syntax `{{ }}`
- Compiled to `_toDisplayString()` calls
- Reactive tracking via Proxy

### Svelte
```svelte
<div>Hello {name}! You have {count} messages</div>
```
- Similar to JSX `{}`
- Compiler tracks dependencies and generates targeted updates
- `$$invalidate()` calls for reactive updates

**Key Insight:** All frameworks support inline expressions. Solid and Svelte do compile-time analysis for optimal updates.

---

## 2. Conditional Rendering

### React
```jsx
{condition && <Component />}
{condition ? <A /> : <B />}
```
- Ternary operators and logical AND
- Re-renders entire tree on state change
- No special component wrapper

### Solid.js
```jsx
<Show when={condition()} fallback={<Loading />}>
  <Content />
</ Show>
```
- `<Show>` component for conditional rendering
- Prevents unnecessary re-evaluation
- `fallback` prop for else case
- Only creates/destroys DOM when condition changes

### Vue 3
```vue
<div v-if="condition">Content</div>
<div v-else-if="other">Other</div>
<div v-else>Fallback</div>
```
- `v-if` / `v-else-if` / `v-else` directives
- Conditional compilation - elements not in DOM when false
- `v-show` for CSS display toggle (lighter)

### Svelte
```svelte
{#if condition}
  <Content />
{:else if other}
  <Other />
{:else}
  <Fallback />
{/if}
```
- Template syntax with `{#if}`
- Compiler generates efficient DOM manipulation
- Transitions can be added easily

**Key Insight:** Solid's `<Show>` component is closest to PSR's approach. Vue/Svelte use custom syntax.

---

## 3. List Rendering / Iteration

### React
```jsx
{items.map(item => <Item key={item.id} {...item} />)}
```
- Array `.map()` method
- `key` prop required for reconciliation
- Virtual DOM diffing determines what changes

### Solid.js
```jsx
<For each={items()}>
  {(item, index) => <Item {...item} />}
</For>
```
- `<For>` component with render prop
- Referential equality by default (keyed by reference)
- `<Index>` for keying by index
- Minimal DOM updates - only changed items re-render

### Vue 3
```vue
<div v-for="(item, index) in items" :key="item.id">
  {{ item.name }}
</div>
```
- `v-for` directive
- `:key` binding required
- Tracks items and efficiently updates DOM

### Svelte
```svelte
{#each items as item, index (item.id)}
  <Item {...item} />
{/each}
```
- `{#each}` template syntax
- Key expression in parentheses `(item.id)`
- Compiler generates efficient update code

**Key Insight:** Solid's `<For>` avoids re-rendering items that haven't changed. PSR should follow this pattern.

---

## 4. Dynamic Components

### React
```jsx
const Component = condition ? ComponentA : ComponentB;
return <Component />;
```
- Direct variable assignment
- Component is just a function
- Virtual DOM handles switching

### Solid.js
```jsx
<Dynamic component={currentComponent()} {...props} />
```
- `<Dynamic>` component for runtime switching
- Props forwarded via spread
- Caches component instances when possible

### Vue 3
```vue
<component :is="currentComponent" v-bind="props" />
```
- Built-in `<component>` with `:is` prop
- Dynamic component resolution
- Props forwarded with `v-bind`

### Svelte
```svelte
<svelte:component this={currentComponent} {...props} />
```
- Special `<svelte:component>` element
- `this` prop specifies component
- Props spread with `{...props}`

**Key Insight:** All frameworks have special syntax for dynamic components. Solid's `<Dynamic>` is closest match.

---

## 5. Async Data / Resources

### React
```jsx
// Modern React with Suspense
const resource = use(fetchUser(id));

// Or with libraries (React Query, SWR)
const { data, error, isLoading } = useQuery('user', fetchUser);
```
- `use()` hook for promises (React 19+)
- Suspense boundaries for loading states
- Libraries like React Query for full features
- `Suspense` + `ErrorBoundary` for states

### Solid.js
```jsx
const [user] = createResource(userId, fetchUser);

return (
  <Show when={!user.loading} fallback={<Loading />}>
    <Show when={!user.error} fallback={<Error />}>
      <User data={user()} />
    </Show>
  </Show>
);
```
- `createResource()` primitive
- Returns `[resource, { mutate, refetch }]`
- `resource.loading`, `resource.error`, `resource.state`
- Integrates with `<Suspense>` boundaries
- `refetch()` for manual re-fetching

### Vue 3
```vue
<script setup>
const { data, error, isLoading } = useAsyncData('user', fetchUser);
</script>
```
- Composables like `useAsyncData` (Nuxt)
- Built-in `<Suspense>` component
- `onServerPrefetch` for SSR

### Svelte (SvelteKit)
```svelte
<script>
  export async function load({ fetch, params }) {
    const res = await fetch(`/api/user/${params.id}`);
    return { user: await res.json() };
  }
</script>
```
- Page-level `load` functions
- `$app/stores` for loading states
- Streaming SSR support

**Key Insight:** Solid's `createResource` is the gold standard. PSR should model after this closely.

---

## 6. Error Boundaries

### React
```jsx
class ErrorBoundary extends React.Component {
  componentDidCatch(error, info) {
    this.setState({ hasError: true });
  }
  render() {
    if (this.state.hasError) return <Fallback />;
    return this.props.children;
  }
}
```
- Class component with `componentDidCatch`
- No function component support yet
- Catches errors in render, not in events

### Solid.js
```jsx
<ErrorBoundary fallback={(err, reset) => <Error error={err} reset={reset} />}>
  <Component />
</ErrorBoundary>
```
- `<ErrorBoundary>` component
- `fallback` receives `(error, reset)` function
- `reset()` to retry
- Works with Suspense

### Vue 3
```vue
<script>
export default {
  errorCaptured(err, instance, info) {
    // Handle error
    return false; // Prevent propagation
  }
}
</script>
```
- `errorCaptured` lifecycle hook
- Can stop error propagation
- Works with async components

### Svelte
```svelte
{#await promise}
  <Loading />
{:then value}
  <Content {value} />
{:catch error}
  <Error {error} />
{/await}
```
- No formal error boundary component
- `{:catch}` blocks for promises
- Custom error handling patterns

**Key Insight:** Solid's `<ErrorBoundary>` with reset function is most elegant. PSR's `<Tryer>` + `<Catcher>` can provide similar functionality.

---

## 7. Lazy Loading & Code Splitting

### React
```jsx
const Component = React.lazy(() => import('./Component'));

<Suspense fallback={<Loading />}>
  <Component />
</Suspense>
```
- `React.lazy()` for dynamic imports
- Must be wrapped in `<Suspense>`
- Automatic code splitting via bundler

### Solid.js
```jsx
const Component = lazy(() => import('./Component'));

<Suspense fallback={<Loading />}>
  <Component />
</Suspense>
```
- `lazy()` function similar to React
- Returns component that suspends
- Works with `<Suspense>`

### Vue 3
```vue
<script>
const Component = defineAsyncComponent(() => import('./Component.vue'));
</script>
```
- `defineAsyncComponent()` for lazy loading
- Built-in loading/error states
- Works with `<Suspense>`

### Svelte (SvelteKit)
```svelte
<script>
  import { browser } from '$app/environment';
  
  let Component;
  if (browser) {
    Component = (await import('./Component.svelte')).default;
  }
</script>

{#if Component}
  <svelte:component this={Component} />
{/if}
```
- Manual dynamic imports
- No built-in lazy wrapper
- Route-based code splitting in SvelteKit

**Key Insight:** React/Solid pattern is standard. PSR should follow `lazy(() => import())` pattern.

---

## 8. Portals / Teleport

### React
```jsx
ReactDOM.createPortal(children, domNode)
```
- Imperative API via `ReactDOM`
- Manual DOM node selection
- Context preserved across portal

### Solid.js
```jsx
<Portal mount={document.getElementById('modal')}>
  <Modal />
</Portal>
```
- `<Portal>` component
- `mount` prop for target
- Can use selector or DOM node
- Context preserved

### Vue 3
```vue
<Teleport to="#modal">
  <Modal />
</Teleport>
```
- `<Teleport>` built-in component
- `to` prop with CSS selector
- Multiple teleports to same target
- Disabled prop for conditional teleporting

### Svelte
```svelte
<div use:portal={'#modal'}>
  <Modal />
</div>
```
- Custom action or library (not built-in)
- Community packages like `svelte-portal`

**Key Insight:** Vue's `<Teleport>` with selector is most convenient. Solid's `<Portal>` is similar. PSR should support both.

---

## 9. Context / Dependency Injection

### React
```jsx
const Context = createContext(defaultValue);
<Context.Provider value={value}>
  {children}
</Context.Provider>

const value = useContext(Context);
```
- `createContext()` + `Provider` component
- `useContext()` hook to consume
- Re-renders consumers on value change
- Context selectors not built-in

### Solid.js
```jsx
const Context = createContext(defaultValue);
<Context.Provider value={value}>
  {children}
</Context.Provider>

const value = useContext(Context);
```
- Nearly identical API to React
- Fine-grained reactivity - only tracked values cause updates
- No unnecessary re-renders

### Vue 3
```vue
// Provider
provide('key', value);

// Consumer
const value = inject('key', defaultValue);
```
- `provide()` / `inject()` composition API
- String keys instead of context objects
- Reactive values automatically tracked

### Svelte
```svelte
// Parent
<script context="module">
  export const key = {};
</script>
<script>
  import { setContext } from 'svelte';
  setContext(key, value);
</script>

// Child
<script>
  import { getContext } from 'svelte';
  const value = getContext(key);
</script>
```
- `setContext()` / `getContext()` API
- Requires unique key (usually Symbol)
- Not reactive by default (use stores for reactivity)

**Key Insight:** React/Solid pattern is most common. Vue's string keys are simpler but less type-safe.

---

## 10. Performance Primitives

### batch() - Batching Updates

**React:** Automatic batching in React 18+ (even in async)
**Solid.js:** `batch(() => { ... })` for manual batching  
**Vue:** Automatic via nextTick queue  
**Svelte:** Automatic batching

### untrack() - Breaking Reactivity

**React:** N/A (no fine-grained tracking)
**Solid.js:** `untrack(() => signal())` prevents dependency tracking  
**Vue:** N/A (can access .value without tracking in some scopes)  
**Svelte:** N/A (compiler determines dependencies)

### defer() / startTransition() - Deferring Updates

**React:** `startTransition(() => { ... })` or `useDeferredValue()`
**Solid.js:** `startTransition(() => { ... })`  
**Vue:** No built-in primitive (use computed with debounce)  
**Svelte:** No built-in primitive

**Key Insight:** Solid has the most comprehensive primitive set. React focuses on transitions only.

---

## 11. Server-Side Rendering (SSR)

### React
- `renderToString()` / `renderToPipeableStream()`
- Selective Hydration with `<Suspense>`
- Server Components (RSC) for zero-JS components
- Streaming SSR with Progressive Enhancement

### Solid.js
- `renderToString()` / `renderToStream()`
- Async SSR with resource resolution
- Hydration with `hydrateRoot()`
- Context preserved during SSR

### Vue 3
- `renderToString()` in `@vue/server-renderer`
- Async components resolved server-side
- Hydration mismatch warnings
- `<Suspense>` support on server

### Svelte / SvelteKit
- `render()` for SSR in component
- SvelteKit handles routing + SSR
- Partial hydration patterns
- Form actions for progressive enhancement

**Key Insight:** All frameworks support SSR. React's Selective Hydration is most advanced. Solid's async resource resolution is cleanest.

---

## Summary: Best Practices for PSR

1. **Conditional Rendering:** Follow Solid's `<Show>` pattern with `when` + `fallback`
2. **List Rendering:** Follow Solid's `<For>` with referential keying
3. **Async Data:** Model after Solid's `createResource()` with `.loading`, `.error`, `.state`
4. **Error Handling:** Provide both boundary component + reset function like Solid
5. **Lazy Loading:** Use `lazy(() => import())` pattern matching React/Solid
6. **Portals:** Support Vue's selector syntax + Solid's mount prop
7. **Context:** Follow React/Solid API (most familiar to developers)
8. **Performance:** Provide `batch()`, `untrack()`, `defer()` primitives like Solid
9. **SSR:** Support streaming, async resolution, and hydration markers

**Golden Standard:** Solid.js has the most elegant and complete reactive primitives. PSR should align closely with Solid's APIs while maintaining TypeScript-first approach.

---

**References:**
- React: https://react.dev
- Solid.js: https://www.solidjs.com
- Vue 3: https://vuejs.org
- Svelte: https://svelte.dev
- Angular Signals: https://angular.io/guide/signals
