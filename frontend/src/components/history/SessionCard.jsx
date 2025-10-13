import React from 'react';
import { Trash2 } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

function formatRelative(isoDate) {
  if (!isoDate) return '';
  try {
    const date = new Date(isoDate);
    return date.toLocaleString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'long',
    });
  } catch (error) {
    return '';
  }
}

export default function SessionCard({ session, onClick, onDelete }) {
  const preview = session.first_message_preview || session.last_message?.content || 'بدون پیام';
  const lastActivity = formatRelative(session.last_activity || session.created_at);
  const { isDark } = useTheme();

  const handleDelete = (e) => {
    e.stopPropagation(); // Prevent triggering onClick
    onDelete?.(session);
  };

  return (
    <div
      onClick={() => onClick?.(session)}
      className={`p-4 rounded-xl cursor-pointer border transition duration-200 group ${
        isDark 
          ? 'bg-slate-800/50 border-slate-700/40 hover:border-blue-500/40' 
          : 'bg-white/50 border-slate-300/40 hover:border-blue-500/40'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`font-medium truncate max-w-[70%] transition-colors duration-200 ${
          isDark ? 'text-white' : 'text-slate-800'
        }`}>{session.title || 'گفتگو بدون عنوان'}</div>
        <div className="flex items-center gap-2">
          <div className={`text-xs px-3 py-1 rounded-full transition-colors duration-200 ${
            isDark 
              ? 'text-slate-400 bg-slate-700/60' 
              : 'text-slate-500 bg-slate-200/60'
          }`}>
            {session.message_count || 0} پیام
          </div>
          {onDelete && (
            <button
              onClick={handleDelete}
              className={`opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 hover:bg-red-500/20 rounded-lg ${
                isDark 
                  ? 'text-slate-400 hover:text-red-400' 
                  : 'text-slate-500 hover:text-red-500'
              }`}
              title="حذف گفتگو"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <div className={`text-xs overflow-hidden text-ellipsis whitespace-nowrap transition-colors duration-200 ${
        isDark ? 'text-slate-300' : 'text-slate-600'
      }`}>
        {preview}
      </div>
      {lastActivity && (
        <div className={`text-[10px] mt-3 transition-colors duration-200 ${
          isDark ? 'text-slate-500' : 'text-slate-400'
        }`}>
          آخرین فعالیت: {lastActivity}
        </div>
      )}
    </div>
  );
}
