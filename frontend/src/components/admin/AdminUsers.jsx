import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/context/ThemeContext";
import { 
  Users, 
  Search, 
  UserPlus, 
  Send, 
  Edit, 
  Key, 
  UserX, 
  UserCheck, 
  Trash2 
} from "lucide-react";

function AdminUsers({ 
  users, 
  searchTerm, 
  onSearchChange, 
  onAddUser, 
  onSendEmail, 
  onEditUser, 
  onResetPassword, 
  onToggleUser, 
  onDeleteUser 
}) {
  const { isDark } = useTheme();
  
  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <div className="flex justify-between items-center">
          <h2 className={`text-xl font-semibold flex items-center gap-2 transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-slate-800'
          }`}>
            <Users className="w-5 h-5" />
            مدیریت کاربران
          </h2>
          <div className="flex gap-2">
            <Button
              onClick={onAddUser}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              افزودن کاربر
            </Button>
            <Button
              onClick={onSendEmail}
              variant="outline"
              className={`transition-colors duration-300 ${
                isDark 
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800' 
                  : 'border-slate-300 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Send className="w-4 h-4 mr-2" />
              ارسال ایمیل
            </Button>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="mb-4">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`} />
            <Input
              placeholder="جستجو در کاربران..."
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
          {filteredUsers.map((user) => (
            <div key={user.id} className={`flex items-center justify-between p-4 rounded-lg transition-colors duration-300 ${
              isDark ? 'bg-slate-800/50' : 'bg-slate-100/50'
            }`}>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className={`font-medium transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-slate-800'
                  }`}>{user.full_name}</p>
                  <Badge variant={user.is_active ? "default" : "secondary"}>
                    {user.is_active ? "فعال" : "غیرفعال"}
                  </Badge>
                  {user.is_superuser && (
                    <Badge variant="destructive">سوپرکاربر</Badge>
                  )}
                </div>
                <p className={`text-sm transition-colors duration-300 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>{user.email}</p>
                <p className={`text-xs transition-colors duration-300 ${
                  isDark ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  عضویت: {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEditUser(user)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onResetPassword(user)}
                >
                  <Key className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={user.is_active ? "destructive" : "default"}
                  onClick={() => onToggleUser(user.id, user.is_active)}
                  disabled={user.is_superuser}
                >
                  {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onDeleteUser(user.id)}
                  disabled={user.is_superuser}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export default AdminUsers;
