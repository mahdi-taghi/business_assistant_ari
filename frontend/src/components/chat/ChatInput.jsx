import React, { useState, useRef, useEffect, memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Smile, Paperclip, Mic } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { detectTextDirection } from "@/utils";

const ChatInput = memo(function ChatInput({ onSendMessage, isLoading, placeholder = "پیام خود را بنویسید..." }) {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [textDirection, setTextDirection] = useState("rtl");
  const textareaRef = useRef(null);

  // Simple auto-resize function
  const autoResize = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto
    textarea.style.height = "auto";
    
    // Get the scroll height
    const scrollHeight = textarea.scrollHeight;
    
    // Calculate max height for 5 lines (approximately 120px)
    const maxHeight = 120;
    const minHeight = 40;
    
    // Set new height (min 40px, max 120px)
    const newHeight = Math.max(minHeight, Math.min(scrollHeight, maxHeight));
    textarea.style.height = `${newHeight}px`;
    
    // Handle overflow - show scroll after 5 lines
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
      className="bg-slate-900/95 backdrop-blur-md p-4 md:p-6"
    >
      <div className="max-w-5xl mx-auto">
        <form onSubmit={handleSubmit} className="w-full">
          <motion.div 
            className={`relative rounded-2xl transition-all duration-300 ${
              isFocused 
                ? 'bg-slate-800/80 border-2 border-blue-500/50 shadow-lg shadow-blue-500/10' 
                : 'bg-slate-800/60 border border-slate-700/50 hover:border-slate-600/50'
            }`}
            animate={{
              scale: isFocused ? 1.02 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            {/* Main input container */}
            <div className="relative flex items-end p-3">
              {/* Left side buttons */}
              <div className="flex items-center gap-2 mr-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 text-slate-400 hover:text-slate-300 hover:bg-slate-700/50 rounded-lg"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 text-slate-400 hover:text-slate-300 hover:bg-slate-700/50 rounded-lg"
                >
                  <Smile className="w-4 h-4" />
                </Button>
              </div>

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
                  className={`w-full resize-none border-0 bg-transparent text-slate-100 placeholder:text-slate-400 focus:ring-0 focus:outline-none text-base leading-relaxed py-2 px-3 rounded-lg ${
                    textDirection === "rtl" ? "text-right" : "text-left"
                  }`}
                  style={{ 
                    minHeight: '40px', 
                    height: '40px',
                    overflowY: 'hidden',
                    boxSizing: 'border-box',
                    lineHeight: '1.5',
                    fontSize: '16px',
                    unicodeBidi: 'plaintext'
                  }}
                  rows={1}
                />
              </div>

              {/* Right side buttons */}
              <div className="flex items-center gap-2 ml-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 text-slate-400 hover:text-slate-300 hover:bg-slate-700/50 rounded-lg"
                >
                  <Mic className="w-4 h-4" />
                </Button>

                <Button
                  type="submit"
                  size="lg"
                  disabled={!message.trim() || isLoading}
                  className={`h-11 w-11 p-0 rounded-xl transition-all duration-200 ${
                    message.trim() && !isLoading
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 shadow-lg hover:shadow-blue-500/25'
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  ) : (
                    <Send className="w-5 h-5 text-white" />
                  )}
                </Button>
              </div>
            </div>

            {/* Character count */}
            <AnimatePresence>
              {message.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute -bottom-6 right-3 text-xs text-slate-400"
                >
                  {message.length}/2000
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          
          {/* Helper text */}
          <div className="flex justify-between items-center mt-3 px-2">
            <motion.p 
              className="text-xs text-slate-400"
              animate={{ opacity: isFocused ? 1 : 0.7 }}
            >
              Enter برای ارسال، Shift+Enter برای خط جدید
            </motion.p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>آنلاین</span>
            </div>
          </div>
        </form>
      </div>
    </motion.div>
  );
});

export default ChatInput;
