import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";

export default function AuthGuard({ children, requiresAuth = true }) {
  const router = useRouter();
  const { isAuthenticated, initializing } = useAuth();

  useEffect(() => {
    if (!requiresAuth) return;
    if (initializing) return;
    if (!isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [requiresAuth, initializing, isAuthenticated, router]);

  if (requiresAuth && (initializing || !isAuthenticated)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="flex flex-col items-center text-slate-300">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-slate-400">Preparing your workspace...</p>
        </div>
      </div>
    );
  }

  return children;
}
