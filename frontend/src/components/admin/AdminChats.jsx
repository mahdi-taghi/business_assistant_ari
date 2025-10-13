import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/context/ThemeContext";
import { MessageSquare, Search, Eye } from "lucide-react";

function AdminChats({ chats, searchTerm, onSearchChange, onNavigateToMessages }) {
  const { isDark } = useTheme();
  
  const filteredChats = chats.filter(chat => 
    chat.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className={`transition-colors duration-300 ${
      isDark 
        ? 'bg-slate-900/80 border-slate-800' 
        : 'bg-white/80 border-slate-200'
    }`}>
      <div className={`p-6 border-b transition-colors duration-300 ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <h2 className={`text-xl font-semibold flex items-center gap-2 transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-slate-800'
        }`}>
          <MessageSquare className="w-5 h-5" />
          مدیریت چت‌ها
        </h2>
      </div>
      <div className="p-6">
        <div className="mb-4">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`} />
            <Input
              placeholder="جستجو در چت‌ها..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`pl-10 transition-colors duration-300 ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-white' 
                  : 'bg-white border-slate-300 text-slate-800'
              }`}
            />
          </div>
        </div>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {filteredChats.map((chat) => (
            <div key={chat.id} className={`p-4 rounded-lg transition-colors duration-300 ${
              isDark ? 'bg-slate-800/50' : 'bg-slate-100/50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <p className={`font-medium transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-slate-800'
                }`}>
                  {chat.user?.full_name || chat.user?.email || "کاربر ناشناس"}
                </p>
                <div className="flex gap-2">
                  <Badge variant="outline">
                    {chat.message_count || 0} پیام
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onNavigateToMessages()}
                    className={`transition-colors duration-300 ${
                      isDark 
                        ? 'border-slate-700 text-slate-300 hover:bg-slate-800' 
                        : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className={`text-sm transition-colors duration-300 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                آخرین فعالیت: {new Date(chat.last_activity).toLocaleString()}
              </p>
              {chat.title && (
                <p className={`text-xs mt-1 truncate transition-colors duration-300 ${
                  isDark ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  {chat.title}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export default AdminChats;
