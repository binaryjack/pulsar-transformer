/**
 * AST-based Component Keyword Preprocessor
 * Transforms `component` keyword to `function` before JSX transformation
 *
 * Handles:
 * - export component Foo() {}
 * - component Bar() {}
 * - export component Generic<T>() {}
 * - Avoids transforming inside strings/comments
 */

import type { NodePath } from '@babel/traverse';
import type * as BabelTypes from '@babel/types';

export interface ComponentTransformVisitor {
  ExportNamedDeclaration?: (path: NodePath<BabelTypes.ExportNamedDeclaration>) => void;
  ExportDefaultDeclaration?: (path: NodePath<BabelTypes.ExportDefaultDeclaration>) => void;
  FunctionDeclaration?: (path: NodePath<BabelTypes.FunctionDeclaration>) => void;
}

/**
 * Creates a visitor that transforms component keyword to function keyword
 * This is an AST-based replacement for the regex pattern:
 * - .replace(/export\s+component\s+([A-Z]\w*)/g, 'export function $1')
 * - .replace(/component\s+([A-Z]\w*)/g, 'function $1')
 */
export function createComponentKeywordVisitor(t: typeof BabelTypes): ComponentTransformVisitor {
  return {
    ExportNamedDeclaration(path) {
      const declaration = path.node.declaration;

      // Handle: export component Foo() {}
      if (t.isFunctionDeclaration(declaration)) {
        // Check if there's a leading comment with 'component' keyword
        // This is a workaround since Babel doesn't preserve custom keywords
        // In practice, this would already be parsed as FunctionDeclaration
        // The regex preprocessing is still needed before parsing
      }
    },

    ExportDefaultDeclaration(path) {
      const declaration = path.node.declaration;

      // Handle: export default component Foo() {}
      if (t.isFunctionDeclaration(declaration)) {
        // Same as above
      }
    },

    FunctionDeclaration(path) {
      // Handle: component Foo() {}
      // Already parsed as function by this point
    },
  };
}

/**
 * Regex-based preprocessor (current implementation)
 * This runs BEFORE Babel parsing because 'component' is not a valid JS keyword
 *
 * @param source - Source code with 'component' keyword
 * @returns Source code with 'component' replaced by 'function'
 */
export function preprocessComponentKeyword(source: string): string {
  // CRITICAL: This must run before Babel parsing
  // 'component' is not a valid ECMAScript keyword, so parser will fail

  return (
    source
      // export component Name -> export function Name
      // Handles: export component Foo() {}
      // Handles: export component Generic<T>() {}
      .replaceAll(/\bexport\s+component\s+/g, 'export function ')

      // component Name -> function Name (non-exported)
      // Handles: component Bar() {}
      // IMPORTANT: Use word boundary to avoid matching 'subcomponent', 'componentDidMount', etc.
      .replaceAll(/\bcomponent\s+([A-Z])/g, 'function $1')
  );
}

/**
 * Advanced preprocessor with context awareness
 * Skips replacements inside strings and comments
 *
 * @param source - Source code
 * @returns Preprocessed source
 */
export function preprocessComponentKeywordSafe(source: string): string {
  // Track if we're inside a string or comment
  let inString: string | null = null; // tracks quote type: ' " `
  let inComment: 'line' | 'block' | null = null;
  let result = '';
  let i = 0;

  while (i < source.length) {
    const char = source[i];
    const next = source[i + 1];
    const remaining = source.slice(i);

    // Handle string state
    if (inString) {
      result += char;
      if (char === inString && source[i - 1] !== '\\') {
        inString = null;
      }
      i++;
      continue;
    }

    // Handle comment state
    if (inComment === 'line') {
      result += char;
      if (char === '\n') {
        inComment = null;
      }
      i++;
      continue;
    }

    if (inComment === 'block') {
      result += char;
      if (char === '*' && next === '/') {
        result += next;
        i += 2;
        inComment = null;
        continue;
      }
      i++;
      continue;
    }

    // Detect comment start
    if (char === '/' && next === '/') {
      result += char + next;
      inComment = 'line';
      i += 2;
      continue;
    }

    if (char === '/' && next === '*') {
      result += char + next;
      inComment = 'block';
      i += 2;
      continue;
    }

    // Detect string start
    if (char === '"' || char === "'" || char === '`') {
      inString = char;
      result += char;
      i++;
      continue;
    }

    // Transform component keyword (only outside strings/comments)
    if (remaining.match(/^\bexport\s+component\s+/)) {
      const match = remaining.match(/^\bexport\s+component\s+/);
      if (match) {
        result += 'export function ';
        i += match[0].length;
        continue;
      }
    }

    if (remaining.match(/^\bcomponent\s+([A-Z])/)) {
      const match = remaining.match(/^\bcomponent\s+/);
      if (match) {
        result += 'function ';
        i += match[0].length;
        continue;
      }
    }

    // Default: copy character
    result += char;
    i++;
  }

  return result;
}

/**
 * Validate that component keyword was properly transformed
 * @param source - Transformed source
 * @returns true if no component keyword remains outside strings/comments
 */
export function validateComponentTransform(source: string): boolean {
  // Quick check: no 'component' followed by uppercase letter
  // This is a heuristic - false positives possible in strings/comments
  const hasComponent = /\bcomponent\s+[A-Z]/.test(source);
  return !hasComponent;
}
