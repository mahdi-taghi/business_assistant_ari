import React from 'react';
import { Trash2 } from 'lucide-react';

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

  const handleDelete = (e) => {
    e.stopPropagation(); // Prevent triggering onClick
    onDelete?.(session);
  };

  return (
    <div
      onClick={() => onClick?.(session)}
      className="p-4 bg-slate-800/50 rounded-xl cursor-pointer border border-slate-700/40 hover:border-blue-500/40 transition duration-200 group"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium text-white truncate max-w-[70%]">{session.title || 'گفتگو بدون عنوان'}</div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-slate-400 bg-slate-700/60 px-3 py-1 rounded-full">
            {session.message_count || 0} پیام
          </div>
          {onDelete && (
            <button
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400"
              title="حذف گفتگو"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <div className="text-xs text-slate-300 overflow-hidden text-ellipsis whitespace-nowrap">
        {preview}
      </div>
      {lastActivity && (
        <div className="text-[10px] text-slate-500 mt-3">
          آخرین فعالیت: {lastActivity}
        </div>
      )}
    </div>
  );
}
