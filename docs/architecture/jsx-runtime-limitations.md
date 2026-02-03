# Pulsar JSX Runtime Limitations

## Event Handler Spread Issue

### Problem
Pulsar's custom JSX runtime (pulsar.dev/src/jsx-runtime.ts) doesn't properly handle event handlers passed through spread operators:

```typescript
// ❌ DOES NOT WORK
const MyButton = (props) => {
  return <button {...props}>Click me</button>
}

<MyButton onclick={() => alert('clicked')} />
// Event handler is lost!
```

### Root Cause
When JSX processes `<button {...rest}>`, the event handlers in the spread object aren't passed through to `createElement` properly. The JSX runtime's `jsx()` function checks `typeof type === 'function'` and calls `type(props)`, but the spread mechanism doesn't preserve event handler functions.

## Workaround Pattern

### Manual DOM Construction
All interactive components must use `document.createElement` + `addEventListener`:

```typescript
const MyButton = ({ onclick, children, ...rest }) => {
  const button = document.createElement('button')
  
  // Extract and add specific event
  if (onclick) {
    button.addEventListener('click', onclick)
  }
  
  // Handle other events in rest
  Object.keys(rest).forEach(key => {
    if (key.startsWith('on') && typeof rest[key] === 'function') {
      const eventName = key.toLowerCase().substring(2)
      button.addEventListener(eventName, rest[key])
    } else if (key === 'className' || key === 'class') {
      button.className = rest[key]
    } else if (key.startsWith('data-') || key.startsWith('aria-')) {
      button.setAttribute(key, rest[key])
    } else {
      button[key] = rest[key]
    }
  })
  
  // Manual children handling
  if (children) {
    const childArray = Array.isArray(children) ? children : [children]
    childArray.forEach(child => {
      if (child instanceof Node) {
        button.appendChild(child)
      } else if (typeof child === 'string' || typeof child === 'number') {
        button.appendChild(document.createTextNode(String(child)))
      }
    })
  }
  
  return button
}
```

## Components Affected

All UI components requiring interactivity must use manual DOM construction:

- ✅ Button (onclick)
- ✅ Input (onchange, oninput, onblur, onfocus)
- ✅ Checkbox (onchange)
- ✅ Toggle (onclick)
- ✅ Textarea (onchange, oninput)
- ✅ Radio (onchange)
- ✅ Select (onchange) - *needs verification*
- ✅ Form (onsubmit) - *needs verification*

## When JSX Is Safe

JSX can still be used for:
1. **Pulsar Custom Components** - Components defined with Pulsar's Component API
2. **Static Elements** - HTML elements with no event handlers
3. **Container Elements** - Divs/spans that only contain children

```typescript
// ✅ Safe - custom component
<Card title="Hello">
  <p>Content</p>
</Card>

// ✅ Safe - no events
<div className="container">
  <h1>Title</h1>
</div>

// ❌ Unsafe - has event handlers
<button onclick={handleClick}>Click</button>
```

## Alternative Approaches Considered

1. **Fix JSX Runtime** - Modify jsx-runtime.ts to handle spreads correctly
   - ⚠️ Complex, may break existing code
   
2. **Babel Plugin** - Transform JSX differently for event handlers
   - ⚠️ Adds build complexity
   
3. **Wrapper Components** - Create wrapper layer
   - ⚠️ Performance overhead, complexity

**Current Decision:** Manual DOM construction is the most reliable pattern until jsx-runtime.ts is enhanced.

## Future Improvements

Potential enhancements to jsx-runtime.ts:
- Detect event handler props (on* pattern)
- Automatically apply addEventListener for intrinsic elements
- Preserve event handlers through spread operators
- Add warning/error for spread with events on intrinsics
