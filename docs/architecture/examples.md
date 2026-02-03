# Pulsar Transformation Examples

**Real-world TSX transformations with step-by-step breakdowns**

---

## Example 1: Simple Static Button

### Input TSX

```tsx
const button = (
  <button className="btn-primary" type="button">
    Click Me
  </button>
);
```

### Step 1: TypeScript Parser → AST

```javascript
VariableDeclaration {
  name: 'button',
  initializer: JsxSelfClosingElement {
    tagName: Identifier('button'),
    attributes: JsxAttributes([
      JsxAttribute {
        name: 'className',
        initializer: StringLiteral('btn-primary')
      },
      JsxAttribute {
        name: 'type',
        initializer: StringLiteral('button')
      }
    ]),
    children: [
      JsxText { text: 'Click Me' }
    ]
  }
}
```

### Step 2: JSXAnalyzer → IR

```javascript
{
  type: 'element',
  tag: 'button',
  props: [
    {
      name: 'className',
      value: StringLiteral('btn-primary'),
      isStatic: true,
      isDynamic: false,
      dependsOn: []
    },
    {
      name: 'type',
      value: StringLiteral('button'),
      isStatic: true,
      isDynamic: false,
      dependsOn: []
    }
  ],
  children: [
    { type: 'text', content: 'Click Me', isStatic: true }
  ],
  events: [],
  isStatic: true,
  hasDynamicChildren: false
}
```

### Step 3: ElementGenerator → TypeScript AST

```javascript
// Simplified representation
CallExpression(
  ParenthesizedExpression(
    ArrowFunction(
      [],
      Block([
        // const el0 = document.createElement('button')
        VariableStatement(
          VariableDeclaration(
            'el0',
            CallExpression(PropertyAccess(Identifier('document'), 'createElement'), [
              StringLiteral('button'),
            ])
          )
        ),

        // el0.className = 'btn-primary'
        ExpressionStatement(
          BinaryExpression(
            PropertyAccess(Identifier('el0'), 'className'),
            '=',
            StringLiteral('btn-primary')
          )
        ),

        // el0.type = 'button'
        ExpressionStatement(
          BinaryExpression(PropertyAccess(Identifier('el0'), 'type'), '=', StringLiteral('button'))
        ),

        // el0.appendChild(document.createTextNode('Click Me'))
        ExpressionStatement(
          CallExpression(PropertyAccess(Identifier('el0'), 'appendChild'), [
            CallExpression(PropertyAccess(Identifier('document'), 'createTextNode'), [
              StringLiteral('Click Me'),
            ]),
          ])
        ),

        // return el0
        ReturnStatement(Identifier('el0')),
      ])
    )
  ),
  [] // Call the IIFE immediately
);
```

### Step 4: TypeScript Printer → JavaScript

```javascript
const button = (() => {
  const el0 = document.createElement('button');
  el0.className = 'btn-primary';
  el0.type = 'button';
  el0.appendChild(document.createTextNode('Click Me'));
  return el0;
})();
```

### Analysis

- ✅ **Fully static** - No reactivity needed
- ✅ **Direct DOM** - createElement, property assignment
- ✅ **IIFE wrapper** - Isolated scope for el0
- ✅ **Zero overhead** - Same as hand-written code

---

## Example 2: Counter with Reactivity

### Input TSX

```tsx
function Counter() {
  const [count, setCount] = createSignal(0);

  return <button onClick={() => setCount(count() + 1)}>Count: {count()}</button>;
}
```

### Step 1: JSXAnalyzer → IR

```javascript
{
  type: 'element',
  tag: 'button',
  props: [],
  children: [
    {
      type: 'text',
      content: 'Count: ',
      isStatic: true
    },
    {
      type: 'expression',
      expression: CallExpression(Identifier('count'), []),  // count()
      isStatic: false,
      dependsOn: ['count']
    }
  ],
  events: [
    {
      type: 'click',
      handler: ArrowFunction([],
        CallExpression(Identifier('setCount'), [
          BinaryExpression(
            CallExpression(Identifier('count'), []),
            '+',
            NumericLiteral(1)
          )
        ])
      )
    }
  ],
  isStatic: false,        // Has event handler
  hasDynamicChildren: true // Has {count()} expression
}
```

### Step 2: ElementGenerator → JavaScript

```javascript
function Counter() {
  const [count, setCount] = createSignal(0);

  return (() => {
    const el0 = document.createElement('button');

    // Event handler
    el0.addEventListener('click', () => setCount(count() + 1));

    // Static text
    el0.appendChild(document.createTextNode('Count: '));

    // Dynamic text with reactivity
    const textNode0 = document.createTextNode('');
    createEffect(() => {
      textNode0.textContent = String(count());
    });
    el0.appendChild(textNode0);

    return el0;
  })();
}
```

### Analysis

- ✅ **Event listener** - addEventListener for onClick
- ✅ **Static text first** - 'Count: ' appended directly
- ✅ **createEffect wrapper** - Only for dynamic {count()}
- ✅ **Fine-grained** - Only textNode updates, not entire button

---

## Example 3: Nested Components

### Input TSX

```tsx
<Card title="User Profile">
  <Avatar src={user.avatar} />
  <UserName>{user.name}</UserName>
</Card>
```

### Step 1: JSXAnalyzer → IR

```javascript
{
  type: 'component',
  component: Identifier('Card'),
  props: [
    {
      name: 'title',
      value: StringLiteral('User Profile'),
      isStatic: true
    }
  ],
  children: [
    {
      type: 'component',
      component: Identifier('Avatar'),
      props: [
        {
          name: 'src',
          value: PropertyAccess(Identifier('user'), 'avatar'),
          isStatic: false,
          dependsOn: ['user']
        }
      ],
      children: []
    },
    {
      type: 'component',
      component: Identifier('UserName'),
      props: [],
      children: [
        {
          type: 'expression',
          expression: PropertyAccess(Identifier('user'), 'name'),
          isStatic: false,
          dependsOn: ['user']
        }
      ]
    }
  ]
}
```

### Step 2: ElementGenerator → JavaScript

```javascript
Card({
  title: 'User Profile',
  children: [
    Avatar({ src: user.avatar }),
    UserName({
      children: user.name,
    }),
  ],
});
```

### Analysis

- ✅ **Component calls** - Function invocations, not DOM creation
- ✅ **Props object** - All attributes as object properties
- ✅ **Children array** - Nested components in array
- ✅ **No IIFE** - Components are already functions

---

## Example 4: Conditional Rendering

### Input TSX

```tsx
<div>{isLoggedIn ? <UserDashboard user={currentUser} /> : <LoginForm />}</div>
```

### Step 1: JSXAnalyzer → IR

```javascript
{
  type: 'element',
  tag: 'div',
  props: [],
  children: [
    {
      type: 'expression',
      expression: ConditionalExpression(
        Identifier('isLoggedIn'),
        // consequent
        JsxElement(UserDashboard),
        // alternate
        JsxElement(LoginForm)
      ),
      isStatic: false,
      dependsOn: ['isLoggedIn', 'currentUser']
    }
  ],
  events: [],
  isStatic: false,
  hasDynamicChildren: true
}
```

### Step 2: ElementGenerator → JavaScript

```javascript
(() => {
  const el0 = document.createElement('div');

  // Expression needs transformation: visit the conditional
  const childResult0 = isLoggedIn ? UserDashboard({ user: currentUser }) : LoginForm({});

  // Handle the result (could be function/array/element)
  const evaluated0 = typeof childResult0 === 'function' ? childResult0() : childResult0;

  if (Array.isArray(evaluated0)) {
    evaluated0.forEach((el) => el0.appendChild(el));
  } else {
    el0.appendChild(evaluated0);
  }

  return el0;
})();
```

### With Reactivity (if isLoggedIn is a signal)

```javascript
(() => {
  const el0 = document.createElement('div');
  const marker0 = document.createComment('');
  el0.appendChild(marker0);

  let currentChild = null;

  createEffect(() => {
    const newChild = isLoggedIn() ? UserDashboard({ user: currentUser }) : LoginForm({});

    if (currentChild) {
      currentChild.remove();
    }

    marker0.parentNode.insertBefore(newChild, marker0);
    currentChild = newChild;
  });

  return el0;
})();
```

### Analysis

- ✅ **Conditional stays** - Ternary preserved in output
- ✅ **Components called** - Each branch calls its component
- ✅ **Runtime decision** - Evaluated when isLoggedIn is accessed
- ✅ **With signals** - createEffect for reactive switching

---

## Example 5: List Rendering with Keys

### Input TSX

```tsx
<ul>
  {users().map((user) => (
    <li key={user.id}>
      {user.name} - {user.email}
    </li>
  ))}
</ul>
```

### Step 1: Detect Array.map Pattern

```javascript
// detectArrayMapPattern() identifies:
{
  isMapCall: true,
  arrayExpr: CallExpression(Identifier('users'), []),
  callbackParam: Identifier('user'),
  keyExpr: PropertyAccess(Identifier('user'), 'id'),
  elementIR: {
    type: 'element',
    tag: 'li',
    children: [
      { type: 'expression', expr: user.name },
      { type: 'text', content: ' - ' },
      { type: 'expression', expr: user.email }
    ]
  }
}
```

### Step 2: Generate Keyed Reconciliation

```javascript
(() => {
  const el0 = document.createElement('ul');

  // Cache for keyed elements
  const cache0 = new Map();

  createEffect(() => {
    const items0 = users();
    const newKeys0 = new Set(items0.map((user) => user.id));

    // PHASE 1: Remove deleted items
    for (const [key, element] of cache0) {
      if (!newKeys0.has(key)) {
        element.remove();
        cache0.delete(key);
      }
    }

    // PHASE 2: Add/update/reorder items
    items0.forEach((user, index) => {
      const key = user.id;
      let li = cache0.get(key);

      if (!li) {
        // Create new element
        li = (() => {
          const el1 = document.createElement('li');

          // Dynamic content
          const textNode0 = document.createTextNode('');
          createEffect(() => {
            textNode0.textContent = String(user.name);
          });
          el1.appendChild(textNode0);

          el1.appendChild(document.createTextNode(' - '));

          const textNode1 = document.createTextNode('');
          createEffect(() => {
            textNode1.textContent = String(user.email);
          });
          el1.appendChild(textNode1);

          return el1;
        })();

        cache0.set(key, li);
      }

      // Ensure correct position
      const currentAtIndex = el0.children[index];
      if (currentAtIndex !== li) {
        el0.insertBefore(li, currentAtIndex || null);
      }
    });
  });

  return el0;
})();
```

### Analysis

- ✅ **Map detected** - Special handling for array.map()
- ✅ **Keyed cache** - Map stores elements by key
- ✅ **Minimal updates** - Only add/remove/move changed items
- ✅ **Position preserved** - insertBefore for reordering
- ✅ **State maintained** - Elements reused, not recreated

---

## Example 6: Form with Multiple Inputs

### Input TSX

```tsx
<form onSubmit={handleSubmit}>
  <input
    type="text"
    value={name()}
    onInput={(e) => setName(e.target.value)}
    placeholder="Enter name"
  />
  <input
    type="email"
    value={email()}
    onInput={(e) => setEmail(e.target.value)}
    placeholder="Enter email"
  />
  <button type="submit">Submit</button>
</form>
```

### Generated JavaScript

```javascript
(() => {
  const el0 = document.createElement('form');
  el0.addEventListener('submit', handleSubmit);

  // First input
  const el1 = (() => {
    const el2 = document.createElement('input');
    el2.type = 'text';
    el2.placeholder = 'Enter name';

    // Two-way binding for value
    createEffect(() => {
      el2.value = name();
    });

    el2.addEventListener('input', (e) => setName(e.target.value));

    return el2;
  })();
  el0.appendChild(el1);

  // Second input
  const el3 = (() => {
    const el4 = document.createElement('input');
    el4.type = 'email';
    el4.placeholder = 'Enter email';

    createEffect(() => {
      el4.value = email();
    });

    el4.addEventListener('input', (e) => setEmail(e.target.value));

    return el4;
  })();
  el0.appendChild(el3);

  // Submit button
  const el5 = (() => {
    const el6 = document.createElement('button');
    el6.type = 'submit';
    el6.appendChild(document.createTextNode('Submit'));
    return el6;
  })();
  el0.appendChild(el5);

  return el0;
})();
```

### Analysis

- ✅ **Form binding** - onSubmit on form element
- ✅ **Value tracking** - createEffect for reactive values
- ✅ **Event handlers** - onInput for two-way binding
- ✅ **Static props** - type, placeholder set directly
- ✅ **Nested IIFEs** - Each input in own scope

---

## Example 7: Fragment with Multiple Elements

### Input TSX

```tsx
<>
  <Header />
  <main>
    <Content />
  </main>
  <Footer />
</>
```

### Step 1: JSXAnalyzer → IR

```javascript
{
  type: 'fragment',
  children: [
    { type: 'component', component: 'Header', props: [], children: [] },
    {
      type: 'element',
      tag: 'main',
      children: [
        { type: 'component', component: 'Content', props: [], children: [] }
      ]
    },
    { type: 'component', component: 'Footer', props: [], children: [] }
  ]
}
```

### Step 2: ElementGenerator → JavaScript

```javascript
(() => {
  const fragment0 = document.createDocumentFragment();

  // Header component
  fragment0.appendChild(Header({}));

  // main element
  const el0 = (() => {
    const el1 = document.createElement('main');
    el1.appendChild(Content({}));
    return el1;
  })();
  fragment0.appendChild(el0);

  // Footer component
  fragment0.appendChild(Footer({}));

  return fragment0;
})();
```

### Analysis

- ✅ **DocumentFragment** - No wrapper div
- ✅ **Efficient** - Single reflow when appended
- ✅ **Mixed content** - Components and elements
- ✅ **No extra nodes** - Fragment disappears after append

---

## Example 8: Refs and Lifecycle

### Input TSX

```tsx
function VideoPlayer() {
  let videoRef;

  onMount(() => {
    videoRef.play();
  });

  return <video ref={videoRef} src={videoUrl} controls />;
}
```

### Generated JavaScript

```javascript
function VideoPlayer() {
  let videoRef;

  onMount(() => {
    videoRef.play();
  });

  return (() => {
    const el0 = document.createElement('video');
    el0.src = videoUrl;
    el0.controls = true;

    // Ref assignment
    if (typeof videoRef === 'function') {
      videoRef(el0);
    } else {
      videoRef = el0;
    }

    return el0;
  })();
}
```

### Analysis

- ✅ **Ref capture** - Element assigned to videoRef
- ✅ **Function refs** - Supports callback refs
- ✅ **Lifecycle** - onMount called after element creation
- ✅ **Direct access** - No .current property needed

---

## Example 9: Dynamic Styles

### Input TSX

```tsx
<div
  className={isActive ? 'active' : 'inactive'}
  style={{
    color: theme.color,
    fontSize: `${size}px`,
  }}
>
  Content
</div>
```

### Generated JavaScript

```javascript
(() => {
  const el0 = document.createElement('div');

  // Dynamic className
  createEffect(() => {
    el0.className = isActive ? 'active' : 'inactive';
  });

  // Dynamic inline styles
  createEffect(() => {
    el0.style.color = theme.color;
  });

  createEffect(() => {
    el0.style.fontSize = `${size}px`;
  });

  el0.appendChild(document.createTextNode('Content'));

  return el0;
})();
```

### Analysis

- ✅ **Separate effects** - One per reactive property
- ✅ **Fine-grained** - Only updates changed styles
- ✅ **No style object** - Direct style property access
- ✅ **Template literals** - Preserved in output

---

## Example 10: Spread Attributes

### Input TSX

```tsx
<input {...field.register()} placeholder="Name" />
```

### Step 1: JSXAnalyzer → IR

```javascript
{
  type: 'element',
  tag: 'input',
  props: [
    {
      name: '__spread',
      value: CallExpression(
        PropertyAccess(Identifier('field'), 'register'),
        []
      ),
      isSpread: true,
      isDynamic: true
    },
    {
      name: 'placeholder',
      value: StringLiteral('Name'),
      isStatic: true
    }
  ]
}
```

### Generated JavaScript

```javascript
(() => {
  const el0 = document.createElement('input');

  // Apply spread attributes
  const spreadAttrs0 = field.register();
  Object.keys(spreadAttrs0).forEach((key) => {
    const value = spreadAttrs0[key];
    if (key.startsWith('on') && typeof value === 'function') {
      // Event handler
      el0.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'ref') {
      // Ref
      if (typeof value === 'function') value(el0);
      else value.current = el0;
    } else {
      // Regular attribute
      el0[key] = value;
    }
  });

  // Static placeholder after spread
  el0.placeholder = 'Name';

  return el0;
})();
```

### Analysis

- ✅ **Object.keys** - Iterate spread object
- ✅ **Smart handling** - Events, refs, props distinguished
- ✅ **Order matters** - Spread first, then explicit props
- ✅ **Type detection** - Based on key name and value type

---

## Comparison: React vs Pulsar

### React (with Virtual DOM)

```jsx
// React
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
}

// Compiled to:
function Counter() {
  const [count, setCount] = useState(0);
  return React.createElement('button', { onClick: () => setCount(count + 1) }, 'Count: ', count);
}

// Runtime:
// 1. React.createElement creates virtual element
// 2. On state change, re-run component
// 3. Create new virtual tree
// 4. Diff with previous virtual tree
// 5. Apply changes to real DOM
```

### Pulsar (Direct DOM)

```tsx
// Pulsar
function Counter() {
  const [count, setCount] = createSignal(0);
  return <button onClick={() => setCount(count() + 1)}>Count: {count()}</button>;
}

// Compiled to:
function Counter() {
  const [count, setCount] = createSignal(0);
  return (() => {
    const el = document.createElement('button');
    el.addEventListener('click', () => setCount(count() + 1));
    el.appendChild(document.createTextNode('Count: '));
    const textNode = document.createTextNode('');
    createEffect(() => {
      textNode.textContent = String(count());
    });
    el.appendChild(textNode);
    return el;
  })();
}

// Runtime:
// 1. Create real DOM element directly
// 2. On state change, effect auto-runs
// 3. Update only the textNode
// 4. No diffing, no virtual DOM
```

### Performance Comparison

```
┌─────────────────────────┬───────────┬──────────┐
│ Metric                  │   React   │  Pulsar  │
├─────────────────────────┼───────────┼──────────┤
│ Initial render          │   Fast    │  Faster  │
│ Update (1 field)        │   Fast    │  Instant │
│ Update (1000 items)     │   Slow    │  Fast    │
│ Bundle size (runtime)   │   ~50KB   │  ~3KB    │
│ Memory usage            │   High    │  Low     │
│ Component re-runs       │   Always  │  Never   │
│ Granularity             │   Coarse  │  Fine    │
└─────────────────────────┴───────────┴──────────┘
```

---

## Summary

### Key Transformation Principles

1. **JSX is syntax sugar** - Removed at compile-time
2. **Static = Direct** - No reactivity for constants
3. **Dynamic = createEffect** - Automatic wrapping
4. **Components = Functions** - Simple function calls
5. **Events = addEventListener** - Direct DOM API
6. **Lists = Keyed reconciliation** - Efficient updates
7. **IIFE everywhere** - Isolated scopes
8. **Zero runtime JSX** - All transformation at build-time

### When Pulsar Excels

- ✅ Frequent updates to small parts of UI
- ✅ Large lists with add/remove/reorder
- ✅ Performance-critical applications
- ✅ Memory-constrained environments
- ✅ Bundle size matters

### Trade-offs

- ⚠️ More generated code (but faster)
- ⚠️ Build-time dependency
- ⚠️ Different mental model from React
- ⚠️ Less ecosystem (for now)

---

**Next:** [Transformer Internals](./TRANSFORMER_INTERNALS.md) | [Architecture Diagrams](./TRANSFORMER_ARCHITECTURE.md)
