# TSX Syntax Support

**Topic:** JSX-like Syntax  
**Framework:** Pulsar (Uranium)  
**Date:** January 2026

## Overview

Pulsar supports TSX syntax that compiles to vanilla DOM function calls. This provides React-like syntax while maintaining direct DOM manipulation.

## Basic Transformation

### TSX Input
```tsx
<Button label="Click me" onClick={handleClick} />
```

### JavaScript Output
```typescript
Button({ label: "Click me", onClick: handleClick })
```

## Syntax Rules

### Self-Closing Tags
```tsx
// With props
<Spinner size="large" />

// No props
<Divider />
```

### With Children
```tsx
<Card>
  <CardHeader />
  <CardBody>
    <Content />
  </CardBody>
</Card>
```

**Transforms to:**
```typescript
Card({
  children: [
    CardHeader(),
    CardBody({
      children: [Content()]
    })
  ]
})
```

### Expressions
```tsx
<Button label={isActive ? "Active" : "Inactive"} />

<div>{count > 0 ? <Counter value={count} /> : <Empty />}</div>
```

### Attributes
```tsx
// String
<Button label="Submit" />

// Number
<Input maxLength={100} />

// Boolean
<Checkbox checked={true} />

// Function
<Button onClick={handleClick} />

// Object
<Component config={{ theme: "dark", size: "lg" }} />
```

## Component Types

### Built-in Components

#### Waiting (Suspense)
```tsx
<Waiting default={<Spinner />}>
  <AsyncContent />
</Waiting>
```

#### Tryer (Error Boundary)
```tsx
<Tryer
  onError={(error) => console.error(error)}
  fallback={<ErrorPage />}
  propagate={false}
>
  <Dashboard />
</Tryer>
```

#### Catcher (Error Display)
```tsx
<Catcher showRetry={true} />

<Catcher
  render={(errorInfo) => (
    <div>
      <h3>{errorInfo.error.message}</h3>
      <button onClick={() => errorInfo.retry()}>Retry</button>
    </div>
  )}
/>
```

### Control Flow

#### Show (Conditional)
```tsx
<Show when={isLoggedIn}>
  <UserProfile user={currentUser} />
</Show>
```

#### For (List)
```tsx
<For each={users}>
  {(user, index) => (
    <UserCard user={user} position={index} />
  )}
</For>
```

## Comparison: Vanilla DOM vs TSX

### Example 1: Simple Component
**Vanilla DOM:**
```typescript
const button = Button({
  label: "Submit",
  onClick: handleSubmit
})
```

**TSX:**
```tsx
const button = <Button label="Submit" onClick={handleSubmit} />
```

### Example 2: Nested Structure
**Vanilla DOM:**
```typescript
const app = Tryer({
  children: [
    Waiting({
      default: Spinner(),
      children: [
        Dashboard({
          children: [
            Header({ title: "Dashboard" }),
            Content({ data: userData })
          ]
        })
      ]
    })
  ]
})
```

**TSX:**
```tsx
const app = (
  <Tryer>
    <Waiting default={<Spinner />}>
      <Dashboard>
        <Header title="Dashboard" />
        <Content data={userData} />
      </Dashboard>
    </Waiting>
  </Tryer>
)
```

### Example 3: Conditional Rendering
**Vanilla DOM:**
```typescript
const view = userResource.state === 'success'
  ? UserProfile({ user: userResource.data })
  : userResource.state === 'loading'
    ? Spinner()
    : ErrorMessage({ error: userResource.error })
```

**TSX:**
```tsx
const view = (
  <>
    <Show when={userResource.state === 'success'}>
      <UserProfile user={userResource.data} />
    </Show>
    <Show when={userResource.state === 'loading'}>
      <Spinner />
    </Show>
    <Show when={userResource.state === 'error'}>
      <ErrorMessage error={userResource.error} />
    </Show>
  </>
)
```

### Example 4: List Rendering
**Vanilla DOM:**
```typescript
const list = For({
  each: items,
  children: (item, index) => ListItem({
    item: item,
    index: index,
    onDelete: handleDelete
  })
})
```

**TSX:**
```tsx
const list = (
  <For each={items}>
    {(item, index) => (
      <ListItem item={item} index={index} onDelete={handleDelete} />
    )}
  </For>
)
```

## Advanced Patterns

### Fragments
```tsx
<>
  <Header />
  <Content />
  <Footer />
</>
```

**Transforms to:**
```typescript
Fragment({
  children: [Header(), Content(), Footer()]
})
```

### Spread Attributes
```tsx
const props = { label: "Submit", disabled: false }
<Button {...props} />
```

**Transforms to:**
```typescript
Button({ ...props })
```

### Children as Props
```tsx
<Dialog
  header={<DialogHeader title="Confirm" />}
  footer={<DialogFooter actions={actions} />}
>
  <DialogContent>Are you sure?</DialogContent>
</Dialog>
```

### Render Props
```tsx
<DataLoader
  resource={userResource}
  render={(data) => <UserProfile user={data} />}
  fallback={<Spinner />}
/>
```

## Error Boundary Patterns

### Basic Error Handling
```tsx
<Tryer>
  <AsyncComponent />
  <Catcher showRetry={true} />
</Tryer>
```

### Custom Error UI
```tsx
<Tryer onError={(error) => logger.error(error)}>
  <Dashboard />
  <Catcher
    render={(errorInfo) => (
      <div class="error-container">
        <h2>Oops! Something went wrong</h2>
        <p>{errorInfo.error.message}</p>
        <button onClick={() => errorInfo.retry()}>
          Try Again
        </button>
      </div>
    )}
  />
</Tryer>
```

### Nested Boundaries
```tsx
<Tryer propagate={false}>
  <Header />
  
  <Tryer propagate={false}>
    <Sidebar />
    <Catcher />
  </Tryer>
  
  <main>
    <Tryer propagate={true}>
      <CriticalContent />
      <Catcher showRetry={false} />
    </Tryer>
  </main>
</Tryer>
```

## Resource Loading Patterns

### Basic Loading
```tsx
<Waiting default={<Spinner />}>
  <UserProfile user={userResource.data} />
</Waiting>
```

### Multiple Resources
```tsx
<Waiting default={<LoadingScreen />}>
  <div>
    <UserList users={usersResource.data} />
    <PostList posts={postsResource.data} />
  </div>
</Waiting>
```

### Combined with Error Boundary
```tsx
<Tryer>
  <Waiting default={<Spinner />}>
    <DataView data={resource.data} />
  </Waiting>
  <Catcher showRetry={true} />
</Tryer>
```

## DI Integration

### Service Resolution in Components
```tsx
const Dashboard = () => {
  const api = serviceManager.resolve<IApiService>(SApiService)
  const logger = serviceManager.resolve<ILoggerService>(SLoggerService)
  
  return (
    <Tryer onError={(error) => logger.error(error)}>
      <div>
        <h1>Dashboard</h1>
        <button onClick={async () => {
          const data = await api.fetchData('/api/dashboard')
          console.log(data)
        }}>
          Load Data
        </button>
      </div>
      <Catcher showRetry={true} />
    </Tryer>
  )
}
```

### With Resource System
```tsx
const UserProfile = () => {
  const api = serviceManager.resolve<IApiService>(SApiService)
  const userResource = createResource(() => api.fetchUser())
  
  return (
    <Tryer>
      <Waiting default={<Spinner />}>
        <Show when={userResource.state === 'success'}>
          <Profile user={userResource.data} />
        </Show>
      </Waiting>
      <Catcher />
    </Tryer>
  )
}
```

## TypeScript Configuration

### tsconfig.json
```json
{
  "compilerOptions": {
    "jsx": "react",
    "jsxFactory": "h",
    "jsxFragmentFactory": "Fragment"
  }
}
```

### Custom JSX Factory
```typescript
// jsx-runtime.ts
export function h(
  type: string | Function,
  props: any,
  ...children: any[]
): HTMLElement {
  if (typeof type === 'function') {
    return type({ ...props, children })
  }
  
  const element = document.createElement(type)
  Object.assign(element, props)
  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child))
    } else {
      element.appendChild(child)
    }
  })
  
  return element
}

export function Fragment(props: { children: any[] }): DocumentFragment {
  const fragment = document.createDocumentFragment()
  props.children.forEach(child => fragment.appendChild(child))
  return fragment
}
```

## Build Configuration

### Vite Plugin
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import pulsarPlugin from 'pulsar-vite-plugin'

export default defineConfig({
  plugins: [
    pulsarPlugin({
      jsxFactory: 'h',
      jsxFragment: 'Fragment'
    })
  ]
})
```

### Transformer
```typescript
// Custom transformer
import { transformTSX } from 'pulsar-transformer'

const result = transformTSX(`
  <Button label="Click" onClick={handler} />
`)

console.log(result.code)
// Button({ label: "Click", onClick: handler })
```

## Best Practices

### ✅ Do
- Use TSX for complex component trees
- Prefer TSX for readability with nesting
- Use vanilla DOM for simple cases
- Mix both syntaxes as needed
- Add type annotations for props

### ❌ Don't
- Don't assume React behavior
- Don't expect automatic re-renders
- Don't use React-specific patterns
- Don't forget TypeScript types
- Don't over-nest unnecessarily

## Performance

### TSX Overhead
- **Compile time:** Zero runtime overhead
- **Output:** Same as vanilla DOM calls
- **Bundle size:** No additional runtime
- **Execution:** Direct function calls

### Optimization
```tsx
// ✅ Good: Direct calls
const item = <ListItem data={data} />

// ❌ Avoid: Unnecessary nesting
const item = (
  <div>
    <div>
      <div>
        <ListItem data={data} />
      </div>
    </div>
  </div>
)
```

## Migration from React

### Similarity
- TSX syntax looks the same
- Component composition works similarly
- Props are passed the same way

### Differences
- Returns HTMLElement, not React elements
- No virtual DOM reconciliation
- No automatic re-renders
- Manual state management
- Direct DOM manipulation

### Conversion Example

**React:**
```jsx
function Counter() {
  const [count, setCount] = useState(0)
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  )
}
```

**Pulsar:**
```tsx
function Counter(): HTMLElement {
  const [count, setCount] = createSignal(0)
  
  const display = document.createElement('p')
  const button = document.createElement('button')
  button.textContent = 'Increment'
  button.onclick = () => setCount(count() + 1)
  
  createEffect(() => {
    display.textContent = `Count: ${count()}`
  })
  
  const container = document.createElement('div')
  container.appendChild(display)
  container.appendChild(button)
  
  return container
}
```

Or with TSX helper:
```tsx
function Counter(): HTMLElement {
  const [count, setCount] = createSignal(0)
  
  return (
    <div>
      <p>{() => `Count: ${count()}`}</p>
      <button onClick={() => setCount(count() + 1)}>
        Increment
      </button>
    </div>
  )
}
```

## See Also

- [Component Architecture](./component-architecture.md)
- [Resource System](./resource-system.md)
- [Error Boundaries](./error-boundary-system.md)
- [Transformer](../../packages/transformer/)
