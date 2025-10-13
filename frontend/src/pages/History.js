import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MessageSquare, Calendar, X, Filter, Sparkles, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
import { createPageUrl } from "@/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import SessionCard from "../components/history/SessionCard";
import { useChatApi } from "@/integrations/chatApi";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import MobileNavMenu from "../components/ui/MobileNavMenu";

export default function History() {
  const router = useRouter();
  const navigate = (to) => router.push(to);
  const [sessions, setSessions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const { listActiveChats } = useChatApi();
  const { isAuthenticated, getAccessToken } = useAuth();
  const { isDark } = useTheme();
  const refreshIntervalRef = useRef(null);
  const lastRefreshRef = useRef(Date.now());

  const loadSessions = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    try {
      const data = await listActiveChats();
      setSessions(Array.isArray(data) ? data : []);
      lastRefreshRef.current = Date.now();
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error("Error loading sessions:", error);
      setSessions([]);
    }
    if (showLoading) {
      setIsLoading(false);
    } else {
      setIsRefreshing(false);
    }
  }, [listActiveChats]);

  const handleManualRefresh = useCallback(() => {
    loadSessions(false);
  }, [loadSessions]);

  // Auto-refresh sessions every 5 seconds when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // Initial load
    loadSessions();

    // Set up auto-refresh
    refreshIntervalRef.current = setInterval(() => {
      loadSessions(false); // Don't show loading spinner for auto-refresh
    }, 5000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [isAuthenticated, loadSessions]);

  // Listen for storage events to detect new chats and message activity from other tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'newChatCreated' && e.newValue) {
        // Refresh sessions when a new chat is created in another tab
        loadSessions(false);
        // Clear the storage event
        localStorage.removeItem('newChatCreated');
      } else if (e.key === 'chatActivity' && e.newValue) {
        // Refresh sessions when there's chat activity in another tab
        loadSessions(false);
        // Clear the storage event
        localStorage.removeItem('chatActivity');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadSessions]);

  const handleSessionClick = (session) => {
    navigate(createPageUrl(`Chat?sessionId=${session.id}`));
  };

  const filteredSessions = sessions.filter((session) => {
    const title = (session.title || '').toLowerCase();
    const preview = (session.first_message_preview || session.last_message?.content || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return title.includes(query) || preview.includes(query);
  });

  const sortedSessions = [...filteredSessions].sort((a, b) => {
    switch (sortBy) {
      case "recent":
        return new Date(b.last_activity || b.created_date) - new Date(a.last_activity || a.created_date);
      case "oldest":
        return new Date(a.created_date) - new Date(b.created_date);
      case "messages":
        return (b.message_count || 0) - (a.message_count || 0);
      default:
        return 0;
    }
  });

  return (
    <div className={`h-full transition-colors duration-300 ${
      isDark ? 'bg-slate-900' : 'bg-slate-50'
    }`}>
      <div className="w-full flex flex-col">
        {/* Header */}
        <div className={`p-4 md:p-6 border-b backdrop-blur-sm transition-colors duration-300 ${
          isDark 
            ? 'border-slate-700/50 bg-gradient-to-r from-slate-900/95 to-slate-800/95' 
            : 'border-slate-200/50 bg-gradient-to-r from-white/95 to-slate-100/95'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h1 className={`text-xl font-bold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-slate-800'
              }`}>تاریخچه چت</h1>
            </div>
            
            <div className="flex items-center gap-3">
              {lastRefreshTime && (
                <span className={`text-xs transition-colors duration-300 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  آخرین بروزرسانی: {lastRefreshTime.toLocaleTimeString('fa-IR')}
                </span>
              )}
              <Button
                onClick={handleManualRefresh}
                variant="outline"
                size="sm"
                disabled={isRefreshing}
                className={`hidden md:flex transition-colors duration-300 ${
                  isDark 
                    ? 'border-slate-700 hover:border-blue-500 text-slate-300 hover:text-blue-400 bg-transparent' 
                    : 'border-slate-300 hover:border-blue-500 text-slate-600 hover:text-blue-600 bg-transparent'
                }`}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'در حال بروزرسانی...' : 'بروزرسانی'}
              </Button>
              
              {/* Mobile Navigation Menu */}
              <MobileNavMenu onCreateNewChat={() => navigate(createPageUrl("Chat"))} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Enhanced Search */}
            <motion.div 
              className="relative"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className={`relative transition-all duration-300 ${
                  isSearchFocused 
                    ? 'scale-[1.02]' 
                    : 'scale-100'
                }`}
                animate={{
                  scale: isSearchFocused ? 1.02 : 1,
                }}
              >
                <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${
                  isSearchFocused ? 'text-blue-400' : (isDark ? 'text-slate-400' : 'text-slate-500')
                }`}>
                  <Search className="w-4 h-4" />
                </div>
                
                <Input
                  placeholder="جستجو در گفتگوها..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className={`pl-10 pr-10 h-12 border-2 transition-all duration-300 rounded-xl ${
                    isDark 
                      ? `bg-slate-800/60 text-slate-100 placeholder-slate-400 ${
                          isSearchFocused 
                            ? 'border-blue-500/50 shadow-lg shadow-blue-500/10 bg-slate-800/80' 
                            : 'border-slate-700/50 hover:border-slate-600/50'
                        }`
                      : `bg-white/60 text-slate-800 placeholder-slate-500 ${
                          isSearchFocused 
                            ? 'border-blue-500/50 shadow-lg shadow-blue-500/10 bg-white/80' 
                            : 'border-slate-300/50 hover:border-slate-400/50'
                        }`
                  }`}
                />
                
                {/* Clear button */}
                <AnimatePresence>
                  {searchQuery && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() => setSearchQuery("")}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-200 ${
                        isDark 
                          ? 'bg-slate-700 hover:bg-slate-600' 
                          : 'bg-slate-200 hover:bg-slate-300'
                      }`}
                    >
                      <X className={`w-3 h-3 transition-colors duration-200 ${
                        isDark ? 'text-slate-300' : 'text-slate-600'
                      }`} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </motion.div>
              
              {/* Search results count */}
              <AnimatePresence>
                {searchQuery && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className={`mt-2 text-xs transition-colors duration-300 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    {filteredSessions.length} گفتگو یافت شد
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            
            {/* Enhanced Sort */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="relative">
                <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  <Filter className="w-4 h-4" />
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className={`pl-10 h-12 border-2 rounded-xl transition-all duration-300 ${
                    isDark 
                      ? 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600/50 text-slate-100 hover:bg-slate-800/80' 
                      : 'bg-white/60 border-slate-300/50 hover:border-slate-400/50 text-slate-800 hover:bg-white/80'
                  }`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={`transition-colors duration-300 ${
                    isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'
                  }`}>
                    <SelectItem value="recent" className={`transition-colors duration-300 ${
                      isDark ? 'text-slate-100 hover:bg-slate-700 focus:bg-slate-700' : 'text-slate-800 hover:bg-slate-100 focus:bg-slate-100'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        جدیدترین
                      </div>
                    </SelectItem>
                    <SelectItem value="oldest" className={`transition-colors duration-300 ${
                      isDark ? 'text-slate-100 hover:bg-slate-700 focus:bg-slate-700' : 'text-slate-800 hover:bg-slate-100 focus:bg-slate-100'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        قدیمی‌ترین
                      </div>
                    </SelectItem>
                    <SelectItem value="messages" className={`transition-colors duration-300 ${
                      isDark ? 'text-slate-100 hover:bg-slate-700 focus:bg-slate-700' : 'text-slate-800 hover:bg-slate-100 focus:bg-slate-100'
                    }`}>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        بیشترین پیام
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scrollable Sessions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
                <p className={`text-sm transition-colors duration-300 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>در حال بارگذاری گفتگوها...</p>
              </div>
            ) : sortedSessions.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className={`w-12 h-12 mx-auto mb-3 transition-colors duration-300 ${
                  isDark ? 'text-slate-600' : 'text-slate-400'
                }`} />
                <p className={`transition-colors duration-300 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>هیچ گفتگویی یافت نشد</p>
                <Button
                  onClick={() => navigate(createPageUrl("Chat"))}
                  variant="outline"
                  size="sm"
                  className={`mt-3 transition-colors duration-300 ${
                    isDark 
                      ? 'border-slate-700 text-slate-300 hover:text-blue-400' 
                      : 'border-slate-300 text-slate-600 hover:text-blue-600'
                  }`}
                >
                  شروع چت
                </Button>
              </div>
            ) : (
              sortedSessions.map((session) => (
                <motion.div
                  key={session.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <SessionCard
                    session={session}
                    onClick={handleSessionClick}
                  />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
