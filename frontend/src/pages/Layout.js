import React, { useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { createPageUrl } from "@/utils";
import { MessageSquare, History, User, Bot, Sparkles, LogOut, Shield } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

const getNavigationItems = (user) => {
  const baseItems = [
    { title: "چت", url: createPageUrl("Chat"), icon: MessageSquare },
    { title: "تاریخچه", url: createPageUrl("History"), icon: History },
    { title: "پروفایل", url: createPageUrl("Profile"), icon: User },
  ];
  
  // Debug logging
  console.log("=== LAYOUT DEBUG ===");
  console.log("User object:", user);
  console.log("User is_superuser:", user?.is_superuser);
  console.log("User roles:", user?.roles);
  console.log("User roles.is_admin:", user?.roles?.is_admin);
  console.log("User roles.is_superuser:", user?.roles?.is_superuser);
  console.log("User roles.list:", user?.roles?.list);
  console.log("===================");
  
  // Add admin panel for admin users
  if (user && (user.roles?.is_admin || user.roles?.is_superuser || user.is_superuser)) {
    console.log("Adding Admin Panel to navigation");
    baseItems.push({ title: "پنل مدیریت", url: createPageUrl("Admin"), icon: Shield });
  } else {
    console.log("NOT adding Admin Panel - user is not admin");
  }
  
  return baseItems;
};

export default function Layout({ children, currentPageName }) {
  const router = useRouter();
  const location = { pathname: router.pathname, search: router.asPath.split("?")[1] || "" };
  const { user, logout } = useAuth();

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace("/auth/login");
  }, [logout, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <style>{`
        :root { --primary-600: #3b82f6; --primary-700: #2563eb; --accent-400: #8b5cf6; --accent-500: #7c3aed; }
        .glow-effect { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
        .message-enter { animation: slideUp 0.3s ease-out; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .gradient-text { background: linear-gradient(135deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      `}</style>

      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <Sidebar className="border-r border-slate-700 bg-slate-900/95 backdrop-blur-sm">
            <SidebarHeader className="border-b border-slate-700 p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center glow-effect">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-lg gradient-text">دستیار هوشمند آری</h2>
                  <p className="text-xs text-slate-400">سطح سازمانی</p>
                </div>
              </div>
            </SidebarHeader>

            <SidebarContent className="p-4">
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {getNavigationItems(user).map((item) => {
                      const isActive = location.pathname === item.url;
                      const itemClass = `hover:bg-slate-800/50 hover:text-blue-400 transition-all duration-300 rounded-xl mb-2 group ${isActive ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border border-blue-500/30' : 'text-slate-300'}`;

                      return (
                        <SidebarMenuItem key={item.title}>
                          <Link href={item.url} className={`flex items-center gap-3 px-4 py-3 ${itemClass}`}>
                            <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                            <span className="font-medium">{item.title}</span>
                            {isActive && <Sparkles className="w-4 h-4 ml-auto opacity-70" />}
                          </Link>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-slate-700 p-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">{user?.first_name?.[0] || user?.email?.[0] || 'U'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm truncate">{user?.first_name || user?.email || 'Welcome'}</p>
                  <p className="text-xs text-slate-400 truncate">{user ? 'آماده چت' : 'مهمان'}</p>
                </div>
                <Button onClick={handleLogout} className="ml-auto gap-2 bg-red-600/80 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors">
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">خروج</span>
                </Button>
              </div>
            </SidebarFooter>
          </Sidebar>

          <main className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
            <div className="sticky top-0 z-10 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60">
              <div className="flex items-center gap-3 px-4 py-3">
                <SidebarTrigger />
                <h1 className="text-slate-200 font-semibold tracking-wide">
                  {currentPageName || "داشبورد"}
                </h1>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">{children}</div>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}