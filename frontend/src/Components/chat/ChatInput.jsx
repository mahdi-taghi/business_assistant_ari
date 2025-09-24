import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Smile, Paperclip, Mic } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatInput({ onSendMessage, isLoading, placeholder = "پیام خود را بنویسید..." }) {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage("");
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  // Reset height when message is cleared
  useEffect(() => {
    if (!message && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [message]);

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky bottom-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-700/50 p-4 md:p-6"
    >
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="w-full">
          <motion.div 
            className={`relative flex items-end gap-3 p-1 rounded-2xl transition-all duration-300 ${
              isFocused 
                ? 'bg-slate-800/80 border-2 border-blue-500/50 shadow-lg shadow-blue-500/10' 
                : 'bg-slate-800/60 border border-slate-700/50 hover:border-slate-600/50'
            }`}
            animate={{
              scale: isFocused ? 1.02 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            {/* Attachment and Emoji buttons */}
            <div className="flex items-center gap-1 pl-3 pb-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-400 hover:text-slate-300 hover:bg-slate-700/50 rounded-lg"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-400 hover:text-slate-300 hover:bg-slate-700/50 rounded-lg"
              >
                <Smile className="w-4 h-4" />
              </Button>
            </div>

            {/* Text input area */}
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={placeholder}
                disabled={isLoading}
                className="min-h-[48px] max-h-[120px] resize-none border-0 bg-transparent text-slate-100 placeholder:text-slate-400 focus:ring-0 focus:outline-none text-base leading-relaxed"
                rows={1}
                style={{ height: 'auto' }}
              />
              
              {/* Character count */}
              <AnimatePresence>
                {message.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute -bottom-6 right-0 text-xs text-slate-400"
                  >
                    {message.length}/2000
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Voice and Send buttons */}
            <div className="flex items-center gap-2 pr-2 pb-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-400 hover:text-slate-300 hover:bg-slate-700/50 rounded-lg"
              >
                <Mic className="w-4 h-4" />
              </Button>
              
              <Button
                type="submit"
                size="lg"
                disabled={!message.trim() || isLoading}
                className={`h-10 w-10 p-0 rounded-xl transition-all duration-200 ${
                  message.trim() && !isLoading
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 shadow-lg hover:shadow-blue-500/25'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Send className="w-4 h-4 text-white" />
                )}
              </Button>
            </div>
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
}
