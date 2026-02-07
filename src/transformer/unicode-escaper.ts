/**
 * Unicode Escaper
 *
 * Escapes unicode characters in string literals for safe JavaScript output.
 */

/**
 * Check if a string needs unicode escaping
 */
export function needsUnicodeEscape(str: string): boolean {
  // Check for characters outside ASCII printable range (32-126)
  // Also check for control characters and special unicode
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    // Keep printable ASCII and common whitespace (tab, newline, carriage return)
    if (code < 32 || code > 126) {
      // Allow common escape sequences
      if (code === 9 || code === 10 || code === 13) continue;
      return true;
    }
  }
  return false;
}

/**
 * Escape unicode characters to \uXXXX format
 */
export function escapeUnicode(str: string): string {
  let result = '';

  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);

    // Keep printable ASCII characters
    if (code >= 32 && code <= 126) {
      const char = str.charAt(i);
      // Escape special JavaScript characters
      if (char === '\\') {
        result += '\\\\';
      } else if (char === '"') {
        result += '\\"';
      } else if (char === "'") {
        result += "\\'";
      } else {
        result += char;
      }
    }
    // Common escape sequences
    else if (code === 9) {
      result += '\\t';
    } else if (code === 10) {
      result += '\\n';
    } else if (code === 13) {
      result += '\\r';
    }
    // Unicode escape for everything else
    else {
      // Handle surrogate pairs for emoji
      if (code >= 0xd800 && code <= 0xdbff) {
        // High surrogate
        const high = code;
        const low = str.charCodeAt(i + 1);
        if (low >= 0xdc00 && low <= 0xdfff) {
          // Valid surrogate pair
          result += `\\u${high.toString(16).toUpperCase().padStart(4, '0')}`;
          result += `\\u${low.toString(16).toUpperCase().padStart(4, '0')}`;
          i++; // Skip next character (low surrogate)
          continue;
        }
      }

      // Regular unicode escape
      result += `\\u${code.toString(16).toUpperCase().padStart(4, '0')}`;
    }
  }

  return result;
}

/**
 * Escape unicode in a JavaScript string literal (with quotes)
 */
export function escapeStringLiteral(value: string): string {
  if (!needsUnicodeEscape(value)) {
    // No unicode, just ensure quotes are escaped
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }

  // Escape unicode and wrap in quotes
  return `"${escapeUnicode(value)}"`;
}
