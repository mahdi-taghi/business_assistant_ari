import React from "react";
import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
// small helper to format time as HH:mm
function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '';
  }
}

export default function MessageBubble({ message, isLatest }) {
  const role = message?.role || message?.sender_type || "assistant";
  const isUser = role === "user";
  const isSystem = role === "system";
  const timestamp = message?.timestamp || message?.created_at;

  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex justify-center mb-4"
      >
        <div className="text-xs text-slate-400 bg-slate-800/60 border border-slate-700/50 px-3 py-2 rounded-full">
          {message.content}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex gap-3 mb-6 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}
      
      <div className={`max-w-[80%] ${isUser ? "flex flex-col items-end" : ""}`}>
        <div
          className={`
            relative px-4 py-3 rounded-2xl shadow-lg backdrop-blur-sm
            ${isUser 
              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white ml-12" 
              : "bg-slate-800/90 text-slate-100 border border-slate-700/50"
            }
          `}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
          
          {/* Message tail */}
          <div
            className={`
              absolute top-3 w-2 h-2 transform rotate-45
              ${isUser 
                ? "-right-1 bg-blue-500" 
                : "-left-1 bg-slate-800 border-l border-t border-slate-700/50"
              }
            `}
          />
        </div>
        
        {timestamp && (
          <p className="text-xs text-slate-400 mt-1 px-2">{formatTime(timestamp)}</p>
        )}
      </div>
      
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0 shadow-lg">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </motion.div>
  );
}
