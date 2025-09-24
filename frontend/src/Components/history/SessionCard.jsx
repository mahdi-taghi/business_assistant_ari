import React from 'react';

export default function SessionCard({ session, onClick }) {
  return (
    <div onClick={() => onClick?.(session)} className="p-3 bg-slate-800/40 rounded-lg cursor-pointer">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium text-white">{session.title}</div>
          <div className="text-xs text-slate-400">{session.first_message_preview}</div>
        </div>
        <div className="text-xs text-slate-400">{session.message_count || 0}</div>
      </div>
    </div>
  );
}
