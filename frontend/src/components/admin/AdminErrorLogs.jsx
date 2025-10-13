import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/context/ThemeContext";
import { AlertTriangle, Search } from "lucide-react";

function AdminErrorLogs({ errorLogs, searchTerm, onSearchChange }) {
  const { isDark } = useTheme();
  
  const filteredErrorLogs = errorLogs.filter(log => 
    log.error_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.message?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <AlertTriangle className="w-5 h-5" />
          لاگ خطا
        </h2>
      </div>
      <div className="p-6">
        <div className="mb-4">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`} />
            <Input
              placeholder="جستجو در لاگ خطا..."
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
          {filteredErrorLogs.map((log) => (
            <div key={log.id} className={`p-4 rounded-lg transition-colors duration-300 ${
              isDark ? 'bg-slate-800/50' : 'bg-slate-100/50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <p className={`font-medium transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-slate-800'
                }`}>{log.error_type}</p>
                <Badge variant="destructive">
                  {log.level}
                </Badge>
              </div>
              <p className={`text-sm mb-2 transition-colors duration-300 ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}>{log.message}</p>
              <p className={`text-xs transition-colors duration-300 ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {new Date(log.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export default AdminErrorLogs;
