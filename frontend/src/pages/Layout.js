import React, { useCallback, memo } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { createPageUrl, isAdminUser } from "@/utils";
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
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ui/ThemeToggle";

const getNavigationItems = (user) => {
  const baseItems = [
    { title: "چت", url: createPageUrl("Chat"), icon: MessageSquare },
    { title: "تاریخچه", url: createPageUrl("History"), icon: History },
    { title: "پروفایل", url: createPageUrl("Profile"), icon: User },
  ];
  
  // Add admin panel for admin users
  if (isAdminUser(user)) {
    baseItems.push({ title: "پنل مدیریت", url: createPageUrl("Admin"), icon: Shield });
  }
  
  return baseItems;
};

const Layout = memo(function Layout({ children, currentPageName }) {
  const router = useRouter();
  const location = { pathname: router.pathname, search: router.asPath.split("?")[1] || "" };
  const { user, logout } = useAuth();
  const { theme, isDark } = useTheme();

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace("/auth/login");
  }, [logout, router]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200'
    }`}>
      <style>{`
        :root { --primary-600: #3b82f6; --primary-700: #2563eb; --accent-400: #8b5cf6; --accent-500: #7c3aed; }
        .glow-effect { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
        .message-enter { animation: slideUp 0.3s ease-out; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .gradient-text { background: linear-gradient(135deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      `}</style>

      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <Sidebar className={`fixed left-0 top-0 h-screen w-72 border-r backdrop-blur-sm z-50 flex flex-col hidden md:flex transition-colors duration-300 ${
            isDark 
              ? 'border-slate-700 bg-slate-900/95' 
              : 'border-slate-200 bg-white/95'
          }`}>
            <SidebarHeader className={`border-b p-6 flex-shrink-0 ${
              isDark ? 'border-slate-700' : 'border-slate-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center glow-effect">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className={`font-bold text-lg gradient-text ${
                    isDark ? 'text-white' : 'text-slate-800'
                  }`}>دستیار هوشمند آری</h2>
                  <p className={`text-xs ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>سطح سازمانی</p>
                </div>
              </div>
            </SidebarHeader>

            <SidebarContent className="p-4 flex-1 overflow-y-auto">
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {getNavigationItems(user).map((item) => {
                      const isActive = location.pathname === item.url;
                      const itemClass = `transition-all duration-300 rounded-xl mb-2 group ${
                        isActive 
                          ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border border-blue-500/30' 
                          : isDark 
                            ? 'hover:bg-slate-800/50 hover:text-blue-400 text-slate-300' 
                            : 'hover:bg-slate-100 hover:text-blue-600 text-slate-600'
                      }`;

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

            <SidebarFooter className={`border-t p-4 flex-shrink-0 ${
              isDark ? 'border-slate-700' : 'border-slate-200'
            }`}>
              <div className={`flex items-center gap-3 p-3 rounded-xl ${
                isDark ? 'bg-slate-800/50' : 'bg-slate-100/50'
              }`}>
                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">{user?.first_name?.[0] || user?.email?.[0] || 'U'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm truncate ${
                    isDark ? 'text-white' : 'text-slate-800'
                  }`}>{user?.first_name || user?.email || 'Welcome'}</p>
                  <p className={`text-xs truncate ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>{user ? 'آماده چت' : 'مهمان'}</p>
                </div>
                <Button onClick={handleLogout} className="ml-auto gap-2 bg-red-600/80 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors">
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">خروج</span>
                </Button>
              </div>
            </SidebarFooter>
          </Sidebar>

          <main className={`flex-1 flex flex-col overflow-hidden md:ml-72 transition-colors duration-300 ${
            isDark ? 'bg-slate-900' : 'bg-slate-50'
          }`}>
            <div className={`sticky top-0 z-10 border-b backdrop-blur transition-colors duration-300 ${
              isDark 
                ? 'border-slate-800/80 bg-slate-900/80 supports-[backdrop-filter]:bg-slate-900/60' 
                : 'border-slate-200/80 bg-white/80 supports-[backdrop-filter]:bg-white/60'
            }`}>
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <SidebarTrigger />
                  <h1 className={`font-semibold tracking-wide ${
                    isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}>
                    {currentPageName || "داشبورد"}
                  </h1>
                </div>
                <ThemeToggle />
              </div>
            </div>
            <div className="flex-1 overflow-hidden">{children}</div>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
});

export default Layout;