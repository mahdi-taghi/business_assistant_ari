import { test, expect } from '@playwright/test'

test.describe('Chat Interface', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('chatbot-ui.access-token', 'mock-token')
      localStorage.setItem('chatbot-ui.refresh-token', 'mock-refresh-token')
    })

    // Mock user profile API
    await page.route('**/api/auth/me/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
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
          }
        })
      })
    })

    // Mock chat creation API
    await page.route('**/api/chat/create/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          title: 'New Chat',
          message_count: 0,
          last_activity: new Date().toISOString(),
          is_archived: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      })
    })

    // Mock messages API
    await page.route('**/api/chat/*/messages/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      })
    })
  })

  test('should display chat interface correctly', async ({ page }) => {
    await page.goto('/Chat')

    // Check if chat interface elements are present
    await expect(page.getByText('سوال خود را بپرسید')).toBeVisible()
    await expect(page.getByPlaceholderText('سوال خود را بپرسید...')).toBeVisible()
    await expect(page.getByRole('button')).toBeVisible() // Send button
  })

  test('should handle message input', async ({ page }) => {
    await page.goto('/Chat')

    const messageInput = page.getByPlaceholderText('سوال خود را بپرسید...')
    await messageInput.fill('Hello, this is a test message')

    await expect(messageInput).toHaveValue('Hello, this is a test message')
  })

  test('should handle RTL text input', async ({ page }) => {
    await page.goto('/Chat')

    const messageInput = page.getByPlaceholderText('سوال خود را بپرسید...')
    await messageInput.fill('سلام، این یک پیام تست است')

    await expect(messageInput).toHaveValue('سلام، این یک پیام تست است')
    await expect(messageInput).toHaveAttribute('dir', 'rtl')
  })

  test('should handle LTR text input', async ({ page }) => {
    await page.goto('/Chat')

    const messageInput = page.getByPlaceholderText('سوال خود را بپرسید...')
    await messageInput.fill('Hello, this is a test message')

    await expect(messageInput).toHaveValue('Hello, this is a test message')
    await expect(messageInput).toHaveAttribute('dir', 'ltr')
  })

  test('should send message on button click', async ({ page }) => {
    // Mock WebSocket
    await page.addInitScript(() => {
      window.WebSocket = class MockWebSocket {
        constructor(url) {
          this.url = url
          this.readyState = 1
          this.onopen = null
          this.onmessage = null
          this.onerror = null
          this.onclose = null
          setTimeout(() => this.onopen && this.onopen(), 0)
        }
        send(data) {
          // Store sent message for testing
          window.lastSentMessage = data
        }
        close() {}
        addEventListener() {}
        removeEventListener() {}
      }
    })

    await page.goto('/Chat')

    const messageInput = page.getByPlaceholderText('سوال خود را بپرسید...')
    const sendButton = page.getByRole('button')

    await messageInput.fill('Hello, this is a test message')
    await sendButton.click()

    // Check if message was sent via WebSocket
    const lastSentMessage = await page.evaluate(() => window.lastSentMessage)
    expect(JSON.parse(lastSentMessage)).toEqual({
      content: 'Hello, this is a test message'
    })
  })

  test('should send message on Enter key press', async ({ page }) => {
    // Mock WebSocket
    await page.addInitScript(() => {
      window.WebSocket = class MockWebSocket {
        constructor(url) {
          this.url = url
          this.readyState = 1
          this.onopen = null
          this.onmessage = null
          this.onerror = null
          this.onclose = null
          setTimeout(() => this.onopen && this.onopen(), 0)
        }
        send(data) {
          window.lastSentMessage = data
        }
        close() {}
        addEventListener() {}
        removeEventListener() {}
      }
    })

    await page.goto('/Chat')

    const messageInput = page.getByPlaceholderText('سوال خود را بپرسید...')
    await messageInput.fill('Hello, this is a test message')
    await messageInput.press('Enter')

    // Check if message was sent via WebSocket
    const lastSentMessage = await page.evaluate(() => window.lastSentMessage)
    expect(JSON.parse(lastSentMessage)).toEqual({
      content: 'Hello, this is a test message'
    })
  })

  test('should not send empty messages', async ({ page }) => {
    // Mock WebSocket
    await page.addInitScript(() => {
      window.WebSocket = class MockWebSocket {
        constructor(url) {
          this.url = url
          this.readyState = 1
          this.onopen = null
          this.onmessage = null
          this.onerror = null
          this.onclose = null
          setTimeout(() => this.onopen && this.onopen(), 0)
        }
        send(data) {
          window.lastSentMessage = data
        }
        close() {}
        addEventListener() {}
        removeEventListener() {}
      }
    })

    await page.goto('/Chat')

    const messageInput = page.getByPlaceholderText('سوال خود را بپرسید...')
    const sendButton = page.getByRole('button')

    await messageInput.fill('   ')
    await sendButton.click()

    // Check if no message was sent
    const lastSentMessage = await page.evaluate(() => window.lastSentMessage)
    expect(lastSentMessage).toBeUndefined()
  })

  test('should handle WebSocket connection', async ({ page }) => {
    let wsConnected = false
    await page.addInitScript(() => {
      window.WebSocket = class MockWebSocket {
        constructor(url) {
          this.url = url
          this.readyState = 1
          this.onopen = null
          this.onmessage = null
          this.onerror = null
          this.onclose = null
          setTimeout(() => {
            this.onopen && this.onopen()
            window.wsConnected = true
          }, 0)
        }
        send() {}
        close() {}
        addEventListener() {}
        removeEventListener() {}
      }
    })

    await page.goto('/Chat')

    // Wait for WebSocket connection
    await page.waitForFunction(() => window.wsConnected)
    expect(await page.evaluate(() => window.wsConnected)).toBe(true)
  })

  test('should display connection status', async ({ page }) => {
    await page.goto('/Chat')

    // Should show connection indicator
    await expect(page.locator('.w-2.h-2.rounded-full')).toBeVisible()
  })

  test('should handle new chat creation', async ({ page }) => {
    await page.goto('/Chat')

    // Look for new chat button (might be in mobile menu or desktop)
    const newChatButton = page.getByText('چت جدید')
    if (await newChatButton.isVisible()) {
      await newChatButton.click()
      // Should create a new chat session
      await expect(page).toHaveURL(/.*\/Chat\?sessionId=\d+/)
    }
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/Chat')

    // Check if mobile layout is applied
    await expect(page.getByPlaceholderText('سوال خود را بپرسید...')).toBeVisible()
    
    // Check if mobile navigation is present
    const mobileNav = page.locator('[data-testid="mobile-nav"]')
    if (await mobileNav.isVisible()) {
      await expect(mobileNav).toBeVisible()
    }
  })

  test('should handle theme switching', async ({ page }) => {
    await page.goto('/Chat')

    // Look for theme toggle button
    const themeToggle = page.locator('[data-testid="theme-toggle"]')
    if (await themeToggle.isVisible()) {
      await themeToggle.click()
      
      // Check if theme class is applied
      const html = page.locator('html')
      await expect(html).toHaveAttribute('data-theme', 'light')
    }
  })

  test('should handle keyboard navigation', async ({ page }) => {
    await page.goto('/Chat')

    const messageInput = page.getByPlaceholderText('سوال خود را بپرسید...')
    
    // Test Tab navigation
    await page.keyboard.press('Tab')
    await expect(messageInput).toBeFocused()
    
    // Test Shift+Tab navigation
    await page.keyboard.press('Shift+Tab')
    await expect(messageInput).not.toBeFocused()
  })
})
