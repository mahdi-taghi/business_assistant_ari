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

/**
 * Checks if a user has admin privileges
 * @param {Object} user - User object
 * @returns {boolean} True if user is admin
 */
export function isAdminUser(user) {
  if (!user) return false;
  
  // Check various possible admin fields
  const adminFields = [
    user.roles?.is_superuser,
    user.roles?.is_admin,
    user.roles?.is_staff,
    user.is_superuser,
    user.is_admin,
    user.is_staff,
    user.roles?.admin,
    user.roles?.superuser,
    user.roles?.staff,
    user.admin,
    user.superuser,
    user.staff,
    user.role === 'admin',
    user.role === 'superuser',
    user.role === 'staff',
    user.user_type === 'admin',
    user.user_type === 'superuser',
    user.user_type === 'staff',
    user.permissions?.admin,
    user.permissions?.superuser,
    user.permissions?.staff
  ];
  
  return adminFields.some(field => field === true);
}

/**
 * Safely parses JSON string, returns fallback on error
 * @param {any} value - Value to parse
 * @param {any} fallback - Fallback value
 * @returns {any} Parsed value or fallback
 */
export function parseMaybeJson(value, fallback) {
  if (!value) return fallback;
  if (typeof value === "object") return value;
  
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

/**
 * Formats ISO timestamp to HH:mm format
 * @param {string} iso - ISO timestamp string
 * @returns {string} Formatted time string
 */
export function formatTime(iso) {
  if (!iso) {
    return '';
  }
  
  try {
    const date = new Date(iso);
    if (isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    return '';
  }
}

import { detectTextDirection } from "./textDirection";

/**
 * Utility function to merge class names
 * @param {...(string|undefined|null|boolean)} classes - Class names to merge
 * @returns {string} Merged class names
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export { detectTextDirection };

export default { 
  createPageUrl, 
  detectTextDirection, 
  isAdminUser, 
  parseMaybeJson, 
  formatTime,
  cn
};
