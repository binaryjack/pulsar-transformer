# Documentation Index - PSR Test Runner & AI Agent Testing

**Location:** `packages/pulsar-transformer/src/testing/`  
**Created:** 2026-02-07  
**Purpose:** Navigation guide for all testing documentation  

---

## 📚 Document Overview

### For AI Agents (Testing & Fixing Transformer)

| # | Document | Purpose | Audience | Size | Priority |
|---|----------|---------|----------|------|----------|
| 1 | **[QUICK-REFERENCE.md](./QUICK-REFERENCE.md)** | Condensed cheat sheet with essential info | AI Agent | 300 lines | ⭐ START |
| 2 | **[AI-AGENT-TESTING-PROMPT.md](./AI-AGENT-TESTING-PROMPT.md)** | Complete instructions, strategy, checklist | AI Agent | 800 lines | ⭐⭐⭐ MAIN |
| 3 | **[HANDOFF-DOCUMENTATION.md](./HANDOFF-DOCUMENTATION.md)** | Context, workflow examples, deliverables | AI Agent | 500 lines | ⭐⭐ CONTEXT |
| 4 | **[../../TESTING-ISSUES.md](../../TESTING-ISSUES.md)** | Issue tracking document (template) | AI Agent | Variable | 📝 WORKING |

### For Human Developers

| # | Document | Purpose | Audience | Size |
|---|----------|---------|----------|------|
| 1 | **[README.md](./README.md)** | API reference and usage guide | Developers | 680 lines |
| 2 | **[IMPLEMENTATION-COMPLETE.md](./IMPLEMENTATION-COMPLETE.md)** | Implementation summary | Developers | 520 lines |
| 3 | **[examples/comprehensive-demo.ts](./examples/comprehensive-demo.ts)** | Complete usage examples | Developers | 300 lines |

---

## 🎯 Reading Order

### For Next AI Agent (Start Here!)

**Total time: 15-20 minutes before testing begins**

1. **QUICK-REFERENCE.md** (2 minutes)
   - Quick cheat sheet
   - Essential commands
   - Feature checklist
   - Common pitfalls
   
   → Gives you the big picture

2. **AI-AGENT-TESTING-PROMPT.md** (10 minutes)
   - Your complete mission
   - Architecture context
   - 14 feature categories to test
   - Issue documentation template
   - 5-phase workflow
   - Success criteria
   
   → Your primary instruction manual

3. **HANDOFF-DOCUMENTATION.md** (5 minutes)
   - What was built for you
   - How to use the testing framework
   - Expected workflow examples
   - Key deliverables
   
   → Understanding what you have to work with

4. **TESTING-ISSUES.md** (ongoing)
   - Document issues here as you find them
   - Track progress
   - Log testing sessions
   
   → Your working document

5. **README.md** (as needed)
   - API reference when needed
   - Detailed examples
   - Troubleshooting
   
   → Reference when writing tests

---

## 📋 Document Purposes Explained

### QUICK-REFERENCE.md
**"The Cheat Sheet"**

What it contains:
- Mission statement (30 seconds)
- Architecture overview (1 minute)
- PSR Test Runner basics (2 minutes)
- 14 features checklist
- Issue template (30 seconds)
- Critical rules
- File locations
- Essential commands
- Success criteria
- Pro tips

**Use when:** You need to quickly remember syntax, commands, or rules without reading full documentation.

---

### AI-AGENT-TESTING-PROMPT.md
**"The Complete Manual"**

What it contains:
- Mission and responsibilities
- Full architecture explanation
- Transformation pipeline details
- PSR Test Runner complete guide
- Testing strategy with main.psr
- ALL 14 feature categories with:
  - Feature checklist
  - PSR examples
  - Expected transformations
  - Test case templates
- Comprehensive issue documentation template
- Critical rules from copilot instructions
- 5-phase working process:
  1. Setup (30 min)
  2. Feature Testing (3-5 hours)
  3. Issue Analysis (2-3 hours)
  4. Fixing (variable)
  5. Validation (1-2 hours)
- Success criteria and metrics
- Useful commands
- Resources and links

**Use when:** Starting the testing mission. This is your primary instruction set.

---

### HANDOFF-DOCUMENTATION.md
**"The Context Document"**

What it contains:
- What was delivered (summary of all created docs)
- How to use each document
- Key features of the AI prompt
- Expected workflow examples
- Day-by-day work examples
- Key deliverables list
- Getting started commands
- Important notes for Tadeo
- Handoff checklist

**Use when:** You need to understand the bigger picture, see workflow examples, or understand what's expected as deliverables.

---

### TESTING-ISSUES.md
**"The Issue Tracker"**

What it contains:
- Testing progress table (14 features)
- Issues summary (by severity/status)
- Standardized issue template
- Testing session log
- Performance tracking
- Recommendations section
- Quick reference tables

**Use when:** 
- Documenting a new issue found
- Updating issue status (Open → In Progress → Fixed)
- Tracking testing progress
- Logging testing sessions
- Generating final report

**Format:**
- One issue = one section with complete details
- Progress table updated after each feature
- Session log after each work session

---

### README.md
**"The API Reference"**

What it contains:
- Overview and features
- Installation instructions
- Quick start examples
- Complete API reference
- Input configuration types
- DOM assertions
- Style assertions
- Reactivity tests
- Event tests
- Advanced usage
- Configuration options
- Troubleshooting
- Examples

**Use when:** 
- Writing test cases
- Looking up API syntax
- Understanding test input structure
- Debugging test failures
- Learning advanced features

---

### IMPLEMENTATION-COMPLETE.md
**"The Implementation Summary"**

What it contains:
- What was built
- Architecture decisions
- File structure
- Implementation details
- Type system overview
- Testing approach
- Usage examples
- Next steps

**Use when:**
- Understanding implementation decisions
- Learning the codebase structure
- Seeing what exists

---

### examples/comprehensive-demo.ts
**"The Living Examples"**

What it contains:
- Real working test cases
- All feature demonstrations
- Signal tests
- Effect tests
- JSX tests
- Event tests
- Reactivity tests
- Style tests
- Complete examples

**Use when:**
- Learning by example
- Copy-pasting test templates
- Understanding test patterns
- Seeing real usage

---

## 🔄 Workflow Integration

### Phase 1: Setup
**Documents needed:**
1. QUICK-REFERENCE.md - Overview
2. AI-AGENT-TESTING-PROMPT.md - Setup checklist
3. README.md - API familiarization

### Phase 2: Feature Testing
**Documents needed:**
1. AI-AGENT-TESTING-PROMPT.md - Feature checklists
2. examples/comprehensive-demo.ts - Test templates
3. TESTING-ISSUES.md - Issue documentation
4. README.md - API reference

### Phase 3: Issue Analysis
**Documents needed:**
1. TESTING-ISSUES.md - Review documented issues
2. AI-AGENT-TESTING-PROMPT.md - Root cause guidance

### Phase 4: Fixing
**Documents needed:**
1. Critical rules (embedded in AI prompt)
2. Transformer source code
3. TESTING-ISSUES.md - Update status

### Phase 5: Validation
**Documents needed:**
1. AI-AGENT-TESTING-PROMPT.md - Success criteria
2. TESTING-ISSUES.md - Final report generation

---

## 📊 Document Relationships

```
QUICK-REFERENCE.md (Entry Point)
    │
    ├──→ AI-AGENT-TESTING-PROMPT.md (Main Instructions)
    │       │
    │       ├──→ Feature Categories (embedded)
    │       ├──→ Issue Template (embedded)
    │       ├──→ Critical Rules (embedded)
    │       └──→ 5-Phase Process (embedded)
    │
    ├──→ HANDOFF-DOCUMENTATION.md (Context)
    │       │
    │       └──→ Workflow Examples
    │
    ├──→ TESTING-ISSUES.md (Working Doc)
    │       │
    │       ├──→ Progress Tracking
    │       └──→ Issue Documentation
    │
    └──→ README.md (API Reference)
            │
            └──→ examples/comprehensive-demo.ts (Examples)
```

---

## 🎯 Key Information by Topic

### Architecture Understanding
- AI-AGENT-TESTING-PROMPT.md - "Architecture Context" section
- QUICK-REFERENCE.md - "Architecture" section
- README.md - "Overview" section

### Testing Strategy
- AI-AGENT-TESTING-PROMPT.md - "Testing Strategy" section
- HANDOFF-DOCUMENTATION.md - "Expected Workflow Example"
- examples/comprehensive-demo.ts - Working examples

### Feature Validation
- AI-AGENT-TESTING-PROMPT.md - "All Pulsar Features to Validate" (14 categories)
- QUICK-REFERENCE.md - "14 Features to Test" checklist

### Issue Documentation
- AI-AGENT-TESTING-PROMPT.md - "Issue Documentation Template"
- TESTING-ISSUES.md - Structure and examples
- QUICK-REFERENCE.md - "Issue Documentation" section

### API Usage
- README.md - Complete API reference
- examples/comprehensive-demo.ts - Usage examples
- QUICK-REFERENCE.md - "PSR Test Runner" section

### Critical Rules
- AI-AGENT-TESTING-PROMPT.md - "Critical Rules" section
- QUICK-REFERENCE.md - "Critical Rules" section
- `.github/00-CRITICAL-RULES.md` - Full rules

### Commands & Tools
- QUICK-REFERENCE.md - "Essential Commands"
- AI-AGENT-TESTING-PROMPT.md - "Useful Commands"
- HANDOFF-DOCUMENTATION.md - "Getting Started Commands"

### Success Metrics
- AI-AGENT-TESTING-PROMPT.md - "Success Criteria"
- QUICK-REFERENCE.md - "Success Criteria"
- TESTING-ISSUES.md - Progress tables

---

## 📝 Creating Your Testing Script

**Where:** `packages/pulsar-transformer/src/testing/test-runner-script.ts`

**Template structure:**

```typescript
// 1. Import test runner
import { createPSRTestRunner } from '../create-psr-test-runner';

// 2. Import file system utilities
import { readFileSync } from 'fs';
import { join } from 'path';

// 3. Create runner instance
const runner = createPSRTestRunner({ verbose: true });

// 4. Load test files
const testFiles = [
  'test-comprehensive-new.psr',
  // ... more files
];

// 5. Run tests
async function main() {
  for (const file of testFiles) {
    const source = readFileSync(
      join('../../pulsar-ui.dev/src', file),
      'utf-8'
    );
    
    const result = await runner.runTest({
      description: `Testing ${file}`,
      source,
      // ... add assertions
    });
    
    // 6. Document issues
    if (!result.passed) {
      // Update TESTING-ISSUES.md
    }
  }
}

main().catch(console.error);
```

**Guidance in:**
- AI-AGENT-TESTING-PROMPT.md - "Testing Strategy" section
- HANDOFF-DOCUMENTATION.md - "Expected Workflow Example"

---

## 🚀 Next Steps for AI Agent

### Immediate (Right Now)
1. ✅ Read QUICK-REFERENCE.md (2 min)
2. → Read AI-AGENT-TESTING-PROMPT.md (10 min)
3. → Read HANDOFF-DOCUMENTATION.md (5 min)

### Phase 1: Setup (30 min)
1. → Create test-runner-script.ts
2. → Read main.psr
3. → List all test-*.psr files
4. → Set up TESTING-ISSUES.md for logging

### Phase 2: Testing (3-5 hours)
1. → Test each feature category
2. → Document issues immediately
3. → Update progress tables

### Phases 3-5: Analysis, Fixing, Validation
→ Follow the 5-phase process in AI-AGENT-TESTING-PROMPT.md

---

## 📞 Support

### Questions About Documents

| Question | Answer |
|----------|--------|
| Where do I start? | QUICK-REFERENCE.md |
| What's my mission? | AI-AGENT-TESTING-PROMPT.md |
| How do I document issues? | TESTING-ISSUES.md template |
| How do I use the test runner? | README.md |
| What are the critical rules? | Embedded in AI prompt |
| What commands do I run? | QUICK-REFERENCE.md |

### Document Issues

If any document is unclear or missing information:
1. Note it in your session report
2. Continue with available information
3. Ask for clarification if blocked

---

## ✅ Checklist Before Starting

- [ ] Read QUICK-REFERENCE.md
- [ ] Read AI-AGENT-TESTING-PROMPT.md completely
- [ ] Read HANDOFF-DOCUMENTATION.md
- [ ] Understand the 5-phase process
- [ ] Know where to document issues (TESTING-ISSUES.md)
- [ ] Understand success criteria
- [ ] Know the critical rules
- [ ] Have commands reference handy
- [ ] Ready to begin Phase 1

---

**Good luck with testing! All the context you need is in these documents.**

---

**Created:** 2026-02-07  
**Maintained By:** Tadeo (binaryjack)  
**For:** AI Testing Agents  
**Version:** 1.0.0
