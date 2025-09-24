import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MessageSquare, Search, Eye } from "lucide-react";

function AdminChats({ chats, searchTerm, onSearchChange, onNavigateToMessages }) {
  const filteredChats = chats.filter(chat => 
    chat.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="bg-slate-900/80 border-slate-800">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          مدیریت چت‌ها
        </h2>
      </div>
      <div className="p-6">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="جستجو در چت‌ها..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white"
            />
          </div>
        </div>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {filteredChats.map((chat) => (
            <div key={chat.id} className="p-4 bg-slate-800/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-white">
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
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-slate-400">
                آخرین فعالیت: {new Date(chat.last_activity).toLocaleString()}
              </p>
              {chat.title && (
                <p className="text-xs text-slate-500 mt-1 truncate">
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
