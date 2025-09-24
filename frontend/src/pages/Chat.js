
import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChatSession, Message, User } from "@/Entities/all";
import { InvokeLLM } from "@/integrations/Core";
import { AnimatePresence } from "framer-motion";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import { SidebarTrigger } from "@/components/ui/sidebar";

import MessageBubble from "../components/chat/MessageBubble";
import ChatInput from "../components/chat/ChatInput";
import TypingIndicator from "../components/chat/TypingIndicator";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const router = useRouter();
  const navigate = useCallback((to, opts) => router.push(to, undefined, opts), [router]);
  const search = router.asPath.split('?')[1] || '';

  const createNewSession = useCallback(async () => {
    const newSession = await ChatSession.create({
      title: "گفتگوی جدید",
      first_message_preview: "",
      message_count: 0,
      last_activity: new Date().toISOString()
    });
    setCurrentSession(newSession);
    setMessages([]);
    navigate(`/Chat?sessionId=${newSession.id}`, { replace: true });
    
    // Add welcome message
    const welcomeMessage = {
      id: 'welcome',
      content: "سلام! من دستیار هوشمند شما هستم. اینجا هستم تا در هر سوال یا کاری که دارید کمکتان کنم. امروز چطور می‌تونم کمکتان کنم؟",
      sender_type: "bot",
      timestamp: new Date().toISOString()
    };
    setMessages([welcomeMessage]);
  }, [navigate]);

  const loadSession = useCallback(async (sessionId) => {
    setIsLoading(true);
    try {
      const session = await ChatSession.get(sessionId);
      if (session) {
        // Fetch messages ordered by timestamp
        const existingMessages = await Message.filter({ session_id: sessionId }, "timestamp");
        setCurrentSession(session);
        setMessages(existingMessages);
      } else {
        // if session not found, create a new one
        console.warn(`Session with ID ${sessionId} not found. Creating a new one.`);
        await createNewSession();
      }
    } catch (error) {
      console.error("Error loading session:", error);
      // Fallback to creating a new session if loading fails
      await createNewSession();
    } finally {
      setIsLoading(false);
    }
  }, [createNewSession]);

  useEffect(() => {
    const searchParams = new URLSearchParams(search);
    const sessionId = searchParams.get("sessionId");

    if (sessionId) {
      loadSession(sessionId);
    } else {
      createNewSession();
    }
  }, [search, loadSession, createNewSession]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  const handleSendMessage = async (content) => {
    if (!currentSession) return;

    setIsLoading(true);
    setIsTyping(true);

    // Create user message
    const userMessage = await Message.create({
      session_id: currentSession.id,
      content,
      sender_type: "user",
      timestamp: new Date().toISOString()
    });

    // Update messages immediately
    setMessages(prev => [...prev, userMessage]);

    // Update session with first message if this is the first user message
    // We need to check the actual messages state after the update to determine if it's the first user message for the current session.
    // Or, check against the initially loaded messages + the current user message.
    // A simpler approach for the initial title is to check `currentSession.first_message_preview`
    if (!currentSession.first_message_preview) { // If first_message_preview is empty, it's a new session or a session without initial user input
      const sessionTitle = content.length > 50 ? content.substring(0, 50) + "..." : content;
      await ChatSession.update(currentSession.id, {
        title: sessionTitle,
        first_message_preview: content,
        last_activity: new Date().toISOString()
      });
      // Update currentSession state to reflect the new title
      setCurrentSession(prev => ({ ...prev, title: sessionTitle, first_message_preview: content }));
    } else {
       await ChatSession.update(currentSession.id, {
        last_activity: new Date().toISOString()
      });
    }

    try {
      // Get AI response
      const aiResponse = await InvokeLLM({
        prompt: `شما یک دستیار هوشمند مفید برای یک برنامه سازمانی هستید. به طور طبیعی و مفید پاسخ دهید: "${content}"`,
        add_context_from_internet: false
      });

      // Create bot message
      const botMessage = await Message.create({
        session_id: currentSession.id,
        content: aiResponse,
        sender_type: "bot",
        timestamp: new Date().toISOString()
      });

      setMessages(prev => [...prev, botMessage]);

      // Update session stats
      await ChatSession.update(currentSession.id, {
        message_count: (currentSession.message_count || 0) + 2, // +2 for user and bot messages
        last_activity: new Date().toISOString()
      });
      setCurrentSession(prev => ({ ...prev, message_count: (prev.message_count || 0) + 2 }));


      // Update user stats
      try {
        const user = await User.me();
        await User.updateMyUserData({
          total_messages: (user.total_messages || 0) + 1 // +1 for the user's message
        });
      } catch (error) {
        // User might not be logged in or have profile yet, safely ignore
        console.warn("Could not update user total_messages:", error);
      }

    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMessage = await Message.create({
        session_id: currentSession.id,
        content: "عذرخواهی می‌کنم، اما در حال حاضر در پاسخ دادن مشکل دارم. لطفاً لحظه‌ای دیگر دوباره تلاش کنید.",
        sender_type: "bot",
        timestamp: new Date().toISOString()
      });
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsTyping(false);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Chat Header */}
      <div className="flex-shrink-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 px-4 md:px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
           <div className="flex items-center gap-3">
            <SidebarTrigger className="hover:bg-slate-800 p-2 rounded-lg transition-colors duration-200 text-white md:hidden" />
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse hidden md:block" />
            <div>
              <h1 className="text-base md:text-lg font-semibold text-white truncate max-w-[150px] sm:max-w-xs md:max-w-md">
                {currentSession?.title || "دستیار هوشمند آری"}
              </h1>
              <p className="text-xs md:text-sm text-slate-400">همیشه در خدمت شما</p>
            </div>
          </div>
          
          <Button
            onClick={createNewSession}
            variant="outline"
            size="sm"
            className="border-slate-700 hover:border-blue-500 text-slate-300 hover:text-blue-400 bg-transparent"
          >
            <Plus className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">چت جدید</span>
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {messages.length === 0 && !isLoading ? ( // Only show start message if no messages and not loading
            <div className="max-w-md mx-auto py-12 px-6 bg-slate-800/60 border border-slate-700 rounded-3xl shadow-xl backdrop-blur-sm">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4 shadow-lg transform-gpu hover:scale-105 transition-transform">
                  <Sparkles className="w-9 h-9 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">هر سوالی داری بپرس</h2>
                <p className="text-sm text-slate-300 mb-6">هر سوالی داشتی بپرس، من اینجا هستم تا کمک کنم!</p>
                <div className="w-full"> 
                </div>
              </div>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((message, index) => (
                <MessageBubble 
                  key={message.id || index} 
                  message={message} 
                  isLatest={index === messages.length - 1}
                />
              ))}
            </AnimatePresence>
          )}
          
          <AnimatePresence>
            {isTyping && <TypingIndicator />}
          </AnimatePresence>
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        placeholder="هر سوالی داری بپرس..."
      />
    </div>
  );
}
