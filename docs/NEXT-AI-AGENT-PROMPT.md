# NEXT AI AGENT: Start Here

**Last Updated:** 2026-02-10  
**Previous Session:** Transformer Implementation (Phase 4)  
**Status:** ✅ Transformer Complete, Pipeline Integration Pending

---

## 📋 IMMEDIATE CONTEXT

### What Just Happened

✅ **Phase 4: AST Transformer implemented** (1.5 hours)

- 15 prototype methods created
- 6/6 tests passing
- Counter.psr golden fixture working
- Zero rule violations
- Clean architecture using Visitor + Strategy patterns

### Current Pipeline

```
PSR → Lexer → Parser → [Transformer] → CodeGenerator → TypeScript
                         ↑ NEW! Not integrated yet
```

**Transformer works independently but NOT wired into main pipeline yet.**

---

## 🎯 YOUR MISSION

**Primary Goal:** Integrate transformer into production pipeline

**Secondary Goals:**

1. Test remaining golden fixtures (Badge, Drawer)
2. Fix semantic analyzer compilation error
3. Ensure backward compatibility
4. Update documentation

---

## 🔥 PRIORITY 1: Integration (CRITICAL)

### Task: Wire Transformer Into Main Pipeline

**File to modify:** `src/index.ts`

**Current pipeline (working):**

```typescript
const lexer = createLexer(source);
const parser = createParser(lexer.scanTokens());
const generator = createCodeGenerator(parser.parse());
return generator.generate();
```

**New pipeline (add transformer):**

```typescript
const lexer = createLexer(source);
const parser = createParser(lexer.scanTokens());

// NEW: Optional transformer
const useTransformer = options.useTransformer ?? false;
const ast = parser.parse();

const transformedAst = useTransformer ? createTransformer(ast).transform().ast : ast;

const generator = createCodeGenerator(transformedAst);
return generator.generate();
```

**Add option to IPipelineOptions:**

```typescript
export interface IPipelineOptions {
  filePath?: string;
  debug?: boolean;
  useTransformer?: boolean; // NEW
  // ... existing options
}
```

**Why feature flag:** Backward compatibility during testing

---

## 🔥 PRIORITY 2: Golden Fixture Tests

### Task: Test Badge.psr and Drawer.psr

**Create these files:**

1. `src/__tests__/transformer/golden-badge.test.ts`
2. `src/__tests__/transformer/golden-drawer.test.ts`

**Copy pattern from:** `src/__tests__/transformer/golden-counter.test.ts`

**Fixtures location:**

- `tests/fixtures/real-psr/02-badge.psr`
- `tests/fixtures/real-psr/03-drawer.psr`

**Expected result:** 3/3 golden fixtures passing

---

## 🔥 PRIORITY 3: Fix Compilation Error

### Task: Fix Semantic Analyzer Type Error

**File:** `src/semantic-analyzer/prototypes/symbol-management.ts`

**Error (line 55):**

```typescript
while (scope) {
  if (scope.symbols.has(name)) {
    return scope.symbols.get(name)!;
  }
  scope = scope.parent; // ❌ Type 'IScope | null' is not assignable to type 'IScope'
}
```

**Fix Option 1 (type guard):**

```typescript
while (scope) {
  if (scope.symbols.has(name)) {
    return scope.symbols.get(name)!;
  }
  if (scope.parent) {
    scope = scope.parent;
  } else {
    break;
  }
}
```

**Fix Option 2 (assertion):**

```typescript
while (scope) {
  if (scope.symbols.has(name)) {
    return scope.symbols.get(name)!;
  }
  scope = scope.parent as IScope | null;
  if (!scope) break;
}
```

**Preferred:** Option 1 (safer)

---

## 🔥 PRIORITY 4: CodeGenerator Integration

### Task: Teach CodeGenerator to Handle Transformed AST

**Issue:** CodeGenerator expects `ComponentDeclaration`, transformer outputs `VariableDeclaration` inside `ExportNamedDeclaration`

**File to check:** `src/code-generator/prototypes/generate-statement.ts`

**Current logic:**

```typescript
case 'ComponentDeclaration':
  return this.generateComponent(node);
```

**Add support for transformed components:**

```typescript
case 'ExportNamedDeclaration':
  const decl = node.declaration;
  if (decl?.type === 'VariableDeclaration') {
    // Check if this is a transformed component
    const firstDeclarator = decl.declarations[0];
    if (firstDeclarator?.init?.type === 'ArrowFunctionExpression') {
      // Check for $REGISTRY.execute pattern
      const body = firstDeclarator.init.body;
      if (body.type === 'BlockStatement' &&
          body.body[0]?.type === 'ReturnStatement' &&
          body.body[0].argument?.callee?.object?.name === '$REGISTRY') {
        // This is a transformed component
        return this.generateTransformedComponent(node);
      }
    }
  }
  // Otherwise handle normal export
  return this.generateExport(node);
```

**OR simpler approach:** Just generate the VariableDeclaration as-is (it's already valid TypeScript)

---

## 📊 SUCCESS CRITERIA

Before claiming done, verify:

- [ ] Transformer integrated into pipeline (feature flag)
- [ ] Badge.psr transforms correctly
- [ ] Drawer.psr transforms correctly
- [ ] Semantic analyzer compiles without errors
- [ ] Full test suite passes (no regressions)
- [ ] Pipeline option documented
- [ ] Performance acceptable (< 10ms added)

---

## 🛠️ RESOURCES

### Essential Files

**Read first:**

1. `docs/FOLLOWUP-2026-02-10.md` - What was completed
2. `docs/learnings/2026-02-10-transformer-ast-transformation-patterns.md` - How transformer works
3. `docs/ai-collaboration-rules.json` - Your rules

**Reference:**

1. `src/transformer/` - Transformer implementation
2. `src/__tests__/transformer/golden-counter.test.ts` - Test pattern
3. `src/index.ts` - Main pipeline

### Key Concepts

**Transformer Output:**

```typescript
// INPUT: component Counter() {...}
// OUTPUT:
export const Counter = () => {
  return $REGISTRY.execute('component:Counter', () => {
    // original body
  });
};
```

**What transforms:**

- ComponentDeclaration → VariableDeclaration
- Adds framework imports

**What passes through:**

- InterfaceDeclaration (unchanged)
- JSX (CodeGenerator handles)
- Reactivity calls (runtime functions)

---

## ⚠️ CRITICAL RULES

From `docs/ai-collaboration-rules.json`:

1. ❌ **NO ES6 classes** - Prototype-based ONLY
2. ❌ **NO `any` types** - Proper interfaces REQUIRED
3. ❌ **NO stubs** - Fully implement everything
4. ❌ **ONE item per file** - Always
5. ✅ **Research when uncertain** - Don't guess
6. ✅ **Test before claiming done** - Actually verify

**Supervisor:** Always active. Zero tolerance for violations.

---

## 🎬 WORKFLOW

### Standard Process

1. **Read context** (this file + FOLLOWUP)
2. **State what you'll do** (be specific)
3. **Wait for approval** (unless "do it in one go")
4. **Implement fully** (no stubs)
5. **Test actually** (run the tests)
6. **Report results** (binary: works/doesn't work)

### If Uncertain

1. **Stop immediately**
2. **Tell user:** "Need to research [X] from [framework]"
3. **Wait for approval**
4. **Research and document**
5. **Present approach**
6. **Wait for sign-off**
7. **Then implement**

---

## 📈 ESTIMATED TIMELINE

| Task                       | Time          |
| -------------------------- | ------------- |
| Integration (feature flag) | 30 mins       |
| Badge.psr test             | 15 mins       |
| Drawer.psr test            | 15 mins       |
| Fix semantic analyzer      | 5 mins        |
| CodeGenerator update       | 30 mins       |
| Full test suite run        | 10 mins       |
| Documentation updates      | 20 mins       |
| **TOTAL**                  | **2-3 hours** |

---

## 🚨 WATCH OUT FOR

### Common Pitfalls

1. **Export wrappers** - Components are inside `ExportNamedDeclaration`
2. **Import tracking** - Must track $REGISTRY, t_element usage
3. **Type safety** - No `any` types allowed
4. **Backward compatibility** - Don't break existing pipeline

### Known Issues

1. Semantic analyzer has type error (Priority 3)
2. CodeGenerator doesn't recognize transformed AST yet (Priority 4)
3. Only Counter.psr tested so far (Priority 2)

---

## 📝 TESTING STRATEGY

### Unit Tests

```bash
pnpm test transformer/
```

### Golden Fixtures

```bash
pnpm test transformer/golden-
```

### Full Suite

```bash
pnpm test
```

### Compilation

```bash
pnpm tsc --noEmit
```

**All must pass before claiming done.**

---

## 🎯 DEFINITION OF DONE

**Integration complete when:**

1. ✅ Feature flag added (`useTransformer?: boolean`)
2. ✅ Pipeline uses transformer when enabled
3. ✅ All 3 golden fixtures pass (Counter, Badge, Drawer)
4. ✅ Semantic analyzer compiles cleanly
5. ✅ Full test suite passes (no regressions)
6. ✅ CodeGenerator handles transformed AST
7. ✅ Documentation updated
8. ✅ Performance acceptable

**NOT done until all 8 criteria met.**

---

## 💬 COMMUNICATION STYLE

From collaboration rules:

- **Direct, minimal, binary** - No fluff
- **State → Implement → Report** - Efficient
- **"works" or "doesn't work"** - Not "should work"
- **Stop when uncertain** - Don't guess

**Allowed emojis:** ✅ ❌  
**Forbidden:** Politeness fluff, speculation, over-explanation

---

## 📚 REFERENCE DOCS

**Must read:**

1. [Followup Document](./FOLLOWUP-2026-02-10.md)
2. [Learnings Document](./learnings/2026-02-10-transformer-ast-transformation-patterns.md)
3. [Collaboration Rules](./ai-collaboration-rules.json)

**Helpful:**

1. [Implementation Plan](./implementation-plans/transformer/2026-02-10-transformer-implementation-plan.md)
2. [Session Summary](./sessions/2026-02-10-transformer-implementation-session.md)
3. [Supervisor Report](./SESSION-SUPERVISOR-2026-02-10.md)

---

## ⏭️ AFTER INTEGRATION

**Once integration complete, next priorities:**

1. Remove feature flag (make transformer default)
2. Add source map support
3. Performance optimization
4. Error recovery
5. Advanced transformations

**But don't start these until integration is done and verified.**

---

## 🚀 QUICK START

**Fastest path to productivity:**

```bash
# 1. Read context (5 mins)
cat docs/FOLLOWUP-2026-02-10.md
cat docs/learnings/2026-02-10-transformer-ast-transformation-patterns.md

# 2. Run tests to see current state (1 min)
pnpm test transformer/

# 3. Check compilation (1 min)
pnpm tsc --noEmit

# 4. Start with Priority 1 (Integration)
# Modify: src/index.ts
# Add: useTransformer option
```

---

## 🎯 YOUR FIRST TASK

**Start here:**

1. Read this document
2. Read FOLLOWUP-2026-02-10.md
3. State your plan for Priority 1 (Integration)
4. Wait for approval
5. Implement feature flag
6. Test with Counter.psr
7. Report results

**Don't proceed to Priority 2 until Priority 1 works.**

---

## 📞 NEED HELP?

**If stuck:**

1. Check `docs/learnings/` folder
2. Review transformer implementation in `src/transformer/`
3. Look at existing tests in `src/__tests__/transformer/`
4. **If still stuck:** STOP and ask user

**Never guess. Never leave stubs. Never use `any` types.**

---

**Good luck! The foundation is solid. Integration should be straightforward.**

---

**Status:** Ready for next session  
**Blocker:** None  
**Risk Level:** Low
