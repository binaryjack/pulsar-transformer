/**
 * Character Encoding Preprocessor
 *
 * Handles BOM, invisible Unicode characters, and character encoding normalization
 * Based on industry best practices from major JavaScript frameworks.
 */

export interface ICharacterEncodingIssue {
  type: 'bom' | 'invisible-character' | 'non-ascii';
  position: number;
  line: number;
  column: number;
  character: string;
  charCode: number;
  description: string;
  suggestion: string;
}

export interface IPreprocessorResult {
  content: string;
  issues: ICharacterEncodingIssue[];
  hadBOM: boolean;
  invisibleCharsRemoved: number;
}

/**
 * Detects BOM (Byte Order Mark) at start of content
 */
export function detectBOM(content: string): boolean {
  return content.length > 0 && content.charCodeAt(0) === 0xfeff;
}

/**
 * Strips BOM from content if present
 */
export function stripBOM(content: string): string {
  if (detectBOM(content)) {
    return content.slice(1);
  }
  return content;
}

/**
 * Invisible Unicode characters that commonly cause parsing issues
 */
const INVISIBLE_CHARACTERS = new Map([
  [0x200b, 'Zero Width Space'],
  [0x200c, 'Zero Width Non-Joiner'],
  [0x200d, 'Zero Width Joiner'],
  [0x2060, 'Word Joiner'],
  [0xfeff, 'Byte Order Mark / Zero Width No-Break Space'],
  [0x00a0, 'Non-Breaking Space'],
  [0x1680, 'Ogham Space Mark'],
  [0x2000, 'En Quad'],
  [0x2001, 'Em Quad'],
  [0x2002, 'En Space'],
  [0x2003, 'Em Space'],
  [0x2004, 'Three-Per-Em Space'],
  [0x2005, 'Four-Per-Em Space'],
  [0x2006, 'Six-Per-Em Space'],
  [0x2007, 'Figure Space'],
  [0x2008, 'Punctuation Space'],
  [0x2009, 'Thin Space'],
  [0x200a, 'Hair Space'],
  [0x202f, 'Narrow No-Break Space'],
  [0x205f, 'Medium Mathematical Space'],
  [0x3000, 'Ideographic Space'],
]);

/**
 * Detects invisible characters in content and their positions
 */
export function detectInvisibleCharacters(content: string): ICharacterEncodingIssue[] {
  const issues: ICharacterEncodingIssue[] = [];
  const lines = content.split('\n');

  let absolutePosition = 0;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];

    for (let charIndex = 0; charIndex < line.length; charIndex++) {
      const char = line[charIndex];
      const charCode = line.charCodeAt(charIndex);

      if (INVISIBLE_CHARACTERS.has(charCode)) {
        const description = INVISIBLE_CHARACTERS.get(charCode)!;

        issues.push({
          type: 'invisible-character',
          position: absolutePosition + charIndex,
          line: lineIndex + 1,
          column: charIndex + 1,
          character: char,
          charCode,
          description: `Invisible character: ${description} (U+${charCode.toString(16).toUpperCase().padStart(4, '0')})`,
          suggestion: `Remove this invisible character. It may have been inserted by copying from certain editors or websites.`,
        });
      }
    }

    // Add 1 for the newline character
    absolutePosition += line.length + 1;
  }

  return issues;
}

/**
 * Removes invisible characters from content
 */
export function removeInvisibleCharacters(content: string): {
  content: string;
  removedCount: number;
} {
  let removedCount = 0;
  const invisibleCharRegex = new RegExp(
    Array.from(INVISIBLE_CHARACTERS.keys())
      .map((code) => `\\u${code.toString(16).padStart(4, '0')}`)
      .join('|'),
    'g'
  );

  const cleaned = content.replace(invisibleCharRegex, (match) => {
    removedCount++;
    return '';
  });

  return { content: cleaned, removedCount };
}

/**
 * Normalizes Unicode characters to NFC (Canonical Decomposition, followed by Canonical Composition)
 * This ensures consistent Unicode representation
 */
export function normalizeUnicode(content: string): string {
  return content.normalize('NFC');
}

/**
 * Detects non-ASCII characters that might cause issues in comments or specific contexts
 */
export function detectNonAsciiInComments(content: string): ICharacterEncodingIssue[] {
  const issues: ICharacterEncodingIssue[] = [];
  const lines = content.split('\n');

  let absolutePosition = 0;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];

    // Check for single-line comments
    const singleCommentMatch = line.match(/\/\/(.*)/);
    if (singleCommentMatch) {
      const commentContent = singleCommentMatch[1];
      const commentStart = singleCommentMatch.index! + 2; // After //

      for (let i = 0; i < commentContent.length; i++) {
        const charCode = commentContent.charCodeAt(i);
        if (charCode > 127) {
          // Non-ASCII
          const char = commentContent[i];
          issues.push({
            type: 'non-ascii',
            position: absolutePosition + commentStart + i,
            line: lineIndex + 1,
            column: commentStart + i + 1,
            character: char,
            charCode,
            description: `Non-ASCII character in comment: '${char}' (U+${charCode.toString(16).toUpperCase().padStart(4, '0')})`,
            suggestion: `Consider using ASCII alternatives or UTF-8 encoding if this character is intentional.`,
          });
        }
      }
    }

    // Add 1 for the newline character
    absolutePosition += line.length + 1;
  }

  // TODO: Add multi-line comment detection /* */ if needed

  return issues;
}

/**
 * Main preprocessing function that handles all character encoding normalization
 */
export function preprocessCharacterEncoding(content: string): IPreprocessorResult {
  let processedContent = content;
  const issues: ICharacterEncodingIssue[] = [];

  // Step 1: Detect and strip BOM
  const hadBOM = detectBOM(processedContent);
  if (hadBOM) {
    processedContent = stripBOM(processedContent);
    issues.push({
      type: 'bom',
      position: 0,
      line: 1,
      column: 1,
      character: '\uFEFF',
      charCode: 0xfeff,
      description: 'Byte Order Mark (BOM) detected at file start',
      suggestion: 'BOM has been automatically removed. Consider saving file as UTF-8 without BOM.',
    });
  }

  // Step 2: Detect invisible characters before removal
  const invisibleCharIssues = detectInvisibleCharacters(processedContent);
  issues.push(...invisibleCharIssues);

  // Step 3: Remove invisible characters
  const { content: cleanedContent, removedCount } = removeInvisibleCharacters(processedContent);
  processedContent = cleanedContent;

  // Step 4: Normalize Unicode
  processedContent = normalizeUnicode(processedContent);

  // Step 5: Detect remaining non-ASCII characters in comments
  const nonAsciiIssues = detectNonAsciiInComments(processedContent);
  issues.push(...nonAsciiIssues);

  return {
    content: processedContent,
    issues,
    hadBOM,
    invisibleCharsRemoved: removedCount,
  };
}

/**
 * Formats character encoding issues for user-friendly error messages
 */
export function formatEncodingIssues(issues: ICharacterEncodingIssue[]): string {
  if (issues.length === 0) return '';

  const lines: string[] = [];
  lines.push('\n🔍 CHARACTER ENCODING ISSUES DETECTED:');
  lines.push('═'.repeat(60));

  issues.forEach((issue, index) => {
    lines.push(`\n${index + 1}. ${issue.description}`);
    lines.push(`   Location: Line ${issue.line}, Column ${issue.column}`);
    lines.push(`   Character Code: 0x${issue.charCode.toString(16).toUpperCase()}`);
    lines.push(`   💡 Suggestion: ${issue.suggestion}`);
  });

  lines.push('\n' + '═'.repeat(60));
  lines.push('💡 TIP: These issues have been automatically fixed, but consider');
  lines.push('   checking your editor settings to prevent them in the future.');

  return lines.join('\n');
}
