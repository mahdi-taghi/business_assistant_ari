import "@/styles/globals.css";
import Head from "next/head";
import Layout from "./Layout";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import AuthGuard from "@/components/auth/AuthGuard";
import PWAInstallPrompt from "@/components/ui/PWAInstallPrompt";

export default function App({ Component, pageProps }) {
  const requiresAuth = Component.requiresAuth !== false;
  const wrapWithLayout = Component.disableLayout !== true;
  const currentPageName = Component.displayName || Component.name;

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* PWA Meta Tags */}
        <meta name="application-name" content="Ari Chatbot" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AriChat" />
        <meta name="description" content="یک چت بات هوشمند با قابلیت گفتگو با پایگاه داده" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#3b82f6" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/icon-152x152.svg" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.svg" />
        
        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" sizes="32x32" href="/icons/icon-32x32.svg" />
        <link rel="icon" type="image/svg+xml" sizes="16x16" href="/icons/icon-16x16.svg" />
        <link rel="shortcut icon" href="/favicon.svg" />
        
        {/* Microsoft Tiles */}
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.svg" />
      </Head>
      <ThemeProvider>
        <AuthProvider>
          {wrapWithLayout ? (
            <Layout currentPageName={currentPageName}>
              <AuthGuard requiresAuth={requiresAuth}>
                <Component {...pageProps} />
              </AuthGuard>
            </Layout>
          ) : (
            <AuthGuard requiresAuth={requiresAuth}>
              <Component {...pageProps} />
            </AuthGuard>
          )}
        </AuthProvider>
      </ThemeProvider>
      <PWAInstallPrompt />
    </>
  );
}
