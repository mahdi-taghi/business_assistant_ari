import React, { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { useChatApi } from "@/integrations/chatApi";
import MessageBubble from "../components/chat/MessageBubble";
import ChatInput from "../components/chat/ChatInput";
import TypingIndicator from "../components/chat/TypingIndicator";

function buildWsUrl(chatId, token) {
  if (!chatId || !token) {
    return null;
  }

  const base = process.env.NEXT_PUBLIC_WS_URL;
  const encodedToken = encodeURIComponent(token);

  if (base) {
    const trimmed = base.endsWith("/") ? base.slice(0, -1) : base;
    return `${trimmed}/ws/chat/${chatId}/?token=${encodedToken}`;
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
  if (apiBase) {
    try {
      let candidate = apiBase;
      const hasProtocol = /^https?:\/\//i.test(candidate);
      if (!hasProtocol) {
        if (typeof window !== "undefined") {
          const origin = window.location.origin;
          if (candidate.startsWith("/")) {
            candidate = `${origin}${candidate}`;
          } else {
            candidate = `${origin.replace(/\/$/, "")}/${candidate}`;
          }
        } else {
          candidate = `http://${candidate}`;
        }
      }

      const apiUrl = new URL(candidate);
      const wsProtocol = apiUrl.protocol === "https:" ? "wss" : "ws";
      const port = apiUrl.port ? `:${apiUrl.port}` : "";
      return `${wsProtocol}://${apiUrl.hostname}${port}/ws/chat/${chatId}/?token=${encodedToken}`;
    } catch (error) {
      console.warn("Failed to parse NEXT_PUBLIC_API_URL for websocket", error);
    }
  }

  if (typeof window === "undefined") {
    return null;
  }

  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  return `${protocol}://${window.location.host}/ws/chat/${chatId}/?token=${encodedToken}`;
}

function parseMaybeJson(value, fallback) {
  if (!value) {
    return fallback;
  }
  if (typeof value === "object") {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function normalizeMessage(message) {
  if (!message) {
    return null;
  }

  const role = message.role || message.sender_type || message.message_role;
  const timestamp = message.created_at || message.timestamp || new Date().toISOString();

  return {
    id: message.id || message.message_id || `msg-${Date.now()}`,
    role: role === "bot" ? "assistant" : role || "assistant",
    content: message.content || "",
    timestamp,
    ai_response_metadata: parseMaybeJson(message.ai_response_metadata, null),
    ai_references: parseMaybeJson(message.ai_references, []),
    tokens_used: message.tokens_used ? Number(message.tokens_used) : undefined,
    response_time: message.response_time ? Number(message.response_time) : undefined,
  };
}

function createWelcomeMessage() {
  return {
    id: `welcome-${Date.now()}`,
    role: "assistant",
    content: "سلام! من دستیار هوشمند شما هستم. اینجا هستم تا در هر سوال یا کاری که دارید کمکتان کنم. امروز چطور می‌تونم کمکتان کنم؟",
    timestamp: new Date().toISOString(),
  };
}

export default function Chat() {
  const router = useRouter();
  const { initializing, isAuthenticated, getAccessToken } = useAuth();
  const { createChat, fetchMessages, listActiveChats, listArchivedChats } = useChatApi();

  const [messages, setMessages] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);

  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const appendMessage = useCallback((message) => {
    const normalized = normalizeMessage(message);
    if (!normalized) {
      return;
    }
    setMessages((prev) => [...prev, normalized]);
  }, []);

  const loadMessages = useCallback(async (chatId) => {
    try {
      const data = await fetchMessages(chatId);
      const history = Array.isArray(data) ? data.map(normalizeMessage).filter(Boolean) : [];
      const finalMessages = history.length ? history : [createWelcomeMessage()];
      setMessages(finalMessages);
    } catch (error) {
      console.error("Failed to load chat messages", error);
      setMessages([createWelcomeMessage()]);
    }
  }, [fetchMessages]);

  const handleSocketMessage = useCallback((event) => {
    try {
      const payload = JSON.parse(event.data);
      switch (payload.type) {
        case "status":
          setStatusMessage(payload.message || "");
          if (payload.message) {
            setIsTyping(true);
          }
          break;
        case "message_received":
          setStatusMessage("");
          break;
        case "ai_response":
          appendMessage({ ...payload.data, role: "assistant" });
          setIsTyping(false);
          setIsSending(false);
          setStatusMessage("");
          setCurrentSession((prev) => prev ? {
            ...prev,
            message_count: (prev.message_count || 0) + 1,
            last_activity: new Date().toISOString(),
          } : prev);
          break;
        case "error":
          setIsTyping(false);
          setIsSending(false);
          setStatusMessage(payload.message || "مشکلی پیش آمد");
          appendMessage({
            id: `error-${Date.now()}`,
            role: "system",
            content: payload.message || "مشکلی پیش آمد. لطفاً دوباره تلاش کنید.",
            timestamp: new Date().toISOString(),
          });
          break;
        default:
          break;
      }
    } catch (error) {
      console.error("Failed to parse WebSocket message", error);
    }
  }, [appendMessage]);

  const connectWebSocket = useCallback(async (chatId, attempt = 0) => {
    if (!chatId) {
      return;
    }

    try {
      const token = await getAccessToken();
      if (!token) {
        setStatusMessage("برای گفتگو باید وارد شوید.");
        return;
      }
      const wsUrl = buildWsUrl(chatId, token);

      if (!wsUrl) {
        console.warn("Unable to determine WebSocket URL");
        setStatusMessage("نشانی سرور گفت‌وگو نامشخص است.");
        return;
      }

      if (socketRef.current) {
        socketRef.current.close(1000, "Reconnecting");
      }

      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setSocketConnected(true);
        setStatusMessage("");
        setIsTyping(false);
      };

      ws.onmessage = handleSocketMessage;

      ws.onerror = () => {
        ws.close();
      };

      ws.onclose = (event) => {
        setSocketConnected(false);
        setIsTyping(false);
        socketRef.current = null;

        if (event.code === 4003) {
          setStatusMessage("دسترسی مجاز نیست. لطفاً دوباره وارد شوید.");
        } else if (event.code === 4004) {
          setStatusMessage("گفتگو پیدا نشد یا دسترسی ندارید.");
        } else if (event.code === 4008) {
          setStatusMessage("این گفتگو بایگانی شده است.");
        } else if (!event.wasClean) {
          setStatusMessage("اتصال به سرور برقرار نشد. تلاش دوباره...");
        }

        const shouldRetry = ![4003, 4004, 4008].includes(event.code) && attempt < 5;
        if (shouldRetry) {
          const nextAttempt = attempt + 1;
          const delay = Math.min(5000, 1000 * nextAttempt);
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket(chatId, nextAttempt);
          }, delay);
        }
      };
    } catch (error) {
      console.error("Failed to establish WebSocket connection", error);
    }
  }, [getAccessToken, handleSocketMessage]);

  const pickChatFromLists = useCallback(async (chatId) => {
    const numericId = Number(chatId);
    if (!Number.isFinite(numericId)) {
      return null;
    }

    const active = await listActiveChats();
    let chat = active.find((item) => item.id === numericId);

    if (!chat) {
      const archived = await listArchivedChats();
      chat = archived.find((item) => item.id === numericId) || null;
    }

    return chat;
  }, [listActiveChats, listArchivedChats]);

  const createNewSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const chat = await createChat();
      setCurrentSession(chat);
      setStatusMessage("");

      if (chat?.id) {
        router.replace(`/Chat?sessionId=${chat.id}`, undefined, { shallow: true });
        await connectWebSocket(chat.id);
      }
    } catch (error) {
      console.error("Failed to create chat", error);
      setStatusMessage("ایجاد گفتگو ناموفق بود");
    } finally {
      setIsLoading(false);
    }
  }, [connectWebSocket, createChat, router]);

  const loadSession = useCallback(async (chatId) => {
    setIsLoading(true);
    try {
      const chat = await pickChatFromLists(chatId);
      if (!chat) {
        console.warn(`Chat with ID ${chatId} not found, creating a new one.`);
        await createNewSession();
        return;
      }

      setCurrentSession(chat);
      await loadMessages(chat.id);
      await connectWebSocket(chat.id);
    } catch (error) {
      console.error("Failed to load chat session", error);
      setStatusMessage("بارگذاری گفتگو ناموفق بود");
    } finally {
      setIsLoading(false);
    }
  }, [connectWebSocket, createNewSession, loadMessages, pickChatFromLists]);

  useEffect(() => {
    if (!router.isReady || initializing || !isAuthenticated) {
      return;
    }

    const { sessionId } = router.query;
    const resolvedId = Array.isArray(sessionId) ? sessionId[0] : sessionId;

    if (!resolvedId) {
      createNewSession();
      return;
    }

    const numericId = Number(resolvedId);
    if (currentSession?.id === numericId) {
      if (!socketRef.current) {
        connectWebSocket(numericId);
      }
      return;
    }

    loadSession(resolvedId);
  }, [
    router,
    initializing,
    isAuthenticated,
    currentSession,
    connectWebSocket,
    createNewSession,
    loadSession,
  ]);

  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close(1000, "Component unmounted");
        socketRef.current = null;
      }
    };
  }, []);

  const handleSendMessage = useCallback(async (content) => {
    if (!content || !currentSession?.id) {
      return;
    }

    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setStatusMessage("ارتباط با سرور برقرار نیست. لطفاً لحظه‌ای دیگر تلاش کنید.");
      return;
    }

    const now = new Date().toISOString();
    appendMessage({
      id: `local-${Date.now()}`,
      role: "user",
      content,
      timestamp: now,
    });

    setIsSending(true);
    setIsTyping(true);
    setStatusMessage("");
    setCurrentSession((prev) => prev ? {
      ...prev,
      message_count: (prev.message_count || 0) + 1,
      last_activity: now,
    } : prev);

    try {
      socketRef.current.send(JSON.stringify({ content }));
    } catch (error) {
      console.error("Failed to send message", error);
      setIsSending(false);
      setIsTyping(false);
      setStatusMessage("ارسال پیام ناموفق بود");
    }
  }, [appendMessage, currentSession]);

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 px-4 md:px-6 py-4 md:ml-72">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="hover:bg-slate-800 p-2 rounded-lg transition-colors duration-200 text-white md:hidden" />
            <div className={`w-2 h-2 rounded-full ${socketConnected ? "bg-green-400" : "bg-red-500"} animate-pulse hidden md:block`} />
            <div>
              <h1 className="text-base md:text-lg font-semibold text-white truncate max-w-[150px] sm:max-w-xs md:max-w-md">
                {currentSession?.title || "دستیار هوشمند آری"}
              </h1>
              <p className="text-xs md:text-sm text-slate-400">
                {socketConnected ? "همیشه در خدمت شما" : "در حال تلاش برای اتصال..."}
              </p>
            </div>
          </div>

          <Button
            onClick={createNewSession}
            variant="outline"
            size="sm"
            className="border-slate-700 hover:border-blue-500 text-slate-300 hover:text-blue-400 bg-transparent"
            disabled={isSending}
          >
            <Plus className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">چت جدید</span>
          </Button>
        </div>
      </div>

      {/* Scrollable Messages Area */}
      <div className="flex-1 overflow-y-auto pt-16 pb-20">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {isLoading ? (
            <div className="text-center py-10">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-400">در حال آماده‌سازی گفتگو...</p>
            </div>
          ) : !hasMessages ? (
            <div className="max-w-md mx-auto py-12 px-6 bg-slate-800/60 border border-slate-700 rounded-3xl shadow-xl backdrop-blur-sm">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4 shadow-lg transform-gpu hover:scale-105 transition-transform">
                  <Sparkles className="w-9 h-9 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">هر سوالی داری بپرس</h2>
                <p className="text-sm text-slate-300 mb-6">هر سوالی داشتی بپرس، من اینجا هستم تا کمک کنم!</p>
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

          {statusMessage && (
            <div className="text-center text-xs text-slate-400 mt-4">
              {statusMessage}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed Chat Input */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:ml-72">
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isSending || !socketConnected}
          placeholder="هر سوالی داری بپرس..."
        />
      </div>
    </div>
  );
}
