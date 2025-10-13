import React, { memo } from "react";
import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import { detectTextDirection, formatTime } from "@/utils";
import { useTheme } from "@/context/ThemeContext";

const MessageBubble = memo(function MessageBubble({ message, isLatest }) {
  const role = message?.role || message?.sender_type || "assistant";
  const isUser = role === "user";
  const isSystem = role === "system";
  const timestamp = message?.timestamp || message?.created_at;
  const content = message?.content || "";
  const textDirection = detectTextDirection(content);
  const { isDark } = useTheme();

  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex justify-center mb-4"
      >
        <div
          dir={textDirection}
          className={`text-xs px-3 py-2 rounded-full transition-colors duration-300 ${
            isDark 
              ? 'text-slate-400 bg-slate-800/60 border border-slate-700/50' 
              : 'text-slate-500 bg-slate-100/60 border border-slate-300/50'
          } ${
            textDirection === "rtl" ? "text-right" : "text-left"
          }`}
          style={{ unicodeBidi: "plaintext" }}
        >
          {content}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex gap-3 mb-6 ${isUser ? "justify-start" : "justify-end"}`}
    >
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0 shadow-lg">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
      
      <div className={`max-w-[80%] ${!isUser ? "flex flex-col items-end" : ""}`}>
        <div
          className={`
            relative px-4 py-3 rounded-2xl shadow-lg backdrop-blur-sm transition-colors duration-300
            ${isUser 
              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white" 
              : isDark 
                ? "bg-slate-800/90 text-slate-100 border border-slate-700/50"
                : "bg-white/90 text-slate-800 border border-slate-300/50"
            }
          `}
        >
          <p
            dir={textDirection}
            className={`text-sm leading-relaxed whitespace-pre-wrap ${
              textDirection === "rtl" ? "text-right" : "text-left"
            }`}
            style={{ unicodeBidi: "plaintext" }}
          >
            {content}
          </p>
          
          {/* Message tail - only for bot messages */}
          {!isUser && (
            <div className={`absolute top-3 -left-1 w-2 h-2 transform rotate-45 transition-colors duration-300 ${
              isDark 
                ? 'bg-slate-800 border-l border-t border-slate-700/50' 
                : 'bg-white border-l border-t border-slate-300/50'
            }`} />
          )}
        </div>
        
        {timestamp && (
          <p className={`text-xs mt-1 px-2 transition-colors duration-300 ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>{formatTime(timestamp)}</p>
        )}
      </div>
      
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}
    </motion.div>
  );
});

export default MessageBubble;
