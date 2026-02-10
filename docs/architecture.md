# Transformer Architecture

**Complete PSR → TypeScript transformation pipeline**

---

## Overview

The Pulsar Transformer converts PSR (Pulsar Syntax) source code into optimized TypeScript through a **5-phase pipeline**:

```
PSR Source
    ↓
┌─────────────┐
│   LEXER     │  Tokenization (17 token types)
└─────────────┘
    ↓
┌─────────────┐
│   PARSER    │  AST Generation (component-first)
└─────────────┘
    ↓
┌─────────────┐
│  ANALYZER   │  IR Generation (optimized representation)
└─────────────┘
    ↓
┌─────────────┐
│ TRANSFORM   │  Optimization (constant folding, DCE)
└─────────────┘
    ↓
┌─────────────┐
│  EMITTER    │  Code Generation (TypeScript output)
└─────────────┘
    ↓
TypeScript Code
```
