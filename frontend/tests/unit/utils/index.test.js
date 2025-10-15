/**
 * Utility Functions Tests
 * 
 * این فایل تست‌های توابع utility را شامل می‌شود
 * 
 * تست‌های موجود:
 * - createPageUrl: تولید URL صفحات
 * - isAdminUser: تشخیص کاربر ادمین
 * - parseMaybeJson: تجزیه JSON با مدیریت خطا
 * - formatTime: فرمت‌بندی زمان
 * - cn: ترکیب نام کلاس‌ها
 */

import {
  createPageUrl,
  isAdminUser,
  parseMaybeJson,
  formatTime,
  cn
} from '@/utils/index'

// Mock user data for testing
const mockUser = {
  id: 1,
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  full_name: 'Test User',
  is_active: true,
  is_superuser: false,
  roles: {
    is_admin: false,
    is_superuser: false,
    is_staff: false,
  },
  security: {
    email_verified: true,
  },
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
}

const mockAdminUser = {
  ...mockUser,
  is_superuser: true,
  roles: {
    is_admin: true,
    is_superuser: true,
    is_staff: true,
  },
}

describe('Utility Functions - توابع کمکی', () => {
  describe('createPageUrl - تولید URL صفحه', () => {
    it('should return root path for empty input - باید مسیر ریشه را برای ورودی خالی برگرداند', () => {
      expect(createPageUrl('')).toBe('/')
      expect(createPageUrl(null)).toBe('/')
      expect(createPageUrl(undefined)).toBe('/')
    })

    it('should return path with leading slash for page names - باید مسیر با اسلش ابتدایی برای نام صفحات برگرداند', () => {
      expect(createPageUrl('Chat')).toBe('/Chat')
      expect(createPageUrl('Profile')).toBe('/Profile')
      expect(createPageUrl('Admin')).toBe('/Admin')
    })

    it('should return path as-is when it already starts with slash - باید مسیر را همان‌طور که هست برگرداند وقتی با اسلش شروع می‌شود', () => {
      expect(createPageUrl('/Chat')).toBe('/Chat')
      expect(createPageUrl('/Profile?tab=settings')).toBe('/Profile?tab=settings')
    })

    it('should return full URL as-is for http/https URLs - باید URL کامل را برای http/https همان‌طور که هست برگرداند', () => {
      expect(createPageUrl('http://example.com')).toBe('http://example.com')
      expect(createPageUrl('https://example.com/path')).toBe('https://example.com/path')
    })

    it('should handle complex paths with query parameters - باید مسیرهای پیچیده با پارامترهای query را مدیریت کند', () => {
      expect(createPageUrl('Chat?sessionId=123')).toBe('/Chat?sessionId=123')
      expect(createPageUrl('Profile?tab=settings&mode=edit')).toBe('/Profile?tab=settings&mode=edit')
    })
  })

  describe('isAdminUser - تشخیص کاربر ادمین', () => {
    it('should return false for null or undefined user - باید false برگرداند برای کاربر null یا undefined', () => {
      expect(isAdminUser(null)).toBe(false)
      expect(isAdminUser(undefined)).toBe(false)
    })

    it('should return false for regular user - باید false برگرداند برای کاربر عادی', () => {
      expect(isAdminUser(mockUser)).toBe(false)
    })

    it('should return true for admin user - باید true برگرداند برای کاربر ادمین', () => {
      expect(isAdminUser(mockAdminUser)).toBe(true)
    })

    it('should check various admin fields - باید فیلدهای مختلف ادمین را بررسی کند', () => {
      const userWithRoles = {
        roles: {
          is_superuser: true,
          is_admin: false,
          is_staff: false
        }
      }
      expect(isAdminUser(userWithRoles)).toBe(true)

      const userWithDirectFields = {
        is_superuser: true,
        is_admin: false,
        is_staff: false
      }
      expect(isAdminUser(userWithDirectFields)).toBe(true)

      const userWithRoleString = {
        role: 'admin'
      }
      expect(isAdminUser(userWithRoleString)).toBe(true)

      const userWithUserType = {
        user_type: 'superuser'
      }
      expect(isAdminUser(userWithUserType)).toBe(true)

      const userWithPermissions = {
        permissions: {
          admin: true
        }
      }
      expect(isAdminUser(userWithPermissions)).toBe(true)
    })

    it('should return false when no admin fields are true - باید false برگرداند وقتی هیچ فیلد ادمینی true نیست', () => {
      const regularUser = {
        roles: {
          is_superuser: false,
          is_admin: false,
          is_staff: false
        },
        is_superuser: false,
        is_admin: false,
        is_staff: false,
        role: 'user',
        user_type: 'regular',
        permissions: {
          admin: false
        }
      }
      expect(isAdminUser(regularUser)).toBe(false)
    })
  })

  describe('parseMaybeJson - تجزیه JSON با مدیریت خطا', () => {
    it('should return fallback for null or undefined - باید fallback برگرداند برای null یا undefined', () => {
      expect(parseMaybeJson(null, 'fallback')).toBe('fallback')
      expect(parseMaybeJson(undefined, 'fallback')).toBe('fallback')
      expect(parseMaybeJson('', 'fallback')).toBe('fallback')
    })

    it('should return object as-is when already an object - باید object را همان‌طور که هست برگرداند وقتی از قبل object است', () => {
      const obj = { key: 'value' }
      expect(parseMaybeJson(obj, 'fallback')).toBe(obj)
    })

    it('should parse valid JSON strings - باید رشته‌های JSON معتبر را تجزیه کند', () => {
      const jsonString = '{"key": "value", "number": 123}'
      const expected = { key: 'value', number: 123 }
      expect(parseMaybeJson(jsonString, 'fallback')).toEqual(expected)
    })

    it('should return fallback for invalid JSON - باید fallback برگرداند برای JSON نامعتبر', () => {
      const invalidJson = '{key: value}'
      expect(parseMaybeJson(invalidJson, 'fallback')).toBe('fallback')
    })

    it('should handle empty JSON objects and arrays - باید object ها و array های JSON خالی را مدیریت کند', () => {
      expect(parseMaybeJson('{}', 'fallback')).toEqual({})
      expect(parseMaybeJson('[]', 'fallback')).toEqual([])
    })
  })

  describe('formatTime - فرمت‌بندی زمان', () => {
    it('should format ISO timestamp correctly - باید timestamp ISO را درست فرمت کند', () => {
      const isoString = '2023-01-01T14:30:00Z'
      const formatted = formatTime(isoString)
      expect(formatted).toMatch(/\d{2}:\d{2}/)
    })

    it('should return empty string for invalid date - باید رشته خالی برگرداند برای تاریخ نامعتبر', () => {
      expect(formatTime('invalid-date')).toBe('')
      expect(formatTime(null)).toBe('')
      expect(formatTime(undefined)).toBe('')
    })

    it('should handle different date formats - باید فرمت‌های مختلف تاریخ را مدیریت کند', () => {
      const date1 = '2023-01-01T14:30:00.000Z'
      const date2 = '2023-01-01T14:30:00+00:00'
      
      expect(formatTime(date1)).toMatch(/\d{2}:\d{2}/)
      expect(formatTime(date2)).toMatch(/\d{2}:\d{2}/)
    })
  })

  describe('cn (class name utility) - ابزار نام کلاس', () => {
    it('should join non-empty class names - باید نام کلاس‌های غیرخالی را ترکیب کند', () => {
      expect(cn('class1', 'class2', 'class3')).toBe('class1 class2 class3')
    })

    it('should filter out falsy values - باید مقادیر falsy را فیلتر کند', () => {
      expect(cn('class1', null, 'class2', undefined, 'class3', false, 'class4')).toBe('class1 class2 class3 class4')
    })

    it('should handle empty strings - باید رشته‌های خالی را مدیریت کند', () => {
      expect(cn('class1', '', 'class2')).toBe('class1 class2')
    })

    it('should return empty string for all falsy values - باید رشته خالی برگرداند برای همه مقادیر falsy', () => {
      expect(cn(null, undefined, false, '')).toBe('')
    })

    it('should handle single class name - باید نام کلاس تکی را مدیریت کند', () => {
      expect(cn('single-class')).toBe('single-class')
    })

    it('should handle no arguments - باید عدم وجود آرگومان را مدیریت کند', () => {
      expect(cn()).toBe('')
    })
  })
})