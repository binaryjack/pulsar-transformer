/**
 * Transformer Edge Cases - Registry of known limitations and edge cases
 * Similar to lexer edge cases but for AST transformation scenarios
 */

export interface ITransformerEdgeCase {
  id: string;
  code?: string;
  category: 'component' | 'jsx' | 'import' | 'expression' | 'typescript' | 'performance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  example: {
    input: string;
    expectedOutput: string;
    actualOutput?: string;
  };
  workaround?: string;
  plannedFix?: string;
  testCases?: string[];
  relatedIssues?: string[];
}

/**
 * Registry of known transformer edge cases and limitations
 */
export const TRANSFORMER_EDGE_CASES: Record<string, ITransformerEdgeCase> = {
  // Component transformation edge cases
  COMPONENT_NESTED_ARROW_FUNCTIONS: {
    id: 'COMPONENT_NESTED_ARROW_FUNCTIONS',
    category: 'component',
    severity: 'medium',
    description: 'Nested arrow functions in component body may lose scope binding',
    example: {
      input: `export component Counter() {
  const handlers = {
    onClick: (e) => {
      const nested = (id) => console.log(id);
      nested(e.target.id);
    }
  };
  return <button onClick={handlers.onClick}>Click</button>;
}`,
      expectedOutput: 'Properly scoped arrow functions with preserved this binding',
      actualOutput: 'May lose lexical scoping in nested contexts',
    },
    workaround: 'Use function declarations instead of arrow functions for nested callbacks',
    plannedFix: 'Enhanced scope analysis in transformation phase',
  },

  COMPONENT_ASYNC_PATTERNS: {
    id: 'COMPONENT_ASYNC_PATTERNS',
    category: 'component',
    severity: 'high',
    description: 'Async/await patterns in component declarations not fully supported',
    example: {
      input: `export component AsyncCounter() {
  const loadData = async () => {
    const data = await fetch('/api/data');
    return data.json();
  };
  return <div>{loadData()}</div>;
}`,
      expectedOutput: 'Properly transformed async component with promise handling',
      actualOutput: 'May not preserve async context correctly',
    },
    workaround: 'Use useEffect with async functions inside',
    plannedFix: 'Add async transformation support',
  },

  // JSX transformation edge cases
  JSX_COMPLEX_EXPRESSIONS: {
    id: 'JSX_COMPLEX_EXPRESSIONS',
    category: 'jsx',
    severity: 'medium',
    description: 'Complex JavaScript expressions in JSX attributes may not transform correctly',
    example: {
      input: '<div className={cn("base", { active: isActive && !isDisabled })} />',
      expectedOutput:
        't_element("div", { className: cn("base", { active: isActive && !isDisabled }) }, [])',
      actualOutput: 'May not preserve complex object expressions in attributes',
    },
    workaround: 'Extract complex expressions to variables before JSX',
    plannedFix: 'Enhanced expression parsing for JSX attributes',
  },

  JSX_CONDITIONAL_RENDER: {
    id: 'JSX_CONDITIONAL_RENDER',
    category: 'jsx',
    severity: 'high',
    description: 'Conditional rendering patterns may not convert to proper t_element calls',
    example: {
      input: '{condition ? <Component /> : <OtherComponent />}',
      expectedOutput: 'condition ? t_element(Component) : t_element(OtherComponent)',
      actualOutput: 'May leave JSX unconverted in conditional expressions',
    },
    workaround: 'Use explicit if/else statements instead of ternary in JSX',
    plannedFix: 'Add conditional expression transformation',
  },

  // Import management edge cases
  IMPORT_CIRCULAR_DEPENDENCIES: {
    id: 'IMPORT_CIRCULAR_DEPENDENCIES',
    category: 'import',
    severity: 'critical',
    description: 'Circular import dependencies can cause transformation failures',
    example: {
      input: 'Component A imports B, Component B imports A',
      expectedOutput: 'Proper dependency resolution without cycles',
      actualOutput: 'May cause infinite loops or missing imports',
    },
    workaround: 'Refactor to remove circular dependencies',
    plannedFix: 'Add circular dependency detection and resolution',
  },

  IMPORT_NAMESPACE_CONFLICTS: {
    id: 'IMPORT_NAMESPACE_CONFLICTS',
    category: 'import',
    severity: 'medium',
    description: 'Framework imports may conflict with existing user imports',
    example: {
      input: 'User has own $REGISTRY implementation, transformer injects framework $REGISTRY',
      expectedOutput: 'Proper namespace resolution without conflicts',
      actualOutput: 'May cause naming conflicts',
    },
    workaround: 'Use unique names for user implementations',
    plannedFix: 'Add import namespace analysis and conflict resolution',
  },

  // TypeScript edge cases
  TYPESCRIPT_GENERIC_COMPONENTS: {
    id: 'TYPESCRIPT_GENERIC_COMPONENTS',
    category: 'typescript',
    severity: 'high',
    description: 'Generic type parameters in component declarations not preserved',
    example: {
      input: 'export component List<T>({ items }: { items: T[] }) { ... }',
      expectedOutput: 'Preserved generic constraints in transformed output',
      actualOutput: 'Generic type information may be lost',
    },
    workaround: 'Avoid generic components, use explicit types',
    plannedFix: 'Add generic type preservation in transformation',
  },

  TYPESCRIPT_COMPLEX_TYPES: {
    id: 'TYPESCRIPT_COMPLEX_TYPES',
    category: 'typescript',
    severity: 'medium',
    description: 'Complex union and intersection types may not be preserved correctly',
    example: {
      input: 'type ComplexType = (A & B) | (C & D); function comp(props: ComplexType) {}',
      expectedOutput: 'Preserved complex type definitions',
      actualOutput: 'May simplify or lose complex type information',
    },
    workaround: 'Use simpler type definitions where possible',
    plannedFix: 'Enhanced TypeScript AST preservation',
  },

  // Performance edge cases
  PERFORMANCE_LARGE_AST: {
    id: 'PERFORMANCE_LARGE_AST',
    category: 'performance',
    severity: 'medium',
    description: 'Large AST trees may cause performance degradation',
    example: {
      input: 'Component with deeply nested JSX (>100 levels) or very large files (>10MB)',
      expectedOutput: 'Consistent performance regardless of AST size',
      actualOutput: 'May experience exponential slowdown with AST size',
    },
    workaround: 'Break large components into smaller ones',
    plannedFix: 'Optimize AST traversal algorithms',
  },

  PERFORMANCE_MEMORY_USAGE: {
    id: 'PERFORMANCE_MEMORY_USAGE',
    category: 'performance',
    severity: 'low',
    description: 'Memory usage grows with transformation complexity',
    example: {
      input: 'Multiple large components in single file',
      expectedOutput: 'Bounded memory usage',
      actualOutput: 'Memory usage may grow unbounded',
    },
    workaround: 'Process files individually rather than in batches',
    plannedFix: 'Add memory usage optimization and garbage collection',
  },
};

/**
 * Edge case detector for transformer
 */
export class TransformerEdgeCaseDetector {
  private detectedCases: Set<string> = new Set();

  /**
   * Check if AST node represents known edge case
   */
  checkNode(node: any): string[] {
    const detectedEdgeCases: string[] = [];

    if (!node) return detectedEdgeCases;

    // Check for nested arrow functions
    if (this.hasNestedArrowFunctions(node)) {
      detectedEdgeCases.push('COMPONENT_NESTED_ARROW_FUNCTIONS');
    }

    // Check for async patterns
    if (this.hasAsyncPatterns(node)) {
      detectedEdgeCases.push('COMPONENT_ASYNC_PATTERNS');
    }

    // Check for complex JSX expressions
    if (this.hasComplexJSXExpressions(node)) {
      detectedEdgeCases.push('JSX_COMPLEX_EXPRESSIONS');
    }

    // Check for conditional rendering
    if (this.hasConditionalRendering(node)) {
      detectedEdgeCases.push('JSX_CONDITIONAL_RENDER');
    }

    // Check for generic components
    if (this.hasGenericComponents(node)) {
      detectedEdgeCases.push('TYPESCRIPT_GENERIC_COMPONENTS');
    }

    // Track detected cases
    detectedEdgeCases.forEach((caseId) => this.detectedCases.add(caseId));

    return detectedEdgeCases;
  }

  /**
   * Get all detected edge cases
   */
  getDetectedCases(): ITransformerEdgeCase[] {
    return Array.from(this.detectedCases)
      .map((id) => TRANSFORMER_EDGE_CASES[id])
      .filter(Boolean);
  }

  /**
   * Get all detected edge cases (alias)
   */
  getDetectedEdgeCases(): ITransformerEdgeCase[] {
    return this.getDetectedCases();
  }

  /**
   * Detect edge case for specific node and phase (alias for checkNode)
   */
  detectEdgeCase(node: any, phase: string): ITransformerEdgeCase | null {
    const caseIds = this.checkNode(node);
    if (caseIds.length === 0) return null;
    return TRANSFORMER_EDGE_CASES[caseIds[0]] || null;
  }

  /**
   * Check if case is known to be unsupported
   */
  isKnownUnsupported(input: string, nodeType?: string): boolean {
    // Quick checks for known unsupported patterns
    if (input.includes('export component') && input.includes('<T>')) {
      return true; // Generic components
    }
    if (input.includes('async') && nodeType === 'ComponentDeclaration') {
      return true; // Async components
    }
    return false;
  }

  /**
   * Get workaround for detected edge case
   */
  getWorkaround(caseId: string): string | undefined {
    return TRANSFORMER_EDGE_CASES[caseId]?.workaround;
  }

  /**
   * Clear detected cases
   */
  clear(): void {
    this.detectedCases.clear();
  }

  // Private detection methods
  private hasNestedArrowFunctions(node: any): boolean {
    if (!node || typeof node !== 'object') return false;

    // Simple heuristic: look for ArrowFunctionExpression nested in other functions
    return (
      JSON.stringify(node).includes('ArrowFunctionExpression') &&
      (node.type === 'FunctionDeclaration' || node.type === 'ArrowFunctionExpression')
    );
  }

  private hasAsyncPatterns(node: any): boolean {
    if (!node) return false;
    return node.async === true || JSON.stringify(node).includes('await');
  }

  private hasComplexJSXExpressions(node: any): boolean {
    if (!node) return false;
    const str = JSON.stringify(node);
    return (
      str.includes('JSXExpressionContainer') &&
      (str.includes('ConditionalExpression') || str.includes('LogicalExpression'))
    );
  }

  private hasConditionalRendering(node: any): boolean {
    if (!node) return false;
    const str = JSON.stringify(node);
    return str.includes('ConditionalExpression') && str.includes('JSXElement');
  }

  private hasGenericComponents(node: any): boolean {
    if (!node) return false;
    return (
      node.type === 'ComponentDeclaration' &&
      (node.typeParameters?.length > 0 || JSON.stringify(node).includes('TypeParameter'))
    );
  }
}

/**
 * Global edge case detector instance
 */
let globalEdgeCaseDetector: TransformerEdgeCaseDetector | null = null;

export function getTransformerEdgeCaseDetector(): TransformerEdgeCaseDetector {
  if (!globalEdgeCaseDetector) {
    globalEdgeCaseDetector = new TransformerEdgeCaseDetector();
  }
  return globalEdgeCaseDetector;
}

export function clearTransformerEdgeCaseDetector(): void {
  globalEdgeCaseDetector = null;
}
