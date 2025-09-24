import React from "react";
import { motion } from "framer-motion";
import { MessageSquare, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { format, formatDistanceToNow } from "date-fns";

export default function SessionCard({ session, onClick }) {
  return (
    <motion.div
      
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      
    >
      <Card 
        className="bg-slate-800/50 border-slate-700/50 hover:border-blue-500/30 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
        onClick={() => onClick(session)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-4 h-4 text-blue-400" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-white truncate mb-1">
                {session.title}
              </h3>
              
              {session.first_message_preview && (
                <p className="text-sm text-slate-400 line-clamp-2 mb-2">
                  {session.first_message_preview}
                </p>
              )}
              
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-slate-500">
                  <MessageSquare className="w-3 h-3" />
                  <span>{session.message_count || 0} messages</span>
                </div>
                
                <div className="flex items-center gap-1 text-slate-500">
                  <Clock className="w-3 h-3" />
                  <span>
                    {session.last_activity 
                      ? formatDistanceToNow(new Date(session.last_activity), { addSuffix: true })
                      : formatDistanceToNow(new Date(session.created_date), { addSuffix: true })
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}