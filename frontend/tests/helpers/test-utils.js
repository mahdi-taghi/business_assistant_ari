/**
 * Test Utilities and Helpers
 * 
 * این فایل شامل ابزارها و helper های مورد نیاز برای تست‌ها است
 */

import React from 'react'
import { render } from '@testing-library/react'

// ============================================================================
// MOCK DATA - داده‌های شبیه‌سازی شده برای تست‌ها
// ============================================================================

/**
 * Mock User Data - داده‌های شبیه‌سازی شده کاربر عادی
 * برای تست‌های مربوط به کاربران معمولی استفاده می‌شود
 */
export const mockUser = {
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

/**
 * Mock Admin User Data - داده‌های شبیه‌سازی شده کاربر ادمین
 * برای تست‌های مربوط به دسترسی‌های ادمین استفاده می‌شود
 */
export const mockAdminUser = {
  ...mockUser,
  is_superuser: true,
  roles: {
    is_admin: true,
    is_superuser: true,
    is_staff: true,
  },
}

/**
 * Mock Chat Data - داده‌های شبیه‌سازی شده چت
 * برای تست‌های مربوط به جلسات چت استفاده می‌شود
 */
export const mockChat = {
  id: 1,
  title: 'Test Chat',
  message_count: 5,
  last_activity: '2023-01-01T12:00:00Z',
  is_archived: false,
  created_at: '2023-01-01T10:00:00Z',
  updated_at: '2023-01-01T12:00:00Z',
}

/**
 * Mock User Message - پیام شبیه‌سازی شده کاربر
 * برای تست‌های مربوط به پیام‌های ارسالی کاربر استفاده می‌شود
 */
export const mockUserMessage = {
  id: 1,
  role: 'user',
  content: 'Hello, this is a test message',
  timestamp: '2023-01-01T12:00:00Z',
  created_at: '2023-01-01T12:00:00Z',
  ai_response_metadata: null,
  ai_references: [],
  tokens_used: null,
  response_time: null,
}

/**
 * Mock AI Message - پیام شبیه‌سازی شده هوش مصنوعی
 * برای تست‌های مربوط به پاسخ‌های AI استفاده می‌شود
 */
export const mockAIMessage = {
  id: 2,
  role: 'assistant',
  content: 'Hello! How can I help you today?',
  timestamp: '2023-01-01T12:01:00Z',
  created_at: '2023-01-01T12:01:00Z',
  ai_response_metadata: {
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
  },
  ai_references: [],
  tokens_used: 25,
  response_time: 1.2,
}

/**
 * Mock System Message - پیام شبیه‌سازی شده سیستم
 * برای تست‌های مربوط به پیام‌های سیستم استفاده می‌شود
 */
export const mockSystemMessage = {
  id: 3,
  role: 'system',
  content: 'System notification message',
  timestamp: '2023-01-01T12:02:00Z',
  created_at: '2023-01-01T12:02:00Z',
}

// ============================================================================
// API MOCKS - شبیه‌سازی‌های API
// ============================================================================

/**
 * Mock API Success Response - پاسخ موفقیت‌آمیز API
 */
export const mockApiSuccess = {
  ok: true,
  data: { success: true },
  status: 200,
}

/**
 * Mock API Error Response - پاسخ خطای API
 */
export const mockApiError = {
  ok: false,
  data: { error: 'Something went wrong' },
  status: 400,
}

// ============================================================================
// RENDER HELPERS - ابزارهای رندر برای تست‌ها
// ============================================================================

/**
 * Custom Render Function - تابع رندر سفارشی
 * 
 * این تابع یک wrapper ساده برای render function است که می‌تواند
 * در آینده با providers مختلف گسترش یابد
 * 
 * @param {React.ReactElement} ui - کامپوننت React برای رندر
 * @param {Object} options - گزینه‌های اضافی برای رندر
 * @returns {Object} نتیجه رندر با تمام ابزارهای testing-library
 */
export const customRender = (ui, options = {}) => {
  return render(ui, options)
}

// ============================================================================
// UTILITY FUNCTIONS - توابع کمکی
// ============================================================================

/**
 * Wait For Helper - کمک‌رسان انتظار
 * 
 * این تابع برای انتظار تا زمانی که شرط خاصی برقرار شود استفاده می‌شود
 * 
 * @param {Function} callback - تابعی که شرط را بررسی می‌کند
 * @param {Object} options - گزینه‌های timeout و interval
 * @returns {Promise} Promise که resolve می‌شود وقتی شرط برقرار شود
 */
export const waitForCondition = (callback, options = {}) => {
  return new Promise((resolve, reject) => {
    const timeout = options.timeout || 5000
    const interval = options.interval || 50
    const startTime = Date.now()

    const check = () => {
      try {
        const result = callback()
        if (result) {
          resolve(result)
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Timeout waiting for condition'))
        } else {
          setTimeout(check, interval)
        }
      } catch (error) {
        if (Date.now() - startTime > timeout) {
          reject(error)
        } else {
          setTimeout(check, interval)
        }
      }
    }

    check()
  })
}

/**
 * Create Mock Event - ایجاد رویداد شبیه‌سازی شده
 * 
 * این تابع برای ایجاد رویدادهای شبیه‌سازی شده در تست‌ها استفاده می‌شود
 * 
 * @param {string} type - نوع رویداد
 * @param {Object} properties - ویژگی‌های اضافی رویداد
 * @returns {Object} رویداد شبیه‌سازی شده
 */
export const createMockEvent = (type, properties = {}) => {
  return {
    type,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    target: {
      value: '',
      ...properties,
    },
    ...properties,
  }
}

// ============================================================================
// RE-EXPORTS - صادرات مجدد
// ============================================================================

// صادرات مجدد تمام ابزارهای testing-library
export * from '@testing-library/react'
export { customRender as render }