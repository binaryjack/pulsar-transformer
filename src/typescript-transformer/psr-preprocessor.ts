/**
 * PSR Preprocessor - Convert PSR syntax to valid TypeScript
 * Pattern: String replacement before TypeScript parsing
 */

export interface IPSRPreprocessor {
  new (): IPSRPreprocessor;

  preprocess(source: string): string;
  convertComponentKeyword(source: string): string;
  addTypeAnnotations(source: string): string;
  preserveJSXPatterns(source: string): string;
}

/**
 * PSRPreprocessor constructor (prototype-based)
 */
export const PSRPreprocessor: IPSRPreprocessor = function (this: IPSRPreprocessor) {
  // No state needed for preprocessor
} as any;

/**
 * Main preprocessing function
 */
function preprocess(this: IPSRPreprocessor, source: string): string {
  let processedSource = source;

  // Step 1: Convert component keyword to function
  processedSource = this.convertComponentKeyword(processedSource);

  // Step 2: Add type annotations where needed
  processedSource = this.addTypeAnnotations(processedSource);

  // Step 3: Preserve JSX patterns
  processedSource = this.preserveJSXPatterns(processedSource);

  return processedSource;
}

/**
 * Convert 'component' keyword to 'function'
 */
function convertComponentKeyword(this: IPSRPreprocessor, source: string): string {
  // Pattern: export component ComponentName(params) { ... }
  // Replace with: export function ComponentName(params) { ... }

  return source.replace(/\b(export\s+)?component\s+([A-Z][a-zA-Z0-9]*)\s*\(/g, '$1function $2(');
}

/**
 * Add type annotations where needed
 */
function addTypeAnnotations(this: IPSRPreprocessor, source: string): string {
  // Add HTMLElement return type to component functions
  // Pattern: function ComponentName(params) {
  // Replace: function ComponentName(params): HTMLElement {
  return source.replace(
    /(export\s+)?function\s+([A-Z][a-zA-Z0-9]*)\s*(\([^)]*\))\s*{/g,
    '$1function $2$3: HTMLElement {'
  );
}

/**
 * Preserve JSX patterns that might confuse TypeScript
 */
function preserveJSXPatterns(this: IPSRPreprocessor, source: string): string {
  // For now, just return source as-is
  // Future: Handle complex JSX patterns
  return source;
}

// Assign prototype methods
Object.assign(PSRPreprocessor.prototype, {
  preprocess,
  convertComponentKeyword,
  addTypeAnnotations,
  preserveJSXPatterns,
});

/**
 * Create PSR preprocessor
 */
export function createPSRPreprocessor(): IPSRPreprocessor {
  return new (PSRPreprocessor as any)();
}
