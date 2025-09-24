import React, { useState, useEffect } from "react";
import { ChatSession, Message } from "@/Entities/all";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MessageSquare, Trash2, Calendar, X, Filter, Sparkles } from "lucide-react";
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

export default function History() {
  const router = useRouter();
  const navigate = (to) => router.push(to);
  const [sessions, setSessions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const data = await ChatSession.list("-last_activity");
      setSessions(data);
    } catch (error) {
      console.error("Error loading sessions:", error);
    }
    setIsLoading(false);
  };

  const handleSessionClick = (session) => {
    navigate(createPageUrl(`Chat?sessionId=${session.id}`));
  };

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (session.first_message_preview || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    <div className="flex h-full bg-slate-900">
      <div className="w-full border-r border-slate-700 bg-slate-900/95 backdrop-blur-sm flex flex-col">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-slate-700/50 bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">تاریخچه چت</h1>
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
                  isSearchFocused ? 'text-blue-400' : 'text-slate-400'
                }`}>
                  <Search className="w-4 h-4" />
                </div>
                
                <Input
                  placeholder="جستجو در گفتگوها..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className={`pl-10 pr-10 h-12 bg-slate-800/60 border-2 transition-all duration-300 text-slate-100 placeholder-slate-400 rounded-xl ${
                    isSearchFocused 
                      ? 'border-blue-500/50 shadow-lg shadow-blue-500/10 bg-slate-800/80' 
                      : 'border-slate-700/50 hover:border-slate-600/50'
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
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center transition-colors duration-200"
                    >
                      <X className="w-3 h-3 text-slate-300" />
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
                    className="mt-2 text-xs text-slate-400"
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
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                  <Filter className="w-4 h-4" />
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="pl-10 h-12 bg-slate-800/60 border-2 border-slate-700/50 hover:border-slate-600/50 text-slate-100 rounded-xl transition-all duration-300 hover:bg-slate-800/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="recent" className="text-slate-100 hover:bg-slate-700 focus:bg-slate-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        جدیدترین
                      </div>
                    </SelectItem>
                    <SelectItem value="oldest" className="text-slate-100 hover:bg-slate-700 focus:bg-slate-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        قدیمی‌ترین
                      </div>
                    </SelectItem>
                    <SelectItem value="messages" className="text-slate-100 hover:bg-slate-700 focus:bg-slate-700">
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

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-slate-400 text-sm">در حال بارگذاری گفتگوها...</p>
              </div>
            ) : sortedSessions.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">هیچ گفتگویی یافت نشد</p>
                <Button
                  onClick={() => navigate(createPageUrl("Chat"))}
                  variant="outline"
                  size="sm"
                  className="mt-3 border-slate-700 text-slate-300 hover:text-blue-400"
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