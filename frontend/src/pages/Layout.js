import React, { useCallback, memo } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
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
    <div className={`min-h-screen transition-all duration-500 ${
      isDark 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200'
    }`}>
      {/* اضافه کردن افکت نور پس‌زمینه */}
      <div className="fixed inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />
      
      <style>{`
        :root { --primary-600: #3b82f6; --primary-700: #2563eb; --accent-400: #8b5cf6; --accent-500: #7c3aed; }
        .glow-effect { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
        .message-enter { animation: slideUp 0.3s ease-out; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .gradient-text { background: linear-gradient(135deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      `}</style>

      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <Sidebar className={`fixed left-0 top-0 h-screen w-72 border-r backdrop-blur-xl z-50 flex flex-col hidden md:flex transition-all duration-500 ${
            isDark 
              ? 'border-slate-700/50 bg-slate-900/95' 
              : 'border-slate-200/50 bg-white/95'
          }`}>
            <SidebarHeader className={`border-b p-6 flex-shrink-0 ${
              isDark ? 'border-slate-700/50' : 'border-slate-200/50'
            }`}>
              <motion.div 
                className="flex items-center gap-3"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div 
                  className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg"
                  animate={{
                    boxShadow: [
                      "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      "0 25px 50px -12px rgba(59, 130, 246, 0.4)",
                      "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Bot className="w-7 h-7 text-white" />
                </motion.div>
                <div>
                  <h2 className={`font-bold text-xl gradient-text ${
                    isDark ? 'text-white' : 'text-slate-800'
                  }`}>دستیار هوشمند آری</h2>
                  <p className={`text-sm ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>سطح سازمانی</p>
                </div>
              </motion.div>
            </SidebarHeader>

            <SidebarContent className="p-4 flex-1 overflow-y-auto custom-scrollbar">
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {getNavigationItems(user).map((item) => {
                      const isActive = location.pathname === item.url;
                      return (
                        <SidebarMenuItem key={item.title}>
                          <motion.div
                            whileHover={{ x: 5 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Link href={item.url} className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ${
                              isActive 
                                ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border border-blue-500/30 shadow-lg' 
                                : isDark 
                                  ? 'hover:bg-slate-800/50 hover:text-blue-400 text-slate-300' 
                                  : 'hover:bg-slate-100 hover:text-blue-600 text-slate-600'
                            }`}>
                              <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                              <span className="font-medium">{item.title}</span>
                              {isActive && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: "spring", stiffness: 300 }}
                                >
                                  <Sparkles className="w-4 h-4 ml-auto opacity-70" />
                                </motion.div>
                              )}
                            </Link>
                          </motion.div>
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