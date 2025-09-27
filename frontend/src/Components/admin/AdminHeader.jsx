import React from "react";
import { Shield, MessageSquare, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

function AdminHeader({ user, onNavigateToChat, onLogout }) {
  return (
    <div className="bg-slate-900/80 border-b border-slate-800 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">پنل مدیریت</h1>
              <p className="text-sm text-slate-400">خوش آمدید، {user.full_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={onNavigateToChat}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              چت
            </Button>
            <Button
              onClick={onLogout}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4 mr-2" />
              خروج
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminHeader;
