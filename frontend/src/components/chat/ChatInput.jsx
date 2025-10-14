import React, { useState, useRef, useEffect, memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { detectTextDirection } from "@/utils";
import { useTheme } from "@/context/ThemeContext";

const ChatInput = memo(function ChatInput({ onSendMessage, isLoading, placeholder = "پیام خود را بنویسید..." }) {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [textDirection, setTextDirection] = useState("rtl");
  const textareaRef = useRef(null);
  const { isDark } = useTheme();

  // Simple auto-resize function
  const autoResize = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto
    textarea.style.height = "auto";
    
    // Get the scroll height
    const scrollHeight = textarea.scrollHeight;
    
    // Calculate max height for 4 lines (approximately 96px)
    const maxHeight = 96;
    const minHeight = 32;
    
    // Set new height (min 32px, max 96px)
    const newHeight = Math.max(minHeight, Math.min(scrollHeight, maxHeight));
    textarea.style.height = `${newHeight}px`;
    
    // Handle overflow - show scroll after 4 lines
    if (scrollHeight > maxHeight) {
      textarea.style.overflowY = "auto";
      // Add scrollbar styling
      textarea.classList.add("scrollable");
    } else {
      textarea.style.overflowY = "hidden";
      textarea.classList.remove("scrollable");
    }
  };

  // Auto-resize when message changes
  useEffect(() => {
    autoResize();
  }, [message]);

  // Reset textarea height when message is cleared
  useEffect(() => {
    if (!message && textareaRef.current) {
      textareaRef.current.style.height = '32px';
    }
  }, [message]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage("");
      setTextDirection("rtl");
    }
  }, [message, isLoading, onSendMessage]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  const handleInputChange = useCallback((e) => {
    const { value } = e.target;
    setMessage(value);
    setTextDirection(detectTextDirection(value));
  }, []);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`backdrop-blur-md p-2 md:p-3 transition-all duration-500 ${
        isDark ? 'bg-slate-900/20' : 'bg-white/20'
      }`}
      style={{
        background: isDark 
          ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.1) 0%, rgba(30, 41, 59, 0.1) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(248, 250, 252, 0.1) 100%)'
      }}
    >
      {/* اضافه کردن افکت نور پس‌زمینه */}
      <div className={`absolute inset-0 rounded-xl transition-opacity duration-300 ${
        isFocused ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-xl blur-lg" />
      </div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        <form onSubmit={handleSubmit} className="w-full">
          <motion.div 
            className={`relative rounded-2xl transition-all duration-300 ${
              isFocused 
                ? 'border-2 border-blue-400/40 shadow-lg shadow-blue-500/10' 
                : 'border border-slate-300/30 hover:border-blue-300/30'
            } ${
              isDark 
                ? isFocused 
                  ? 'bg-slate-800/20 border-slate-700/30' 
                  : 'bg-slate-800/10 border-slate-700/20'
                : isFocused 
                  ? 'bg-slate-50/20 border-slate-300/30' 
                  : 'bg-white/10 border-slate-300/20'
            }`}
            animate={{
              scale: isFocused ? 1.01 : 1,
              boxShadow: isFocused 
                ? '0 10px 25px -5px rgba(59, 130, 246, 0.15)' 
                : '0 2px 4px -1px rgba(0, 0, 0, 0.05)'
            }}
            transition={{ duration: 0.3 }}
          >
            {/* Main input container */}
            <div className="relative flex items-end p-2">

              {/* Textarea */}
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder={placeholder}
                  disabled={isLoading}
                  dir={textDirection}
                  className={`w-full resize-none border-0 bg-transparent focus:ring-0 focus:outline-none text-sm leading-relaxed py-1.5 px-2 rounded-lg transition-colors duration-300 ${
                    isDark 
                      ? 'text-slate-100 placeholder:text-slate-400' 
                      : 'text-slate-800 placeholder:text-slate-500'
                  } ${
                    textDirection === "rtl" ? "text-right" : "text-left"
                  }`}
                  style={{ 
                    minHeight: '32px', 
                    height: '32px',
                    overflowY: 'hidden',
                    boxSizing: 'border-box',
                    lineHeight: '1.4',
                    fontSize: '14px',
                    unicodeBidi: 'plaintext',
                    // Prevent zoom on mobile
                    WebkitTextSizeAdjust: '100%',
                    MsTextSizeAdjust: '100%',
                    textSizeAdjust: '100%'
                  }}
                  rows={1}
                />
              </div>

              {/* Right side buttons */}
              <div className="flex items-center gap-1.5 ml-2">
                <motion.div
                  whileHover={{ scale: message.trim() && !isLoading ? 1.05 : 1 }}
                  whileTap={{ scale: message.trim() && !isLoading ? 0.95 : 1 }}
                >
                  <button
                    type="submit"
                    disabled={!message.trim() || isLoading}
                    className={`h-8 w-8 p-0 rounded-xl transition-all duration-300 inline-flex items-center justify-center font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                      message.trim() && !isLoading
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 shadow-md hover:shadow-blue-500/20'
                        : isDark 
                          ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                          : 'bg-slate-300/50 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Send className="w-4 h-4 text-white" />
                    )}
                  </button>
                </motion.div>
              </div>
            </div>

          </motion.div>
          
        </form>
      </div>
    </motion.div>
  );
});

export default ChatInput;
