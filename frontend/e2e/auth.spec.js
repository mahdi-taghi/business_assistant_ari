import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('/auth/login')
  })

  test('should display login form correctly', async ({ page }) => {
    // Check if login form elements are present
    await expect(page.getByText('ورود')).toBeVisible()
    await expect(page.getByLabelText('ایمیل')).toBeVisible()
    await expect(page.getByLabelText('رمز عبور')).toBeVisible()
    await expect(page.getByRole('button', { name: /ورود/i })).toBeVisible()
  })

  test('should show welcome message and description', async ({ page }) => {
    await expect(page.getByText('خوش آمدید')).toBeVisible()
    await expect(page.getByText(/دستیار هوشمند آری/)).toBeVisible()
    await expect(page.getByText(/وارد شوید تا تجربه دستیار هوشمند/)).toBeVisible()
  })

  test('should handle form input', async ({ page }) => {
    const emailInput = page.getByLabelText('ایمیل')
    const passwordInput = page.getByLabelText('رمز عبور')

    await emailInput.fill('test@example.com')
    await passwordInput.fill('password123')

    await expect(emailInput).toHaveValue('test@example.com')
    await expect(passwordInput).toHaveValue('password123')
  })

  test('should show error for invalid credentials', async ({ page }) => {
    // Mock API response for invalid credentials
    await page.route('**/api/auth/login/', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'اطلاعات ورود نادرست است'
        })
      })
    })

    const emailInput = page.getByLabelText('ایمیل')
    const passwordInput = page.getByLabelText('رمز عبور')
    const submitButton = page.getByRole('button', { name: /ورود/i })

    await emailInput.fill('invalid@example.com')
    await passwordInput.fill('wrongpassword')
    await submitButton.click()

    await expect(page.getByText('اطلاعات ورود نادرست است')).toBeVisible()
  })

  test('should redirect to chat page on successful login', async ({ page }) => {
    // Mock API response for successful login
    await page.route('**/api/auth/login/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access: 'mock-access-token',
          refresh: 'mock-refresh-token'
        })
      })
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

    const emailInput = page.getByLabelText('ایمیل')
    const passwordInput = page.getByLabelText('رمز عبور')
    const submitButton = page.getByRole('button', { name: /ورود/i })

    await emailInput.fill('test@example.com')
    await passwordInput.fill('password123')
    await submitButton.click()

    // Should redirect to chat page
    await expect(page).toHaveURL(/.*\/Chat/)
  })

  test('should have link to registration page', async ({ page }) => {
    const registerLink = page.getByText('حساب کاربری بسازید')
    await expect(registerLink).toBeVisible()
    await expect(registerLink).toHaveAttribute('href', '/auth/register')
  })

  test('should handle form validation', async ({ page }) => {
    const emailInput = page.getByLabelText('ایمیل')
    const passwordInput = page.getByLabelText('رمز عبور')

    // Check required attributes
    await expect(emailInput).toHaveAttribute('required')
    await expect(passwordInput).toHaveAttribute('required')
    await expect(emailInput).toHaveAttribute('type', 'email')
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network error
    await page.route('**/api/auth/login/', async route => {
      await route.abort('failed')
    })

    const emailInput = page.getByLabelText('ایمیل')
    const passwordInput = page.getByLabelText('رمز عبور')
    const submitButton = page.getByRole('button', { name: /ورود/i })

    await emailInput.fill('test@example.com')
    await passwordInput.fill('password123')
    await submitButton.click()

    await expect(page.getByText('خطا در ورود. لطفاً دوباره تلاش کنید.')).toBeVisible()
  })

  test('should show loading state during form submission', async ({ page }) => {
    // Mock delayed API response
    await page.route('**/api/auth/login/', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access: 'mock-access-token',
          refresh: 'mock-refresh-token'
        })
      })
    })

    const emailInput = page.getByLabelText('ایمیل')
    const passwordInput = page.getByLabelText('رمز عبور')
    const submitButton = page.getByRole('button', { name: /ورود/i })

    await emailInput.fill('test@example.com')
    await passwordInput.fill('password123')
    await submitButton.click()

    // Should show loading state
    await expect(page.getByText('در حال ورود...')).toBeVisible()
    await expect(submitButton).toBeDisabled()
  })
})
