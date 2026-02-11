# Lexer State Machine

## States

1. **Normal** - Regular JavaScript/TypeScript code
2. **InsideJSX** - Inside JSX tag: `<div className="foo">`
3. **InsideJSXText** - Between JSX tags: `<div>TEXT</div>`

## Transitions

```
Normal
  └─ sees '<' + identifier → InsideJSX

InsideJSX
  ├─ sees '>' → InsideJSXText
  ├─ sees '/>' → Normal
  └─ sees '{' → push(Normal)

InsideJSXText
  ├─ sees '<' + '/' → InsideJSX (closing tag)
  ├─ sees '<' + identifier → InsideJSX (nested opening)
  ├─ sees '{' → push(Normal)
  └─ scans text until boundary

Normal (in JSX)
  └─ sees '}' → pop() back to InsideJSXText
```

## Examples

### Simple Element
```
<div>Hello</div>

Normal → '<' → InsideJSX → '>' → InsideJSXText
→ scan "Hello" → '</' → InsideJSX → '>' → Normal
```

### With Expression
```
<div>{count()}</div>

Normal → '<' → InsideJSX → '>' → InsideJSXText
→ '{' → push(Normal) → scan tokens → '}' → pop(InsideJSXText)
→ '</' → InsideJSX → '>' → Normal
```

### Nested
```
<div><span>Text</span></div>

Normal → '<' → InsideJSX → '>' → InsideJSXText
→ '<' → InsideJSX → '>' → InsideJSXText → scan "Text"
→ '</' → InsideJSX → '>' → InsideJSXText
→ '</' → InsideJSX → '>' → Normal
```

## Implementation Status

✅ State enum defined
✅ State management functions (push/pop/get/isInJSX)
✅ State transitions in scan-token.ts
⏳ scanJSXText function (Phase 3)

## Testing

State machine behavior will be tested via:
- Unit tests for state transitions
- Integration tests with real PSR files
- End-to-end browser validation
