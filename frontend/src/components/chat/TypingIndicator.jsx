import React from "react";
import { motion } from "framer-motion";
import { Bot } from "lucide-react";

/**
 * TypingIndicator component that shows animated typing dots
 * @returns {React.ReactNode} Typing indicator component
 */
export default function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex gap-3 mb-6 justify-end"
    >
      <div className="max-w-[80%] flex flex-col items-end">
        <div className="relative bg-slate-800/90 border border-slate-700/50 rounded-2xl px-4 py-3 backdrop-blur-sm">
          <div className="flex space-x-1">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: index * 0.2,
                }}
                className="w-2 h-2 bg-slate-400 rounded-full"
              />
            ))}
          </div>
          
          {/* Typing indicator tail */}
          <div className="absolute top-4 -left-1 w-0 h-0 border-r-[8px] border-r-slate-800 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent" />
        </div>
      </div>
      
      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg">
        <Bot className="w-4 h-4 text-white" />
      </div>
    </motion.div>
  );
}
