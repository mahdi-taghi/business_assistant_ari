import React from 'react';
import { useTheme } from '@/context/ThemeContext';

export default function StatsCard({ title, value, icon: Icon, bgColor = 'bg-blue-500', description }) {
  const { isDark } = useTheme();
  
  // Define gradient backgrounds based on the bgColor prop
  const getGradientClasses = (color) => {
    const gradients = {
      'bg-blue-500': isDark 
        ? 'bg-gradient-to-br from-blue-500/20 via-blue-600/15 to-blue-700/10' 
        : 'bg-gradient-to-br from-blue-50 via-blue-100/50 to-blue-200/30',
      'bg-purple-500': isDark 
        ? 'bg-gradient-to-br from-purple-500/20 via-purple-600/15 to-purple-700/10' 
        : 'bg-gradient-to-br from-purple-50 via-purple-100/50 to-purple-200/30',
      'bg-green-500': isDark 
        ? 'bg-gradient-to-br from-green-500/20 via-green-600/15 to-green-700/10' 
        : 'bg-gradient-to-br from-green-50 via-green-100/50 to-green-200/30',
    };
    return gradients[color] || gradients['bg-blue-500'];
  };

  const getIconColor = (color) => {
    const colors = {
      'bg-blue-500': isDark ? 'text-blue-400' : 'text-blue-600',
      'bg-purple-500': isDark ? 'text-purple-400' : 'text-purple-600',
      'bg-green-500': isDark ? 'text-green-400' : 'text-green-600',
    };
    return colors[color] || colors['bg-blue-500'];
  };

  const getBorderColor = (color) => {
    const borders = {
      'bg-blue-500': isDark ? 'border-blue-500/30' : 'border-blue-200/50',
      'bg-purple-500': isDark ? 'border-purple-500/30' : 'border-purple-200/50',
      'bg-green-500': isDark ? 'border-green-500/30' : 'border-green-200/50',
    };
    return borders[color] || borders['bg-blue-500'];
  };
  
  return (
    <div className={`
      relative p-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg
      ${getGradientClasses(bgColor)}
      border ${getBorderColor(bgColor)}
      ${isDark ? 'hover:shadow-blue-500/10' : 'hover:shadow-blue-500/20'}
      backdrop-blur-sm
    `}>
      {/* Decorative gradient overlay */}
      <div className={`absolute inset-0 rounded-xl opacity-50 ${
        bgColor === 'bg-blue-500' ? 'bg-gradient-to-r from-blue-500/10 to-transparent' :
        bgColor === 'bg-purple-500' ? 'bg-gradient-to-r from-purple-500/10 to-transparent' :
        'bg-gradient-to-r from-green-500/10 to-transparent'
      }`} />
      
      <div className="relative flex items-center justify-between">
        <div className="flex-1">
          <div className={`text-sm font-medium transition-colors duration-300 ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}>{title}</div>
          <div className={`text-3xl font-bold transition-colors duration-300 mt-1 ${
            isDark ? 'text-white' : 'text-slate-800'
          }`}>{value}</div>
          <div className={`text-xs transition-colors duration-300 mt-1 ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>{description}</div>
        </div>
        <div className="flex-shrink-0 ml-4">
          {Icon && (
            <div className={`
              p-3 rounded-full transition-all duration-300
              ${isDark 
                ? `${bgColor.replace('bg-', 'bg-').replace('-500', '-500/20')} border border-current/20` 
                : `${bgColor.replace('bg-', 'bg-').replace('-500', '-100')} border border-current/30`
              }
            `}>
              <Icon className={`w-6 h-6 ${getIconColor(bgColor)}`} />
            </div>
          )}
        </div>
      </div>
      
      {/* Subtle shine effect */}
      <div className={`absolute top-0 left-0 w-full h-1 rounded-t-xl ${
        bgColor === 'bg-blue-500' ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
        bgColor === 'bg-purple-500' ? 'bg-gradient-to-r from-purple-400 to-purple-600' :
        'bg-gradient-to-r from-green-400 to-green-600'
      }`} />
    </div>
  );
}
