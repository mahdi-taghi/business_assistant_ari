import React, { memo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  UserCheck, 
  MessageSquare, 
  Activity, 
  Settings, 
  RefreshCw, 
  Mail, 
  AlertTriangle 
} from "lucide-react";

const AdminDashboard = memo(function AdminDashboard({ stats, onRefresh, onNavigateToTab }) {
  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-slate-900/80 border-slate-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">کل کاربران</p>
              <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
            </div>
            <Users className="w-8 h-8 text-blue-400" />
          </div>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">کاربران فعال</p>
              <p className="text-2xl font-bold text-white">{stats.activeUsers}</p>
            </div>
            <UserCheck className="w-8 h-8 text-green-400" />
          </div>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">کل چت‌ها</p>
              <p className="text-2xl font-bold text-white">{stats.totalChats}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-purple-400" />
          </div>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">کل پیام‌ها</p>
              <p className="text-2xl font-bold text-white">{stats.totalMessages}</p>
            </div>
            <Activity className="w-8 h-8 text-orange-400" />
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-slate-900/80 border-slate-800">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Settings className="w-5 h-5" />
            اقدامات سریع
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800 h-16"
              onClick={onRefresh}
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              بروزرسانی داده‌ها
            </Button>
            <Button
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800 h-16"
              onClick={() => onNavigateToTab("email-logs")}
            >
              <Mail className="w-5 h-5 mr-2" />
              لاگ ایمیل
            </Button>
            <Button
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800 h-16"
              onClick={() => onNavigateToTab("error-logs")}
            >
              <AlertTriangle className="w-5 h-5 mr-2" />
              لاگ خطا
            </Button>
          </div>
        </div>
      </Card>
    </>
  );
});

export default AdminDashboard;
