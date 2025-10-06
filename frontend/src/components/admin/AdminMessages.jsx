import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Search } from "lucide-react";

function AdminMessages({ messages, searchTerm, onSearchChange }) {
  const filteredMessages = messages.filter(message => 
    message.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="bg-slate-900/80 border-slate-800">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <FileText className="w-5 h-5" />
          مدیریت پیام‌ها
        </h2>
      </div>
      <div className="p-6">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="جستجو در پیام‌ها..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white"
            />
          </div>
        </div>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {filteredMessages.map((message) => (
            <div key={message.id} className="p-4 bg-slate-800/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-white">
                  {message.user?.full_name || message.user?.email || "کاربر ناشناس"}
                </p>
                <Badge variant={message.role === "user" ? "default" : "secondary"}>
                  {message.role}
                </Badge>
              </div>
              <p className="text-sm text-slate-300 mb-2">{message.content}</p>
              <p className="text-xs text-slate-500">
                {new Date(message.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export default AdminMessages;
