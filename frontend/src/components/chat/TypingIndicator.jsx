import React from "react";
import { motion } from "framer-motion";
import { Bot } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

/**
 * TypingIndicator component that shows animated typing dots
 * @returns {React.ReactNode} Typing indicator component
 */
export default function TypingIndicator() {
  const { isDark } = useTheme();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex gap-3 mb-6 justify-end"
    >
      <div className="max-w-[80%] flex flex-col items-end">
        <motion.div 
          className={`relative rounded-3xl px-5 py-4 backdrop-blur-sm transition-colors duration-300 ${
            isDark 
              ? 'bg-slate-800/90 border border-slate-700/50' 
              : 'bg-white/90 border border-slate-300/50'
          }`}
          animate={{
            boxShadow: [
              "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              "0 25px 50px -12px rgba(59, 130, 246, 0.25)",
              "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="flex space-x-1">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: index * 0.2,
                }}
                className="w-2.5 h-2.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
              />
            ))}
          </div>
          
          {/* بهبود tail */}
          <div className={`absolute top-5 -left-2 w-0 h-0 transition-colors duration-300 ${
            isDark 
              ? 'border-r-[12px] border-r-slate-800 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent' 
              : 'border-r-[12px] border-r-white border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent'
          }`} />
        </motion.div>
      </div>
      
      <motion.div 
        className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg"
        animate={{
          scale: [1, 1.1, 1],
          boxShadow: [
            "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            "0 25px 50px -12px rgba(59, 130, 246, 0.4)",
            "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
          ]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Bot className="w-5 h-5 text-white" />
      </motion.div>
    </motion.div>
  );
}
