# Pulsar JSX Conventions

## Overview

This document outlines the coding conventions for JSX in Pulsar projects to ensure consistency and avoid common pitfalls.

## Use `className` instead of `class`

### ❌ Avoid

```tsx
<div class="container">Content</div>
```

### ✅ Prefer

```tsx
<div className="container">Content</div>
```

### Why?

1. **JavaScript Reserved Keyword**: `class` is a reserved keyword in JavaScript used for class declarations. While it works in JSX attribute positions (they're just string keys in objects at runtime), using it can cause confusion.

2. **React Ecosystem Consistency**: The React ecosystem standardized on `className` to avoid this issue. Since Pulsar can run alongside React code or developers may switch between the two, consistency reduces cognitive load.

3. **Clarity**: Using `className` makes it explicit that you're setting a CSS class, not declaring a JavaScript class.

4. **Tooling Support**: Most TypeScript/JavaScript tooling, linters, and formatters expect `className` in JSX contexts.

### How Pulsar Handles Both

Pulsar's runtime supports both `class` and `className` for developer convenience:

```typescript
// In create-element-with-registry.ts
else if (key === 'className' || key === 'class') {
    element.className = props[key] as string;
}
```

However, **we recommend using `className` exclusively** in your codebase for the reasons above.

## Other Attribute Conventions

### Event Handlers

Pulsar supports **both** lowercase (DOM standard) and camelCase (React-style) event handlers at runtime, but **we recommend using lowercase** for consistency with the DOM API:

```tsx
// ✅ Preferred - DOM standard
<button onclick={handleClick}>Click me</button>
<input oninput={handleInput} onchange={handleChange} />
<form onsubmit={handleSubmit}>

// ✅ Also supported - React-style (for ecosystem familiarity)
<button onClick={handleClick}>Click me</button>
<input onInput={handleInput} onChange={handleChange} />
<form onSubmit={handleSubmit}>
```

**Why prefer lowercase?**

1. **DOM Native**: Matches the actual DOM property names (`element.onclick`)
2. **Less Magic**: What you write is what the browser uses
3. **Consistency**: Pulsar creates real DOM elements, not virtual DOM
4. **No Transformation**: Lowercase is used directly without case conversion

**Why support both?**

- **React Migration**: Easier to port React components
- **Developer Familiarity**: Many developers know React conventions
- **Flexibility**: Choose what works best for your team

### Hyphenated Attributes

For hyphenated attributes (ARIA, data attributes), use the hyphenated form:

```tsx
<button aria-label="Close dialog" data-testid="close-button">
  Close
</button>
```

### Event Handlers

Use lowercase event handler names (matching DOM conventions):

```tsx
// ✅ Correct
<button onclick={handleClick}>Click me</button>

// Also supported (React-style)
<button onClick={handleClick}>Click me</button>
```

### Style Prop

The `style` prop accepts objects with camelCase or kebab-case properties:

```tsx
// ✅ Both work
<div style={{ backgroundColor: 'red', fontSize: '16px' }}>
<div style={{ 'background-color': 'red', 'font-size': '16px' }}>
```

## Linting

An ESLint rule is configured to warn when using `class` instead of `className`:

```json
{
  "no-restricted-syntax": [
    "error",
    {
      "selector": "JSXAttribute[name.name='class']",
      "message": "Use 'className' instead of 'class'"
    }
  ]
}
```

## Migration Guide

To update existing code:

1. **Find and Replace**: Search for ` class=` and replace with ` className=`
2. **Test**: Run your tests to ensure no breaking changes
3. **Commit**: Commit the changes as a style/consistency improvement

## Summary

- **Always use `className`** for CSS class attributes in JSX
- This avoids confusion with JavaScript's `class` keyword
- Maintains consistency with the React ecosystem
- Better tooling support and developer experience
