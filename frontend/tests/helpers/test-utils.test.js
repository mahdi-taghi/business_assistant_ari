/**
 * Test Utils Tests
 * 
 * این فایل تست‌های ابزارهای تست را شامل می‌شود
 * 
 * تست‌های موجود:
 * - تست render function
 * - تست mock data
 * - تست utility functions
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { 
  customRender, 
  mockUser, 
  mockAdminUser, 
  mockChat, 
  mockUserMessage, 
  mockAIMessage,
  mockSystemMessage,
  waitForCondition,
  createMockEvent
} from './test-utils'

// Simple test component
const TestComponent = () => <div>Test Component</div>

describe('Test Utils - ابزارهای تست', () => {
  describe('Custom Render Function - تابع رندر سفارشی', () => {
    it('should render component with custom render function - باید کامپوننت را با تابع رندر سفارشی رندر کند', () => {
      customRender(<TestComponent />)
      expect(screen.getByText('Test Component')).toBeInTheDocument()
    })

    it('should have basic testing setup - باید setup تست پایه داشته باشد', () => {
      expect(true).toBe(true)
    })
  })

  describe('Mock Data - داده‌های شبیه‌سازی شده', () => {
    it('should provide mock user data - باید داده‌های شبیه‌سازی شده کاربر را فراهم کند', () => {
      expect(mockUser).toBeDefined()
      expect(mockUser.email).toBe('test@example.com')
      expect(mockUser.first_name).toBe('Test')
      expect(mockUser.is_superuser).toBe(false)
    })

    it('should provide mock admin user data - باید داده‌های شبیه‌سازی شده کاربر ادمین را فراهم کند', () => {
      expect(mockAdminUser).toBeDefined()
      expect(mockAdminUser.email).toBe('test@example.com')
      expect(mockAdminUser.is_superuser).toBe(true)
      expect(mockAdminUser.roles.is_admin).toBe(true)
    })

    it('should provide mock chat data - باید داده‌های شبیه‌سازی شده چت را فراهم کند', () => {
      expect(mockChat).toBeDefined()
      expect(mockChat.id).toBe(1)
      expect(mockChat.title).toBe('Test Chat')
      expect(mockChat.message_count).toBe(5)
    })

    it('should provide mock user message - باید پیام شبیه‌سازی شده کاربر را فراهم کند', () => {
      expect(mockUserMessage).toBeDefined()
      expect(mockUserMessage.role).toBe('user')
      expect(mockUserMessage.content).toBe('Hello, this is a test message')
    })

    it('should provide mock AI message - باید پیام شبیه‌سازی شده AI را فراهم کند', () => {
      expect(mockAIMessage).toBeDefined()
      expect(mockAIMessage.role).toBe('assistant')
      expect(mockAIMessage.content).toBe('Hello! How can I help you today?')
      expect(mockAIMessage.ai_response_metadata).toBeDefined()
    })

    it('should provide mock system message - باید پیام شبیه‌سازی شده سیستم را فراهم کند', () => {
      expect(mockSystemMessage).toBeDefined()
      expect(mockSystemMessage.role).toBe('system')
      expect(mockSystemMessage.content).toBe('System notification message')
    })
  })

  describe('Utility Functions - توابع کمکی', () => {
    it('should create mock events - باید رویدادهای شبیه‌سازی شده ایجاد کند', () => {
      const mockEvent = createMockEvent('click', { target: { value: 'test' } })
      
      expect(mockEvent.type).toBe('click')
      expect(mockEvent.target.value).toBe('test')
      expect(mockEvent.preventDefault).toBeDefined()
      expect(mockEvent.stopPropagation).toBeDefined()
    })

    it('should wait for conditions - باید برای شرایط انتظار بکشد', async () => {
      let condition = false
      setTimeout(() => { condition = true }, 100)
      
      await expect(waitForCondition(() => condition, { timeout: 1000 })).resolves.toBe(true)
    })

    it('should timeout when condition is not met - باید timeout کند وقتی شرط برقرار نمی‌شود', async () => {
      await expect(waitForCondition(() => false, { timeout: 100 })).rejects.toThrow('Timeout waiting for condition')
    })
  })
})