/**
 * Button Component Tests
 * 
 * این فایل تست‌های کامپوننت Button را شامل می‌شود
 * 
 * تست‌های موجود:
 * - رندر با props پیش‌فرض
 * - رندر با variant های مختلف (outline, ghost, destructive, success, warning)
 * - رندر با اندازه‌های مختلف (sm, default, lg, xl)
 * - مدیریت رویدادهای کلیک
 * - حالت disabled
 * - اعمال className سفارشی
 * - ارسال props اضافی
 * - رندر children
 * - ویژگی‌های accessibility
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  describe('Basic Rendering - رندر پایه', () => {
    it('should render with default props - باید با props پیش‌فرض رندر شود', () => {
      render(<Button>Click me</Button>)
      
      const button = screen.getByRole('button', { name: /click me/i })
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('bg-gradient-to-r', 'from-blue-500', 'to-purple-500')
    })

    it('should render children correctly - باید children را درست رندر کند', () => {
      render(
        <Button>
          <span>Icon</span>
          Text
        </Button>
      )
      
      expect(screen.getByText('Icon')).toBeInTheDocument()
      expect(screen.getByText('Text')).toBeInTheDocument()
    })
  })

  describe('Variants - انواع مختلف', () => {
    it('should render outline variant - باید variant outline را رندر کند', () => {
      render(<Button variant="outline">Outline</Button>)
      expect(screen.getByRole('button')).toHaveClass('border-2', 'border-slate-300')
    })

    it('should render ghost variant - باید variant ghost را رندر کند', () => {
      render(<Button variant="ghost">Ghost</Button>)
      expect(screen.getByRole('button')).toHaveClass('text-slate-600')
    })

    it('should render destructive variant - باید variant destructive را رندر کند', () => {
      render(<Button variant="destructive">Destructive</Button>)
      expect(screen.getByRole('button')).toHaveClass('from-red-500', 'to-pink-500')
    })

    it('should render success variant - باید variant success را رندر کند', () => {
      render(<Button variant="success">Success</Button>)
      expect(screen.getByRole('button')).toHaveClass('from-green-500', 'to-emerald-500')
    })

    it('should render warning variant - باید variant warning را رندر کند', () => {
      render(<Button variant="warning">Warning</Button>)
      expect(screen.getByRole('button')).toHaveClass('from-yellow-500', 'to-orange-500')
    })
  })

  describe('Sizes - اندازه‌ها', () => {
    it('should render small size - باید اندازه کوچک را رندر کند', () => {
      render(<Button size="sm">Small</Button>)
      expect(screen.getByRole('button')).toHaveClass('px-3', 'py-1.5', 'text-sm', 'h-8')
    })

    it('should render large size - باید اندازه بزرگ را رندر کند', () => {
      render(<Button size="lg">Large</Button>)
      expect(screen.getByRole('button')).toHaveClass('px-6', 'py-3', 'text-lg', 'h-12')
    })

    it('should render extra large size - باید اندازه خیلی بزرگ را رندر کند', () => {
      render(<Button size="xl">Extra Large</Button>)
      expect(screen.getByRole('button')).toHaveClass('px-8', 'py-4', 'text-xl', 'h-14')
    })
  })

  describe('Interactions - تعاملات', () => {
    it('should handle click events - باید رویدادهای کلیک را مدیریت کند', () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>Click me</Button>)
      
      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should not call onClick when disabled - نباید onClick را فراخوانی کند وقتی disabled است', () => {
      const handleClick = jest.fn()
      render(<Button disabled onClick={handleClick}>Disabled</Button>)
      
      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('Disabled State - حالت غیرفعال', () => {
    it('should be disabled when disabled prop is true - باید غیرفعال باشد وقتی disabled true است', () => {
      render(<Button disabled>Disabled</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed')
    })
  })

  describe('Customization - سفارشی‌سازی', () => {
    it('should apply custom className - باید className سفارشی را اعمال کند', () => {
      render(<Button className="custom-class">Custom</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })

    it('should forward additional props - باید props اضافی را ارسال کند', () => {
      render(<Button data-testid="custom-button" aria-label="Custom button">Button</Button>)
      
      const button = screen.getByTestId('custom-button')
      expect(button).toHaveAttribute('aria-label', 'Custom button')
    })
  })

  describe('Accessibility - دسترسی‌پذیری', () => {
    it('should have proper accessibility attributes - باید ویژگی‌های دسترسی‌پذیری مناسب داشته باشد', () => {
      render(<Button>Accessible Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-offset-2')
    })
  })
})