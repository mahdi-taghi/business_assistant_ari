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
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.4, 
        ease: "easeOut",
        type: "spring",
        stiffness: 100
      }}
      className={`flex gap-3 mb-6 ${isUser ? "justify-start" : "justify-end"}`}
    >
      {isUser && (
        <motion.div 
          className="w-10 h-10 rounded-full bg-gradient-to-r from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0 shadow-lg"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <User className="w-5 h-5 text-white" />
        </motion.div>
      )}
      
      <div className={`max-w-[80%] ${!isUser ? "flex flex-col items-end" : ""}`}>
        <motion.div
          className={`
            relative px-5 py-4 rounded-3xl shadow-xl backdrop-blur-sm transition-all duration-300
            ${isUser 
              ? "bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white" 
              : isDark 
                ? "bg-slate-800/90 text-slate-100 border border-slate-700/50"
                : "bg-white/90 text-slate-800 border border-slate-300/50"
            }
          `}
          whileHover={{ scale: 1.02 }}
          style={{
            background: isUser 
              ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
              : undefined
          }}
        >
          {/* اضافه کردن افکت نور برای پیام‌های کاربر */}
          {isUser && (
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-xl" />
          )}
          <p
            dir={textDirection}
            className={`text-sm leading-relaxed whitespace-pre-wrap relative z-10 break-words overflow-wrap-anywhere ${
              textDirection === "rtl" ? "text-right" : "text-left"
            }`}
            style={{ 
              unicodeBidi: "plaintext",
              wordBreak: "break-word",
              overflowWrap: "anywhere"
            }}
          >
            {content}
          </p>
          
          {/* بهبود tail پیام */}
          {!isUser && (
            <div className={`absolute top-4 -left-2 w-0 h-0 transition-colors duration-300 ${
              isDark 
                ? 'border-r-[12px] border-r-slate-800 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent' 
                : 'border-r-[12px] border-r-white border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent'
            }`} />
          )}
        </motion.div>
        
        {timestamp && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={`text-xs mt-2 px-3 py-1 rounded-full transition-colors duration-300 ${
              isDark ? 'text-slate-400 bg-slate-800/50' : 'text-slate-500 bg-slate-100/50'
            }`}
          >
            {formatTime(timestamp)}
          </motion.p>
        )}
      </div>
      
      {!isUser && (
        <motion.div 
          className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Bot className="w-5 h-5 text-white" />
        </motion.div>
      )}
    </motion.div>
  );
});

export default MessageBubble;