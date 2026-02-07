/**
 * Decode HTML Entities
 *
 * Decodes common HTML entities in JSX text content.
 * Supports named entities and numeric character references.
 */

/**
 * Map of named HTML entities to their character equivalents
 */
const HTML_ENTITIES: Record<string, string> = {
  // Common entities
  lt: '<',
  gt: '>',
  amp: '&',
  quot: '"',
  apos: "'",
  nbsp: '\u00A0',

  // Extended entities
  copy: '©',
  reg: '®',
  trade: '™',
  euro: '€',
  pound: '£',
  yen: '¥',
  cent: '¢',
  deg: '°',
  plusmn: '±',
  times: '×',
  divide: '÷',
  frac12: '½',
  frac14: '¼',
  frac34: '¾',

  // Arrows
  larr: '←',
  uarr: '↑',
  rarr: '→',
  darr: '↓',
  harr: '↔',

  // Mathematical
  ne: '≠',
  le: '≤',
  ge: '≥',
  infin: '∞',
  sum: '∑',
  prod: '∏',
  minus: '−',
  radic: '√',
  int: '∫',

  // Greek letters (common)
  alpha: 'α',
  beta: 'β',
  gamma: 'γ',
  delta: 'δ',
  epsilon: 'ε',
  pi: 'π',
  sigma: 'σ',
  omega: 'ω',
};

/**
 * Decode HTML entities in a string
 *
 * Supports:
 * - Named entities: &lt; &gt; &amp; etc.
 * - Decimal entities: &#123;
 * - Hexadecimal entities: &#x7B; &#X7B;
 *
 * @param text - Text containing HTML entities
 * @returns Decoded text
 *
 * @example
 * decodeHTMLEntities('&lt;script&gt;') // '<script>'
 * decodeHTMLEntities('&#60;&#62;') // '<>'
 * decodeHTMLEntities('&#x3C;&#x3E;') // '<>'
 * decodeHTMLEntities('&nbsp;&nbsp;Hello') // '  Hello'
 */
export function decodeHTMLEntities(text: string): string {
  // Return early if no entities found
  if (!text.includes('&')) {
    return text;
  }

  return text.replace(/&([a-z]+|#\d+|#x[\da-fA-F]+);/gi, (match, entity) => {
    // Numeric character reference (decimal): &#123;
    if (entity.startsWith('#')) {
      if (entity.startsWith('#x') || entity.startsWith('#X')) {
        // Hexadecimal: &#x7B; or &#X7B;
        const hex = entity.slice(2);
        const code = parseInt(hex, 16);
        if (!isNaN(code) && code >= 0 && code <= 0x10ffff) {
          return String.fromCodePoint(code);
        }
      } else {
        // Decimal: &#123;
        const dec = entity.slice(1);
        const code = parseInt(dec, 10);
        if (!isNaN(code) && code >= 0 && code <= 0x10ffff) {
          return String.fromCodePoint(code);
        }
      }
    }

    // Named entity: &lt; &gt; etc.
    const lower = entity.toLowerCase();
    if (lower in HTML_ENTITIES) {
      return HTML_ENTITIES[lower]!;
    }

    // Unknown entity - return as-is
    return match;
  });
}

/**
 * Check if a string contains HTML entities
 *
 * @param text - Text to check
 * @returns True if text contains entities
 */
export function hasHTMLEntities(text: string): boolean {
  return /&([a-z]+|#\d+|#x[\da-fA-F]+);/i.test(text);
}
