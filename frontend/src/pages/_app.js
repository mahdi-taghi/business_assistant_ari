import "@/styles/globals.css";
import Layout from "./Layout";
import { AuthProvider } from "@/context/AuthContext";
import AuthGuard from "@/components/auth/AuthGuard";

export default function App({ Component, pageProps }) {
  const requiresAuth = Component.requiresAuth !== false;
  const wrapWithLayout = Component.disableLayout !== true;
  const currentPageName = Component.displayName || Component.name;

  return (
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
  );
}
