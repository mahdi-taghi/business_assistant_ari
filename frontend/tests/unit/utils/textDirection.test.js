/**
 * Text Direction Detection Tests
 * 
 * این فایل تست‌های تابع تشخیص جهت متن را شامل می‌شود
 * 
 * تست‌های موجود:
 * - تشخیص متن فارسی (RTL)
 * - تشخیص متن عربی (RTL)
 * - تشخیص متن انگلیسی (LTR)
 * - تشخیص متن ترکیبی
 * - مدیریت متن خالی
 * - مدیریت اعداد و نمادها
 * - مدیریت متن با فاصله و علائم نگارشی
 * - مدیریت متن عبری (RTL)
 * - مدیریت متن با ایموجی
 * - مدیریت متن طولانی
 * - مدیریت کاراکترهای Unicode
 * - مدیریت اسکریپت‌های ترکیبی
 */

import { detectTextDirection } from '@/utils/textDirection'

describe('detectTextDirection - تشخیص جهت متن', () => {
  describe('Persian Text - متن فارسی', () => {
    it('should return "rtl" for Persian text - باید "rtl" برگرداند برای متن فارسی', () => {
      expect(detectTextDirection('سلام دنیا')).toBe('rtl')
      expect(detectTextDirection('این یک متن فارسی است')).toBe('rtl')
      expect(detectTextDirection('چت بات هوشمند')).toBe('rtl')
    })
  })

  describe('Arabic Text - متن عربی', () => {
    it('should return "rtl" for Arabic text - باید "rtl" برگرداند برای متن عربی', () => {
      expect(detectTextDirection('مرحبا بالعالم')).toBe('rtl')
      expect(detectTextDirection('هذا نص عربي')).toBe('rtl')
    })
  })

  describe('English Text - متن انگلیسی', () => {
    it('should return "ltr" for English text - باید "ltr" برگرداند برای متن انگلیسی', () => {
      expect(detectTextDirection('Hello world')).toBe('ltr')
      expect(detectTextDirection('This is an English text')).toBe('ltr')
      expect(detectTextDirection('Chat bot AI')).toBe('ltr')
    })
  })

  describe('Mixed Text - متن ترکیبی', () => {
    it('should return "ltr" for mixed text starting with English - باید "ltr" برگرداند برای متن ترکیبی که با انگلیسی شروع می‌شود', () => {
      expect(detectTextDirection('Hello سلام')).toBe('ltr')
      expect(detectTextDirection('Test متن')).toBe('ltr')
    })

    it('should return "rtl" for mixed text starting with Persian/Arabic - باید "rtl" برگرداند برای متن ترکیبی که با فارسی/عربی شروع می‌شود', () => {
      expect(detectTextDirection('سلام Hello')).toBe('rtl')
      expect(detectTextDirection('متن Test')).toBe('rtl')
    })
  })

  describe('Empty and Special Cases - موارد خالی و خاص', () => {
    it('should return "rtl" by default for empty string - باید به طور پیش‌فرض "rtl" برگرداند برای رشته خالی', () => {
      expect(detectTextDirection('')).toBe('rtl')
      expect(detectTextDirection()).toBe('rtl')
    })

    it('should return "rtl" for numbers and symbols only - باید "rtl" برگرداند برای فقط اعداد و نمادها', () => {
      expect(detectTextDirection('123')).toBe('rtl')
      expect(detectTextDirection('!@#$%')).toBe('rtl')
      expect(detectTextDirection('123!@#')).toBe('rtl')
    })
  })

  describe('Numbers and Mixed Content - اعداد و محتوای ترکیبی', () => {
    it('should handle mixed content with numbers - باید محتوای ترکیبی با اعداد را مدیریت کند', () => {
      expect(detectTextDirection('123 Hello')).toBe('ltr')
      expect(detectTextDirection('123 سلام')).toBe('rtl')
    })
  })

  describe('Spaces and Punctuation - فاصله و علائم نگارشی', () => {
    it('should handle text with spaces and punctuation - باید متن با فاصله و علائم نگارشی را مدیریت کند', () => {
      expect(detectTextDirection('  Hello, world!  ')).toBe('ltr')
      expect(detectTextDirection('  سلام، دنیا!  ')).toBe('rtl')
    })
  })

  describe('Hebrew Text - متن عبری', () => {
    it('should handle Hebrew text (RTL) - باید متن عبری (RTL) را مدیریت کند', () => {
      expect(detectTextDirection('שלום עולם')).toBe('rtl')
    })
  })

  describe('Emojis - ایموجی‌ها', () => {
    it('should handle text with emojis - باید متن با ایموجی را مدیریت کند', () => {
      expect(detectTextDirection('😀 Hello')).toBe('ltr')
      expect(detectTextDirection('😀 سلام')).toBe('rtl')
      expect(detectTextDirection('😀')).toBe('rtl')
    })
  })

  describe('Performance - عملکرد', () => {
    it('should handle very long text efficiently - باید متن خیلی طولانی را به طور کارآمد مدیریت کند', () => {
      const longEnglishText = 'A'.repeat(1000) + 'سلام'
      const longPersianText = 'س'.repeat(1000) + 'Hello'
      
      expect(detectTextDirection(longEnglishText)).toBe('ltr')
      expect(detectTextDirection(longPersianText)).toBe('rtl')
    })
  })

  describe('Unicode Characters - کاراکترهای Unicode', () => {
    it('should handle Unicode characters correctly - باید کاراکترهای Unicode را درست مدیریت کند', () => {
      expect(detectTextDirection('café')).toBe('ltr')
      expect(detectTextDirection('naïve')).toBe('ltr')
      expect(detectTextDirection('résumé')).toBe('ltr')
    })
  })

  describe('Mixed Scripts - اسکریپت‌های ترکیبی', () => {
    it('should handle mixed scripts in single word - باید اسکریپت‌های ترکیبی در یک کلمه را مدیریت کند', () => {
      expect(detectTextDirection('Helloسلام')).toBe('ltr')
      expect(detectTextDirection('سلامHello')).toBe('rtl')
    })
  })
})