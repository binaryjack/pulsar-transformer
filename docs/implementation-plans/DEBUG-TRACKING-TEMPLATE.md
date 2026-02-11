# Debug Tracking Template for All Implementation Plans

**Purpose:** This template must be added to ALL 36 implementation plans between "What to Do" and "Test Requirements" sections.

**Status:** - ✅ Completed: template-literals, show-components, for-iteration, complex-jsx-expressions

- ⏳ Remaining: 32 plans need this section added

---

## How to Apply This Template

For each implementation plan file (`2026-02-11-14-20-{feature-name}.md`):

1. Locate the section that starts with `## Test Requirements`
2. Insert the entire "Debug Tracking Requirements" section BEFORE the Test Requirements section
3. Customize the feature-specific code examples (node names, types, etc.)
4. Ensure all 4 subsections are included

---

## Standard Debug Tracking Requirements Section

````markdown
## Debug Tracking Requirements

**CRITICAL:** While implementing this feature, ensure the debug tracker system has comprehensive tracing:

### 1. Tracer Integration

```typescript
import { traced, tracedLoop } from '../debug/tracer/index.js';

// Wrap main transformation function
export const transformFeatureName = traced(
  'transformer',
  function (node: FeatureNode) {
    // Implementation here
  },
  {
    extractPertinent: (args, result) => ({
      // Extract relevant properties for tracing
      nodeType: args[0].type,
      propertyCount: args[0].properties?.length || 0,
      isReactive: result.isReactive,
      outputType: result.type,
    }),
  }
);

// Wrap loops that process collections
export function processFeatureItems(items: FeatureItem[]) {
  return tracedLoop(
    'transformer',
    items,
    (item, index) => {
      // Process each item
      return transformItem(item);
    },
    {
      extractPertinent: (item) => ({
        itemType: item.type,
        itemId: item.id,
        position: item.location,
      }),
    }
  );
}
```
````

### 2. Logger Integration

```typescript
import { createLogger } from '../debug/logger.js';

const logger = createLogger({
  enabled: context.debug,
  level: 'debug',
  channels: ['transform', 'jsx'], // Add relevant channels
});

export function transformFeature(node: FeatureNode, context: TransformContext) {
  logger.debug('transform', `Transforming ${node.type} node`);
  logger.time('feature-transform');

  try {
    // Perform transformation
    const result = performTransformation(node, context);

    logger.info('transform', '✅ Transformation successful', {
      inputType: node.type,
      outputType: result.type,
      isReactive: result.isReactive,
      dependencyCount: result.dependencies.length,
    });

    return result;
  } catch (error) {
    logger.error('transform', '❌ Transformation failed', {
      nodeType: node.type,
      location: node.location,
      error: error.message,
    });
    throw error;
  } finally {
    logger.timeEnd('feature-transform');
  }
}
```

### 3. Transformation Step Tracking

```typescript
// Define step tracking interface (if not already in context)
interface ITransformStep {
  id: string;
  phase: 'detect' | 'classify' | 'generate' | 'wrap';
  timestamp: number;
  duration: number;
  input: {
    nodeType: string;
    code: string;
    location: { line: number; column: number };
  };
  output: {
    nodeType: string;
    code: string;
  };
  metadata: {
    reactive: boolean;
    dependencies: string[];
    generated: string[];
  };
}

// Track each transformation step
function trackTransformStep(
  context: TransformContext,
  step: Omit<ITransformStep, 'id' | 'timestamp' | 'duration'>
) {
  const startTime = performance.now();

  const fullStep: ITransformStep = {
    ...step,
    id: generateStepId(),
    timestamp: Date.now(),
    duration: 0, // Will be set when complete
  };

  context.steps.push(fullStep);

  if (context.debug) {
    logger.trace('transform', `📍 Step ${fullStep.id}`, {
      phase: fullStep.phase,
      input: fullStep.input.nodeType,
      output: fullStep.output.nodeType,
    });
  }

  return {
    complete: () => {
      fullStep.duration = performance.now() - startTime;
    },
  };
}

// Usage in transformation
export function transformFeature(node: FeatureNode, context: TransformContext) {
  const step = trackTransformStep(context, {
    phase: 'transform',
    input: {
      nodeType: node.type,
      code: getNodeCode(node),
      location: node.location,
    },
    output: {
      nodeType: 'TransformedFeature',
      code: '', // Will be filled
    },
    metadata: {
      reactive: isReactive(node),
      dependencies: extractDependencies(node),
      generated: [],
    },
  });

  try {
    const result = performTransformation(node);
    step.complete();
    return result;
  } catch (error) {
    step.complete();
    throw error;
  }
}
```

### 4. Diagnostic Collection

```typescript
// Diagnostic interface
interface ITransformDiagnostic {
  phase: 'parse' | 'analyze' | 'transform' | 'emit';
  type: 'error' | 'warning' | 'info';
  message: string;
  code: string; // e.g., 'PSR-T001', 'PSR-T002'
  location: {
    file: string;
    line: number;
    column: number;
  };
  suggestions?: string[];
}

// Collect diagnostics during transformation
export function analyzeFeatureNode(node: FeatureNode, context: TransformContext) {
  // Check for potential issues
  if (hasPotentialPerformanceIssue(node)) {
    context.diagnostics.push({
      phase: 'transform',
      type: 'warning',
      message: 'Feature pattern may cause performance degradation',
      code: 'PSR-T-PERF-001',
      location: {
        file: context.sourceFile,
        line: node.location.line,
        column: node.location.column,
      },
      suggestions: [
        'Consider using memoization',
        'Extract static computations',
        'Review reactive dependency tracking',
      ],
    });
  }

  // Check for missing required properties
  if (!node.requiredProperty) {
    context.diagnostics.push({
      phase: 'transform',
      type: 'error',
      message: 'Required property missing',
      code: 'PSR-T-ERR-001',
      location: {
        file: context.sourceFile,
        line: node.location.line,
        column: node.location.column,
      },
      suggestions: ['Add the required property', 'Use default value'],
    });
  }

  // Collect info for complex transformations
  if (isComplexTransformation(node)) {
    context.diagnostics.push({
      phase: 'transform',
      type: 'info',
      message: 'Complex transformation detected',
      code: 'PSR-T-INFO-001',
      location: {
        file: context.sourceFile,
        line: node.location.line,
        column: node.location.column,
      },
    });
  }
}
```

### 5. Environment Variable Configuration

The debug system respects the following environment variables:

```bash
# Enable tracing
PULSAR_TRACE=1

# Enable specific channels (comma-separated)
PULSAR_TRACE_CHANNELS=lexer,parser,transformer,semantic,codegen

# Set trace window size (number of events to keep)
PULSAR_TRACE_WINDOW=1000

# Enable HTTP tracing (send to remote endpoint)
PULSAR_TRACE_HTTP=http://localhost:3000/traces
```

### 6. Testing Debug Output

Each feature implementation must include tests that verify debug output:

```typescript
describe('Feature Debug Tracking', () => {
  it('should emit trace events during transformation', () => {
    const tracer = getTracerManager();
    const events: TraceEvent[] = [];

    tracer.subscribe('transformer', (event) => {
      events.push(event);
    });

    transformFeature(testNode, context);

    expect(events.length).toBeGreaterThan(0);
    expect(events[0].type).toBe('function:start');
    expect(events[events.length - 1].type).toBe('function:end');
  });

  it('should log transformation steps', () => {
    const logger = createLogger({ enabled: true, level: 'debug', channels: ['transform'] });
    const logs: string[] = [];

    // Capture logs
    const originalLog = console.log;
    console.log = (...args) => logs.push(args.join(' '));

    transformFeature(testNode, { ...context, debug: true });

    console.log = originalLog;

    expect(logs.some((log) => log.includes('Transforming'))).toBe(true);
    expect(logs.some((log) => log.includes('✅'))).toBe(true);
  });

  it('should collect diagnostics', () => {
    const context = createTransformContext();

    transformFeatureWithIssues(problematicNode, context);

    expect(context.diagnostics.length).toBeGreaterThan(0);
    expect(context.diagnostics[0].type).toBe('warning');
    expect(context.diagnostics[0].code).toMatch(/^PSR-T/);
  });

  it('should track transformation steps', () => {
    const context = createTransformContext();

    transformFeature(testNode, context);

    expect(context.steps.length).toBeGreaterThan(0);
    expect(context.steps[0].phase).toBeDefined();
    expect(context.steps[0].duration).toBeGreaterThan(0);
  });
});
```

````

---

## Feature-Specific Customizations

When applying this template to specific features, customize:

### 1. Node Type Names
- Replace `FeatureNode` with actual node type (e.g., `TemplateLiteralNode`, `ShowComponentNode`)
- Replace `FeatureItem` with actual item type

### 2. Channel Names
- Use appropriate channels: `lexer`, `parser`, `semantic`, `transformer`, `codegen`, `jsx`
- Add feature-specific channels if needed

### 3. Diagnostic Codes
- Follow pattern: `PSR-{PHASE}-{TYPE}-{NUMBER}`
  - PHASE: `T` (Transform), `P` (Parse), `A` (Analyze), `E` (Emit)
  - TYPE: `ERR` (Error), `WARN` (Warning), `INFO` (Info), `PERF` (Performance)
  - NUMBER: Sequential (001, 002, etc.)

### 4. Extract Pertinent Data
- Focus on properties that help understand transformation behavior
- Keep data concise (avoid large objects)
- Include reactive/static classification
- Include dependency information

---

## Validation Checklist

After adding debug tracking to a feature, verify:

- [ ] All main transformation functions wrapped with `@traced` decorator
- [ ] All loops use `tracedLoop` helper
- [ ] Logger statements at entry/exit of major functions
- [ ] Logger time tracking for performance measurement
- [ ] Diagnostic collection for warnings and errors
- [ ] Transformation steps tracked with metadata
- [ ] Tests verify debug output is generated
- [ ] Environment variables documented
- [ ] Diagnostic codes follow naming convention
- [ ] No sensitive data logged

---

## Files That Need Updates

### ✅ Completed (4 files):
1. template-literals
2. show-components
3. for-iteration
4. complex-jsx-expressions

### ⏳ Remaining (32 files):
5. generic-type-arguments
6. type-inference-system
7. dynamic-components
8. waiting-suspense
9. create-resource
10. resource-state-handling
11. resource-refetch-patterns
12. resource-dependency-tracking
13. resource-loading-states
14. resource-mutations
15. resource-parallel-fetching
16. resource-pre-resolution
17. tryer-error-boundaries
18. catcher-error-handlers
19. error-propagation-recovery
20. nested-boundary-coordination
21. lazy-dynamic-imports
22. lazy-component-wrappers
23. preload-strategies
24. code-splitting-transformation
25. portal-transformation
26. portal-target-resolution
27. portal-cleanup-handling
28. portal-context-preservation
29. create-context-providers
30. use-context-consumption
31. context-value-propagation
32. context-optimization
33. batch-updates
34. untrack-execution
35. defer-computation
36. static-dynamic-optimization
37. server-side-rendering
38. hydration-markers
39. client-server-detection

---

## Bulk Update Script

To systematically update all remaining files, use this approach:

```powershell
# PowerShell script to add debug tracking section
$files = @(
    "generic-type-arguments",
    "type-inference-system",
    # ... etc (all remaining files)
)

foreach ($feature in $files) {
    $path = "docs/implementation-plans/$feature/2026-02-11-14-20-$feature.md"

    # Read file
    $content = Get-Content $path -Raw

    # Find insertion point (before ## Test Requirements)
    $insertPoint = $content.IndexOf("## Test Requirements")

    if ($insertPoint -gt 0) {
        # Insert debug tracking section
        $before = $content.Substring(0, $insertPoint)
        $after = $content.Substring($insertPoint)

        $debugSection = Get-Content "DEBUG-TRACKING-TEMPLATE.md" -Raw

        $newContent = $before + $debugSection + "`n`n" + $after

        Set-Content $path -Value $newContent

        Write-Host "✅ Updated: $feature"
    } else {
        Write-Host "❌ Failed: $feature (couldn't find insertion point)"
    }
}
````

---

**Last Updated:** 2026-02-11  
**Maintainer:** Tadeo Piana  
**Status:** Template complete, bulk update pending
