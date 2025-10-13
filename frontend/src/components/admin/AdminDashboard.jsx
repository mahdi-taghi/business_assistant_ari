import React, { memo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";
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
  const { isDark } = useTheme();
  
  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className={`p-6 transition-colors duration-300 ${
          isDark 
            ? 'bg-slate-900/80 border-slate-800' 
            : 'bg-white/80 border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm transition-colors duration-300 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>کل کاربران</p>
              <p className={`text-2xl font-bold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-slate-800'
              }`}>{stats.totalUsers}</p>
            </div>
            <Users className="w-8 h-8 text-blue-400" />
          </div>
        </Card>

        <Card className={`p-6 transition-colors duration-300 ${
          isDark 
            ? 'bg-slate-900/80 border-slate-800' 
            : 'bg-white/80 border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm transition-colors duration-300 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>کاربران فعال</p>
              <p className={`text-2xl font-bold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-slate-800'
              }`}>{stats.activeUsers}</p>
            </div>
            <UserCheck className="w-8 h-8 text-green-400" />
          </div>
        </Card>

        <Card className={`p-6 transition-colors duration-300 ${
          isDark 
            ? 'bg-slate-900/80 border-slate-800' 
            : 'bg-white/80 border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm transition-colors duration-300 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>کل چت‌ها</p>
              <p className={`text-2xl font-bold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-slate-800'
              }`}>{stats.totalChats}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-purple-400" />
          </div>
        </Card>

        <Card className={`p-6 transition-colors duration-300 ${
          isDark 
            ? 'bg-slate-900/80 border-slate-800' 
            : 'bg-white/80 border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm transition-colors duration-300 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>کل پیام‌ها</p>
              <p className={`text-2xl font-bold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-slate-800'
              }`}>{stats.totalMessages}</p>
            </div>
            <Activity className="w-8 h-8 text-orange-400" />
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
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
            <Settings className="w-5 h-5" />
            اقدامات سریع
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className={`h-16 transition-colors duration-300 ${
                isDark 
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800' 
                  : 'border-slate-300 text-slate-600 hover:bg-slate-100'
              }`}
              onClick={onRefresh}
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              بروزرسانی داده‌ها
            </Button>
            <Button
              variant="outline"
              className={`h-16 transition-colors duration-300 ${
                isDark 
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800' 
                  : 'border-slate-300 text-slate-600 hover:bg-slate-100'
              }`}
              onClick={() => onNavigateToTab("email-logs")}
            >
              <Mail className="w-5 h-5 mr-2" />
              لاگ ایمیل
            </Button>
            <Button
              variant="outline"
              className={`h-16 transition-colors duration-300 ${
                isDark 
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800' 
                  : 'border-slate-300 text-slate-600 hover:bg-slate-100'
              }`}
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
