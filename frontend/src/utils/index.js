/**
 * Lightweight helper used by pages to build page URLs.
 * Accepts values like "Chat" or "Chat?sessionId=..." and returns a path starting with '/'.
 * @param {string} pageOrPath - Page name or path
 * @returns {string} Normalized URL path
 */
export function createPageUrl(pageOrPath) {
  if (!pageOrPath) return '/';
  
  // If it's already a full path or URL, return as-is when starts with '/'
  if (typeof pageOrPath === 'string') {
    if (pageOrPath.startsWith('/')) return pageOrPath;
    // If it's a full URL (http(s)), return as-is
    if (pageOrPath.startsWith('http://') || pageOrPath.startsWith('https://')) return pageOrPath;
    // Otherwise, ensure leading slash
    return `/${pageOrPath}`;
  }
  
  // Fallback
  return '/';
}

import { detectTextDirection } from "./textDirection";

export { detectTextDirection };

export default { createPageUrl, detectTextDirection };
