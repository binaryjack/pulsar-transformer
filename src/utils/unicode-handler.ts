/**
 * Unicode Handler - Based on React Compiler Patterns
 *
 * Handles unicode escape patterns in JSX attributes and text content.
 * Prevents Babel generator bugs with non-ASCII characters.
 *
 * @see https://github.com/facebook/react/blob/main/compiler/packages/babel-plugin-react-compiler/src/ReactiveScopes/CodegenReactiveFunction.ts#L2329-L2345
 */

/**
 * Pattern for detecting strings that require special handling.
 *
 * Matches:
 * - C0 control codes: U+0000 to U+001F
 * - Delete character: U+007F
 * - C1 control codes: U+0080 to U+009F
 * - Non-basic Latin: U+00A0 to U+FFFF
 * - Astral plane: U+010000 to U+10FFFF
 * - Quote characters: " and \
 *
 * @see https://en.wikipedia.org/wiki/List_of_Unicode_characters#Control_codes
 * @see https://mathiasbynens.be/notes/javascript-unicode
 */
export const UNICODE_REQUIRES_ESCAPE =
  /[\u0000-\u001F\u007F\u0080-\u009F\u00A0-\uFFFF]|[\u{010000}-\u{10FFFF}]|"|\\/u;

/**
 * Simplified pattern for quick checks (no unicode flag needed)
 */
export const UNICODE_REQUIRES_ESCAPE_SIMPLE = /[\u0000-\u001F\u007F-\u009F\u00A0-\uFFFF]|["\\]/;

/**
 * Check if a string contains characters that need special handling
 *
 * @param str - String to check
 * @returns true if string contains special characters
 *
 * @example
 * ```ts
 * needsUnicodeEscape("hello") // false
 * needsUnicodeEscape("தமிழ்") // true
 * needsUnicodeEscape("hello\nworld") // true (contains \n)
 * needsUnicodeEscape("emoji 😀") // true (astral plane)
 * ```
 */
export function needsUnicodeEscape(str: string): boolean {
  // Quick check with simple pattern first
  if (UNICODE_REQUIRES_ESCAPE_SIMPLE.test(str)) {
    return true;
  }

  // Check for astral plane characters (requires unicode flag)
  try {
    return UNICODE_REQUIRES_ESCAPE.test(str);
  } catch {
    // Fallback if unicode flag not supported
    return containsAstralPlane(str);
  }
}

/**
 * Check if string contains astral plane characters (U+010000 to U+10FFFF)
 *
 * @param str - String to check
 * @returns true if contains astral plane characters
 */
function containsAstralPlane(str: string): boolean {
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    // High surrogate (0xD800-0xDBFF) indicates astral plane
    if (code >= 0xd800 && code <= 0xdbff) {
      return true;
    }
  }
  return false;
}

/**
 * Escape unicode characters in a string for use in JSX attributes
 *
 * Escapes control characters, high unicode, and special characters.
 * Preserves readable ASCII characters.
 *
 * @param str - String to escape
 * @returns Escaped string
 *
 * @example
 * ```ts
 * escapeUnicode("hello\nworld") // "hello\\u000aworld"
 * escapeUnicode("தமிழ்") // "\\u0ba4\\u0bae\\u0bbf\\u0bb4\\u0bcd"
 * escapeUnicode("emoji 😀") // "emoji \\ud83d\\ude00"
 * ```
 */
export function escapeUnicode(str: string): string {
  let result = '';

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const code = str.charCodeAt(i);

    // Escape control characters
    if (code >= 0x00 && code <= 0x1f) {
      result += `\\u${code.toString(16).padStart(4, '0')}`;
      continue;
    }

    // Escape DELETE and C1 control codes
    if (code === 0x7f || (code >= 0x80 && code <= 0x9f)) {
      result += `\\u${code.toString(16).padStart(4, '0')}`;
      continue;
    }

    // Escape high unicode (non-basic Latin)
    if (code >= 0xa0 && code <= 0xffff) {
      result += `\\u${code.toString(16).padStart(4, '0')}`;
      continue;
    }

    // Handle surrogate pairs (astral plane)
    if (code >= 0xd800 && code <= 0xdbff) {
      const highSurrogate = code;
      const lowSurrogate = str.charCodeAt(++i);

      result += `\\u${highSurrogate.toString(16).padStart(4, '0')}`;
      result += `\\u${lowSurrogate.toString(16).padStart(4, '0')}`;
      continue;
    }

    // Escape backslash and quotes
    if (char === '\\') {
      result += '\\\\';
      continue;
    }

    if (char === '"') {
      result += '\\"';
      continue;
    }

    // Keep normal ASCII
    result += char;
  }

  return result;
}

/**
 * Unescape unicode sequences in a string
 *
 * Converts `\uXXXX` sequences back to unicode characters.
 *
 * @param str - String with escaped unicode
 * @returns Unescaped string
 *
 * @example
 * ```ts
 * unescapeUnicode("\\u0ba4\\u0bae\\u0bbf\\u0bb4\\u0bcd") // "தமிழ்"
 * unescapeUnicode("hello\\u000aworld") // "hello\nworld"
 * ```
 */
export function unescapeUnicode(str: string): string {
  return str.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
}

/**
 * Normalize unicode string to NFC form
 *
 * @param str - String to normalize
 * @returns Normalized string
 *
 * @example
 * ```ts
 * normalizeUnicode("café") // "café" (composed form)
 * ```
 */
export function normalizeUnicode(str: string): string {
  return str.normalize('NFC');
}

/**
 * Check if a string is valid UTF-8
 *
 * @param str - String to validate
 * @returns true if valid UTF-8
 */
export function isValidUnicode(str: string): boolean {
  try {
    // Try to encode and decode - will throw if invalid
    const encoder = new TextEncoder();
    const decoder = new TextDecoder('utf-8', { fatal: true });
    const bytes = encoder.encode(str);
    decoder.decode(bytes);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get unicode code point at index (handles surrogate pairs)
 *
 * @param str - String
 * @param index - Character index
 * @returns Code point value
 *
 * @example
 * ```ts
 * getCodePoint("😀", 0) // 0x1F600
 * getCodePoint("A", 0) // 0x41
 * ```
 */
export function getCodePoint(str: string, index: number): number {
  const code = str.charCodeAt(index);

  // Check if high surrogate
  if (code >= 0xd800 && code <= 0xdbff && index + 1 < str.length) {
    const high = code;
    const low = str.charCodeAt(index + 1);

    if (low >= 0xdc00 && low <= 0xdfff) {
      // Calculate code point from surrogate pair
      return (high - 0xd800) * 0x400 + (low - 0xdc00) + 0x10000;
    }
  }

  return code;
}

/**
 * Convert code point to string (handles astral plane)
 *
 * @param codePoint - Unicode code point
 * @returns String representation
 *
 * @example
 * ```ts
 * fromCodePoint(0x1F600) // "😀"
 * fromCodePoint(0x41) // "A"
 * ```
 */
export function fromCodePoint(codePoint: number): string {
  if (codePoint <= 0xffff) {
    return String.fromCharCode(codePoint);
  }

  // Convert to surrogate pair
  const high = Math.floor((codePoint - 0x10000) / 0x400) + 0xd800;
  const low = ((codePoint - 0x10000) % 0x400) + 0xdc00;

  return String.fromCharCode(high, low);
}

/**
 * Count grapheme clusters (user-perceived characters)
 *
 * Correctly counts emoji, combining characters, etc.
 *
 * @param str - String to count
 * @returns Number of grapheme clusters
 *
 * @example
 * ```ts
 * graphemeLength("hello") // 5
 * graphemeLength("👨‍👩‍👧‍👦") // 1 (family emoji)
 * graphemeLength("नमस्ते") // 4 (Hindi greeting)
 * ```
 */
export function graphemeLength(str: string): number {
  // Use Intl.Segmenter if available (modern browsers)
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new (Intl as any).Segmenter('en', { granularity: 'grapheme' });
    return Array.from(segmenter.segment(str)).length;
  }

  // Fallback: count code points (not perfect but better than .length)
  let count = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    // Skip low surrogates (counted with high surrogate)
    if (code >= 0xdc00 && code <= 0xdfff) {
      continue;
    }
    count++;
  }

  return count;
}

/**
 * Type guard for unicode handler results
 */
export interface UnicodeHandlerResult {
  original: string;
  escaped: string;
  needsEscape: boolean;
  codePoints: number[];
  graphemeCount: number;
}

/**
 * Analyze unicode string and return detailed info
 *
 * @param str - String to analyze
 * @returns Detailed unicode analysis
 *
 * @example
 * ```ts
 * const result = analyzeUnicode("தமிழ்");
 * // {
 * //   original: "தமிழ்",
 * //   escaped: "\\u0ba4\\u0bae\\u0bbf\\u0bb4\\u0bcd",
 * //   needsEscape: true,
 * //   codePoints: [2980, 2990, 2991, 2996, 3021],
 * //   graphemeCount: 4
 * // }
 * ```
 */
export function analyzeUnicode(str: string): UnicodeHandlerResult {
  const codePoints: number[] = [];

  for (let i = 0; i < str.length; i++) {
    const cp = getCodePoint(str, i);
    codePoints.push(cp);

    // Skip next char if we consumed a surrogate pair
    if (cp > 0xffff) {
      i++;
    }
  }

  return {
    original: str,
    escaped: escapeUnicode(str),
    needsEscape: needsUnicodeEscape(str),
    codePoints,
    graphemeCount: graphemeLength(str),
  };
}
