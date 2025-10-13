import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectItem } from "@/components/ui/select";
import { useTheme } from "@/context/ThemeContext";
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Send, 
  MessageSquare,
  Users,
  Shield,
  Key
} from "lucide-react";

function AdminModals({
  // User Modal
  showUserModal,
  setShowUserModal,
  selectedUser,
  userForm,
  setUserForm,
  onUserSubmit,
  
  // Password Modal
  showPasswordModal,
  setShowPasswordModal,
  passwordForm,
  setPasswordForm,
  onPasswordSubmit,
  
  // Email Modal
  showEmailModal,
  setShowEmailModal,
  emailForm,
  setEmailForm,
  onEmailSubmit,
  users
}) {
  const { isDark } = useTheme();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  
  return (
    <>
      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className={`transition-colors duration-300 w-full max-w-md mx-4 ${
            isDark 
              ? 'bg-slate-900 border-slate-800' 
              : 'bg-white border-slate-200'
          }`}>
            <div className={`p-6 border-b transition-colors duration-300 ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-slate-800'
              }`}>
                {selectedUser ? "ویرایش کاربر" : "ایجاد کاربر"}
              </h3>
            </div>
            <div className="p-6 space-y-6">
              {/* Full Name Field */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  نام کامل
                </Label>
                <div className="relative">
                  <Input
                    value={userForm.full_name}
                    onChange={(e) => setUserForm({...userForm, full_name: e.target.value})}
                    placeholder="نام و نام خانوادگی کاربر را وارد کنید"
                    className="pl-10"
                  />
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  ایمیل
                </Label>
                <div className="relative">
                  <Input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                    placeholder="آدرس ایمیل کاربر را وارد کنید"
                    className="pl-10"
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  رمز عبور
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={userForm.password}
                    onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                    placeholder="رمز عبور جدید را وارد کنید"
                    className="pl-10 pr-10"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={userForm.is_active}
                    onChange={(e) => setUserForm({...userForm, is_active: e.target.checked})}
                  />
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <Shield className="w-4 h-4" />
                    کاربر فعال
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={userForm.is_superuser}
                    onChange={(e) => setUserForm({...userForm, is_superuser: e.target.checked})}
                  />
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <Key className="w-4 h-4" />
                    سوپرکاربر
                  </Label>
                </div>
              </div>
            </div>
            <div className={`p-6 border-t flex justify-end gap-2 transition-colors duration-300 ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <Button
                variant="outline"
                onClick={() => setShowUserModal(false)}
                className={`transition-colors duration-300 ${
                  isDark 
                    ? 'border-slate-700 text-slate-300 hover:bg-slate-800' 
                    : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Cancel
              </Button>
              <Button
                onClick={onUserSubmit}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {selectedUser ? "بروزرسانی" : "ایجاد"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className={`transition-colors duration-300 w-full max-w-md mx-4 ${
            isDark 
              ? 'bg-slate-900 border-slate-800' 
              : 'bg-white border-slate-200'
          }`}>
            <div className={`p-6 border-b transition-colors duration-300 ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-slate-800'
              }`}>بازنشانی رمز عبور</h3>
            </div>
            <div className="p-6 space-y-6">
              {/* New Password Field */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  رمز عبور جدید
                </Label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.password}
                    onChange={(e) => setPasswordForm({...passwordForm, password: e.target.value})}
                    placeholder="رمز عبور جدید را وارد کنید"
                    className="pl-10 pr-10"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={passwordForm.send_email}
                    onChange={(e) => setPasswordForm({...passwordForm, send_email: e.target.checked})}
                  />
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <Send className="w-4 h-4" />
                    ارسال ایمیل اطلاع‌رسانی
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={passwordForm.require_change}
                    onChange={(e) => setPasswordForm({...passwordForm, require_change: e.target.checked})}
                  />
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <Key className="w-4 h-4" />
                    کاربر باید در ورود بعدی رمز عبور را تغییر دهد
                  </Label>
                </div>
              </div>
            </div>
            <div className={`p-6 border-t flex justify-end gap-2 transition-colors duration-300 ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <Button
                variant="outline"
                onClick={() => setShowPasswordModal(false)}
                className={`transition-colors duration-300 ${
                  isDark 
                    ? 'border-slate-700 text-slate-300 hover:bg-slate-800' 
                    : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Cancel
              </Button>
              <Button
                onClick={onPasswordSubmit}
                className="bg-blue-600 hover:bg-blue-700"
              >
                بازنشانی رمز عبور
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className={`transition-colors duration-300 w-full max-w-md mx-4 ${
            isDark 
              ? 'bg-slate-900 border-slate-800' 
              : 'bg-white border-slate-200'
          }`}>
            <div className={`p-6 border-b transition-colors duration-300 ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-slate-800'
              }`}>ارسال ایمیل</h3>
            </div>
            <div className="p-6 space-y-6">
              {/* Recipients Field */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  گیرندگان
                </Label>
                <div className="relative">
                  <Select
                    value={emailForm.recipient_ids}
                    onValueChange={(ids) => setEmailForm({ ...emailForm, recipient_ids: Array.isArray(ids) ? ids : [ids] })}
                    multiple
                    className="pl-10"
                  >
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {(user.full_name || user.email) + (user.email ? ` (${user.email})` : '')}
                      </SelectItem>
                    ))}
                  </Select>
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Subject Field */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  موضوع
                </Label>
                <div className="relative">
                  <Input
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})}
                    placeholder="موضوع ایمیل را وارد کنید"
                    className="pl-10"
                  />
                  <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Message Field */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  پیام
                </Label>
                <Textarea
                  value={emailForm.message}
                  onChange={(e) => setEmailForm({...emailForm, message: e.target.value})}
                  placeholder="متن پیام را وارد کنید"
                  rows={4}
                />
              </div>
            </div>
            <div className={`p-6 border-t flex justify-end gap-2 transition-colors duration-300 ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <Button
                variant="outline"
                onClick={() => setShowEmailModal(false)}
                className={`transition-colors duration-300 ${
                  isDark 
                    ? 'border-slate-700 text-slate-300 hover:bg-slate-800' 
                    : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Cancel
              </Button>
              <Button
                onClick={onEmailSubmit}
                className="bg-blue-600 hover:bg-blue-700"
              >
                ارسال ایمیل
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

export default AdminModals;
