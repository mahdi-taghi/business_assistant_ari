import React, { useState, useEffect } from "react";
import { ChatSession, Message } from "@/Entities/all";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MessageSquare, Trash2, Calendar } from "lucide-react";
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
        <div className="p-4 md:p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold text-white mb-4">تاریخچه چت</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="جستجو در گفتگوها..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-700/50 text-slate-100 placeholder-slate-400"
              />
            </div>
            
            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-slate-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">جدیدترین</SelectItem>
                <SelectItem value="oldest">قدیمی‌ترین</SelectItem>
                <SelectItem value="messages">بیشترین پیام</SelectItem>
              </SelectContent>
            </Select>
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