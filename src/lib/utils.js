/**
 * Utility functions for string manipulation and sanitization.
 */

/**
 * Removes zero-width/invisible Unicode characters from a string.
 * These characters can cause unexpected rendering or parsing issues.
 * @param {string} str The input string.
 * @returns {string} The sanitized string.
 */
export const removeInvisibleChars = (str) => {
  // Unicode ranges for zero-width space, zero-width non-joiner, zero-width joiner, and byte order mark
  return str.replace(/[\u200B-\u200D\uFEFF]/g, "");
};

/**
 * Removes all non-ASCII characters from a string.
 * Use with caution, as this will strip all international characters.
 * @param {string} str The input string.
 * @returns {string} The sanitized string.
 */
export const removeNonAsciiChars = (str) => {
  // Corrected regex to explicitly match non-ASCII characters
  return str.replace(/[^\x00-\x7F]/g, "");
};