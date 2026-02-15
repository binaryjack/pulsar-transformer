/**
 * Edge Case Registry
 * Documents known limitations, unsupported patterns, and ambiguous cases
 */

export enum EdgeCaseType {
  Unsupported = 'unsupported',
  Ambiguous = 'ambiguous',
  Deprecated = 'deprecated',
  Limitation = 'limitation',
  Performance = 'performance'
}

export interface EdgeCase {
  type: EdgeCaseType;
  pattern: string;
  description: string;
  reason: string;
  workaround?: string;
  example?: string;
  issue?: string; // GitHub issue link
  severity: 'high' | 'medium' | 'low';
}

export const KNOWN_EDGE_CASES: EdgeCase[] = [
  // Unsupported features
  {
    type: EdgeCaseType.Unsupported,
    pattern: 'Unicode identifiers',
    description: 'Non-ASCII characters in identifiers (\\u{1F600}, café)',
    reason: 'Unicode identifier parser not yet implemented',
    workaround: 'Use only ASCII characters in identifiers for now',
    example: 'const café = 1; // ❌ Error\nconst cafe = 1; // ✅ Works',
    severity: 'medium'
  },
  {
    type: EdgeCaseType.Unsupported,
    pattern: 'Unicode escape sequences',
    description: 'ES6+ Unicode escapes (\\u{1F600})',
    reason: 'Complex Unicode escape parser not implemented',
    workaround: 'Use traditional Unicode escapes \\uXXXX or literal characters',
    example: '"\\u{1F600}" // ❌ Error\n"\\uD83D\\uDE00" // ✅ Works\n"😀" // ✅ Works',
    severity: 'low'
  },
  {
    type: EdgeCaseType.Unsupported,
    pattern: 'Private fields',
    description: 'Class private fields (#field)',
    reason: 'Private field syntax not in lexer token set',
    workaround: 'Use traditional private conventions (_field)',
    example: 'class A { #private; } // ❌ Error\nclass A { _private; } // ✅ Works',
    severity: 'high'
  },
  {
    type: EdgeCaseType.Unsupported,
    pattern: 'Decorators',
    description: 'TypeScript/ES decorators (@decorator)',
    reason: 'Decorator syntax not supported in PSR',
    workaround: 'Use function calls or higher-order patterns',
    example: '@component class A {} // ❌ Error\nconst A = component(class {}) // ✅ Works',
    severity: 'medium'
  },
  
  // Deprecated syntax
  {
    type: EdgeCaseType.Deprecated,
    pattern: 'Octal literals',
    description: 'Legacy octal syntax (0777)',
    reason: 'Deprecated in ES5+, confusing with leading zero',
    workaround: 'Use ES6 octal syntax (0o777)',
    example: 'const x = 0777; // ⚠️ Deprecated\nconst x = 0o777; // ✅ Modern',
    severity: 'low'
  },
  {
    type: EdgeCaseType.Deprecated,
    pattern: 'Function declarations in blocks',
    description: 'function inside if/for blocks',
    reason: 'Non-standard behavior, use let/const + arrow functions',
    workaround: 'Declare functions at scope level or use const fn = () => {}',
    example: 'if (true) { function f() {} } // ⚠️ Avoid\nif (true) { const f = () => {} } // ✅ Better',
    severity: 'medium'
  },
  
  // Ambiguous patterns
  {
    type: EdgeCaseType.Ambiguous,
    pattern: 'Regex vs division',
    description: 'a/b/g could be (a/b)/g or a/b/g regex',
    reason: 'Context-dependent parsing challenges',
    workaround: 'Use clear parentheses or line breaks',
    example: 'const x = a/b/g; // Ambiguous\nconst x = (a/b)/g; // Clear division\nconst x = /b/g; // Clear regex',
    severity: 'low'
  },
  {
    type: EdgeCaseType.Ambiguous,
    pattern: 'JSX vs comparison',
    description: 'a < b > c could be JSX or comparison chain',
    reason: 'JSX state detection may misinterpret comparison operators',
    workaround: 'Use parentheses for complex comparisons',
    example: 'if (a < Component > c) // Ambiguous\nif ((a < Component) > c) // Clear',
    severity: 'medium'
  },
  {
    type: EdgeCaseType.Ambiguous,
    pattern: 'Comment spacing',
    description: 'a/*comment*/b vs a/* comment */b',
    reason: 'Whitespace handling around comments varies',
    workaround: 'Use consistent spacing around comments',
    example: 'a/**/b // Minimal\na /* */ b // Spaced',
    severity: 'low'
  },
  
  // Limitations
  {
    type: EdgeCaseType.Limitation,
    pattern: 'Deep JSX nesting',
    description: 'JSX nesting > 50 levels',
    reason: 'jsxDepth tracking has practical performance limits',
    workaround: 'Refactor deeply nested components into smaller pieces',
    example: '<A><B><C>...</C></B></A> // Consider: <A><SubComponent /></A>',
    severity: 'low'
  },
  {
    type: EdgeCaseType.Limitation,
    pattern: 'Very large numbers',
    description: 'Numbers > Number.MAX_SAFE_INTEGER',
    reason: 'JavaScript number precision limits',
    workaround: 'Use BigInt for very large integers (123n)',
    example: 'const big = 9007199254740992; // ⚠️ Precision loss\nconst big = 9007199254740992n; // ✅ BigInt',
    severity: 'medium'
  },
  {
    type: EdgeCaseType.Limitation,
    pattern: 'Template literal depth',
    description: 'Nested template expressions > 20 levels',
    reason: 'Template depth tracking performance considerations',
    workaround: 'Extract complex expressions to variables',
    example: '`${a ? `${b ? `${c}` : d}` : e}` // Complex\nconst inner = b ? c : d;\n`${a ? inner : e}` // Cleaner',
    severity: 'low'
  },
  
  // Performance considerations
  {
    type: EdgeCaseType.Performance,
    pattern: 'Very long strings',
    description: 'String literals > 10KB',
    reason: 'Large string processing may impact performance',
    workaround: 'Consider external files or chunking for very large content',
    example: 'const huge = "...10KB of text..."; // Consider external file',
    severity: 'low'
  },
  {
    type: EdgeCaseType.Performance,
    pattern: 'Many template literals',
    description: '> 1000 template literals in single file',
    reason: 'Template depth tracking overhead',
    workaround: 'Consider code generation or bundling strategies',
    example: 'Many `template${expr}` expressions // Consider batching',
    severity: 'low'
  }
];

/**
 * Check if a pattern matches any known edge case
 */
export function checkEdgeCase(pattern: string): EdgeCase[] {
  return KNOWN_EDGE_CASES.filter(ec => {
    // Simple string matching first
    if (pattern.toLowerCase().includes(ec.pattern.toLowerCase())) {
      return true;
    }
    
    // Pattern-specific matching
    try {
      switch (ec.pattern) {
        case 'Unicode identifiers':
          return /[^\x00-\x7F]/.test(pattern) && /[^\x00-\x7F]\w*/.test(pattern);
        case 'Unicode escape sequences':
          return /\\u\{[0-9A-Fa-f]+\}/.test(pattern);
        case 'Private fields':
          return /#\w+/.test(pattern);
        case 'Decorators':
          return /@\w+/.test(pattern);
        case 'Octal literals':
          return /\b0[0-7]+\b/.test(pattern) && !/\b0o[0-7]+\b/.test(pattern);
        case 'Regex vs division':
          return /\/.*\/[gimsuvy]*/.test(pattern) && pattern.includes('/') && !pattern.startsWith('/');
        case 'Deep JSX nesting':
          // Count < and > pairs
          const opens = (pattern.match(/</g) || []).length;
          const closes = (pattern.match(/>/g) || []).length;
          return opens > 20 && closes > 20;
        case 'Very large numbers':
          const numbers = pattern.match(/\b\d{16,}\b/);
          return numbers ? numbers.some(n => parseInt(n) > Number.MAX_SAFE_INTEGER) : false;
        default:
          return false;
      }
    } catch {
      return false;
    }
  });
}

/**
 * Check if character/context represents known unsupported feature
 */
export function isKnownUnsupported(char: string, context: string = ''): EdgeCase | undefined {
  const fullPattern = context + char;
  
  // Check specific unsupported patterns
  if (char === '#' && context.includes('class')) {
    return KNOWN_EDGE_CASES.find(ec => ec.pattern === 'Private fields');
  }
  
  if (char === '@' && /^\s*@\w/.test(context + char)) {
    return KNOWN_EDGE_CASES.find(ec => ec.pattern === 'Decorators');
  }
  
  if (/[^\x00-\x7F]/.test(char) && /\w/.test(context)) {
    return KNOWN_EDGE_CASES.find(ec => ec.pattern === 'Unicode identifiers');
  }
  
  return undefined;
}

/**
 * Suggest alternative for deprecated/problematic pattern
 */
export function suggestAlternative(pattern: string): string | undefined {
  const matches = checkEdgeCase(pattern);
  
  if (matches.length === 0) return undefined;
  
  // Return the most relevant workaround
  const highPriority = matches.find(m => m.severity === 'high');
  if (highPriority?.workaround) return highPriority.workaround;
  
  const mediumPriority = matches.find(m => m.severity === 'medium');
  if (mediumPriority?.workaround) return mediumPriority.workaround;
  
  return matches[0]?.workaround;
}

/**
 * Get all edge cases by type
 */
export function getEdgeCasesByType(type: EdgeCaseType): EdgeCase[] {
  return KNOWN_EDGE_CASES.filter(ec => ec.type === type);
}

/**
 * Get all high-severity edge cases
 */
export function getCriticalEdgeCases(): EdgeCase[] {
  return KNOWN_EDGE_CASES.filter(ec => ec.severity === 'high');
}

/**
 * Format edge case for display
 */
export function formatEdgeCase(edgeCase: EdgeCase): string {
  const lines = [
    `${edgeCase.type.toUpperCase()}: ${edgeCase.pattern}`,
    `  ${edgeCase.description}`,
    `  Reason: ${edgeCase.reason}`
  ];
  
  if (edgeCase.workaround) {
    lines.push(`  Workaround: ${edgeCase.workaround}`);
  }
  
  if (edgeCase.example) {
    lines.push(`  Example: ${edgeCase.example}`);
  }
  
  return lines.join('\n');
}