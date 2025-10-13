import React from "react";
import { useTheme } from "@/context/ThemeContext";

function AdminNavigation({ tabs, activeTab, onTabChange }) {
  const { isDark } = useTheme();
  
  return (
    <div className={`border-b transition-colors duration-300 ${
      isDark 
        ? 'bg-slate-900/50 border-slate-800' 
        : 'bg-white/50 border-slate-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 py-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === id
                  ? isDark 
                    ? "bg-slate-800 text-white" 
                    : "bg-slate-200 text-slate-800"
                  : isDark 
                    ? "text-slate-400 hover:text-white hover:bg-slate-800/50" 
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminNavigation;
