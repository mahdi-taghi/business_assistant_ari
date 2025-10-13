# PWA Setup برای Ari Chatbot

این پروژه اکنون به عنوان یک Progressive Web App (PWA) پیکربندی شده است.

## ویژگی‌های PWA

### ✅ قابلیت‌های پیاده‌سازی شده

1. **Web App Manifest** - فایل `manifest.json` برای تعریف اپلیکیشن
2. **Service Worker** - برای کش کردن و عملکرد آفلاین
3. **Install Prompt** - پیام نصب خودکار برای کاربران
4. **Offline Support** - صفحه آفلاین و کش کردن منابع
5. **App Icons** - آیکون‌های مختلف برای دستگاه‌های مختلف
6. **Meta Tags** - تگ‌های لازم برای PWA

### 📱 نحوه نصب

#### در مرورگرهای دسکتاپ:
- Chrome/Edge: آیکون نصب در نوار آدرس
- Firefox: آیکون نصب در نوار آدرس
- Safari: از منوی Share > Add to Home Screen

#### در موبایل:
- Android: پیام نصب خودکار یا از منوی مرورگر
- iOS: از منوی Share > Add to Home Screen

### 🔧 تنظیمات PWA

#### فایل‌های اصلی:
- `public/manifest.json` - تنظیمات اصلی PWA
- `public/sw.js` - Service Worker سفارشی
- `public/offline.html` - صفحه آفلاین
- `public/icons/` - آیکون‌های اپلیکیشن

#### تنظیمات Next.js:
- `next.config.mjs` - پیکربندی next-pwa
- `src/pages/_app.js` - متا تگ‌های PWA
- `src/components/ui/PWAInstallPrompt.jsx` - کامپوننت نصب

### 🎨 سفارشی‌سازی آیکون‌ها

آیکون‌های فعلی SVG هستند. برای تولید آیکون‌های PNG:

1. از ابزارهای آنلاین استفاده کنید:
   - https://realfavicongenerator.net/
   - https://www.favicon-generator.org/

2. آیکون‌های تولید شده را در `public/icons/` قرار دهید

3. فایل `manifest.json` را به‌روزرسانی کنید

### 📊 تست PWA

#### Chrome DevTools:
1. F12 > Application > Manifest
2. Application > Service Workers
3. Application > Storage > Cache Storage

#### Lighthouse:
1. F12 > Lighthouse
2. Progressive Web App را انتخاب کنید
3. Generate report

### 🚀 تولید برای تولید

```bash
# نصب وابستگی‌ها
npm install

# ساخت برای تولید
npm run build

# اجرای نسخه تولید
npm start
```

### 🔍 عیب‌یابی

#### Service Worker کار نمی‌کند:
- بررسی کنید که فایل `sw.js` در `public/` وجود دارد
- در DevTools > Application > Service Workers بررسی کنید
- کش مرورگر را پاک کنید

#### آیکون‌ها نمایش داده نمی‌شوند:
- مسیر آیکون‌ها را در `manifest.json` بررسی کنید
- فرمت فایل‌ها را بررسی کنید (PNG/SVG)

#### پیام نصب نمایش داده نمی‌شود:
- بررسی کنید که `PWAInstallPrompt` در `_app.js` import شده
- در حالت خصوصی مرورگر تست نکنید
- مرورگر را به‌روزرسانی کنید

### 📝 نکات مهم

1. **HTTPS ضروری است** - PWA فقط روی HTTPS کار می‌کند
2. **Service Worker** - در حالت development غیرفعال است
3. **کش** - منابع به‌صورت خودکار کش می‌شوند
4. **آفلاین** - فقط صفحات کش شده در دسترس هستند

### 🔄 به‌روزرسانی PWA

برای به‌روزرسانی PWA:
1. نسخه در `manifest.json` را تغییر دهید
2. `CACHE_NAME` در `sw.js` را به‌روزرسانی کنید
3. اپلیکیشن را دوباره build کنید

### 📱 پشتیبانی مرورگرها

- ✅ Chrome/Edge (Android/Desktop)
- ✅ Firefox (Android/Desktop)
- ✅ Safari (iOS/macOS)
- ⚠️ Samsung Internet
- ❌ Internet Explorer

### 🎯 مراحل بعدی

برای بهبود PWA:
1. اضافه کردن Push Notifications
2. پیاده‌سازی Background Sync
3. بهبود صفحه آفلاین
4. اضافه کردن App Shortcuts
5. پیاده‌سازی Share Target API
