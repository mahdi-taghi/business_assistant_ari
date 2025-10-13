import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  MessageSquare, 
  History, 
  User, 
  Shield, 
  Plus,
  Sparkles,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { createPageUrl, isAdminUser } from '@/utils';
import { Button } from './button';

const MobileNavMenu = ({ onCreateNewChat, onMenuStateChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isDark } = useTheme();

  // Prevent body scroll when menu is open and notify parent component
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    // Notify parent component about menu state change
    if (onMenuStateChange) {
      onMenuStateChange(isOpen);
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isOpen, onMenuStateChange]);

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

  const handleLogout = async () => {
    await logout();
    router.replace("/auth/login");
    setIsOpen(false);
  };

  const handleNavClick = (url) => {
    router.push(url);
    setIsOpen(false);
  };

  const handleNewChat = () => {
    onCreateNewChat();
    setIsOpen(false);
  };

  const navItems = getNavigationItems(user);

  return (
    <>
      {/* Menu Button */}
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className={`transition-colors duration-300 md:hidden relative z-50 ${
          isDark 
            ? 'border-slate-700 hover:border-blue-500 text-slate-300 hover:text-blue-400 bg-transparent' 
            : 'border-slate-300 hover:border-blue-500 text-slate-600 hover:text-blue-600 bg-transparent'
        }`}
        style={{ zIndex: 9999 }}
      >
        <Menu className="w-4 h-4" />
      </Button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 md:hidden"
              style={{ zIndex: 9999 }}
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed top-0 left-0 h-full w-full md:hidden flex flex-col ${
                isDark 
                  ? 'bg-slate-900' 
                  : 'bg-white'
              }`}
              style={{
                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                width: '100vw',
                height: '100vh',
                zIndex: 10000
              }}
            >
              {/* Header */}
              <div className={`flex items-center justify-between p-6 border-b flex-shrink-0 ${
                isDark ? 'border-slate-700' : 'border-slate-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className={`font-bold text-lg ${
                      isDark ? 'text-white' : 'text-slate-800'
                    }`}>
                      منو
                    </h2>
                    <p className={`text-sm ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      دسترسی سریع
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="ghost"
                  size="sm"
                  className={`p-2 ${
                    isDark 
                      ? 'hover:bg-slate-800 text-slate-400' 
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Navigation Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {/* New Chat Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handleNewChat}
                    className={`w-full justify-start gap-3 h-12 ${
                      isDark 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    <Plus className="w-5 h-5" />
                    <span className="font-medium">چت جدید</span>
                  </Button>
                </motion.div>

                {/* Navigation Links */}
                {navItems.map((item, index) => {
                  const isActive = router.pathname === item.url;
                  return (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        onClick={() => handleNavClick(item.url)}
                        variant="ghost"
                        className={`w-full justify-start gap-3 h-12 ${
                          isActive 
                            ? isDark 
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                              : 'bg-blue-500/20 text-blue-600 border border-blue-500/30'
                            : isDark 
                              ? 'hover:bg-slate-800 text-slate-300' 
                              : 'hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.title}</span>
                        {isActive && (
                          <Sparkles className="w-4 h-4 ml-auto opacity-70" />
                        )}
                      </Button>
                    </motion.div>
                  );
                })}
              </div>

              {/* User Info */}
              <div className={`p-4 border-t flex-shrink-0 ${
                isDark ? 'border-slate-700' : 'border-slate-200'
              }`}>
                <div className={`flex items-center gap-3 p-3 rounded-xl mb-3 ${
                  isDark ? 'bg-slate-800/50' : 'bg-slate-100/50'
                }`}>
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {user?.first_name?.[0] || user?.email?.[0] || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm truncate ${
                      isDark ? 'text-white' : 'text-slate-800'
                    }`}>
                      {user?.first_name || user?.email || 'Welcome'}
                    </p>
                    <p className={`text-xs truncate ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      {user ? 'آماده چت' : 'مهمان'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Logout Button - Fixed at bottom */}
              <div className={`p-4 border-t flex-shrink-0 ${
                isDark ? 'border-slate-700' : 'border-slate-200'
              }`}>
                <Button
                  onClick={handleLogout}
                  className="w-full gap-2 bg-red-600 hover:bg-red-700 text-white h-12 font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>خروج</span>
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileNavMenu;
