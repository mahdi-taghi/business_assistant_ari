import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="fa" dir="rtl">
      <Head>
        <meta name="theme-color" content="#1e293b" />
        <meta name="description" content="دستیار هوشمند آری - چت‌بات پیشرفته با قابلیت‌های سازمانی" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>
      <body className="antialiased font-sans" style={{ fontFamily: "'Vazirmatn', ui-sans-serif, system-ui, sans-serif" }}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
