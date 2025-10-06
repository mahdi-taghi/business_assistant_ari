import React from 'react';

export default function StatsCard({ title, value, icon: Icon, bgColor = 'bg-blue-500', description }) {
  return (
    <div className={`p-4 rounded-lg ${bgColor} bg-opacity-10`}> 
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-300">{title}</div>
          <div className="text-2xl font-bold text-white">{value}</div>
          <div className="text-xs text-slate-400">{description}</div>
        </div>
        <div>
          {Icon && <Icon className="w-8 h-8 text-white opacity-80" />}
        </div>
      </div>
    </div>
  );
}
