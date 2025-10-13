import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectItem } from "@/components/ui/select";
import { useTheme } from "@/context/ThemeContext";

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
            <div className="p-6 space-y-4">
              <div>
                <Label className={`transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-slate-800'
                }`}>نام کامل</Label>
                <Input
                  value={userForm.full_name}
                  onChange={(e) => setUserForm({...userForm, full_name: e.target.value})}
                  className={`transition-colors duration-300 ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-white' 
                      : 'bg-white border-slate-300 text-slate-800'
                  }`}
                />
              </div>
              <div>
                <Label className={`transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-slate-800'
                }`}>ایمیل</Label>
                <Input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                  className={`transition-colors duration-300 ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-white' 
                      : 'bg-white border-slate-300 text-slate-800'
                  }`}
                />
              </div>
              <div>
                <Label className={`transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-slate-800'
                }`}>رمز عبور</Label>
                <Input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                  className={`transition-colors duration-300 ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-white' 
                      : 'bg-white border-slate-300 text-slate-800'
                  }`}
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={userForm.is_active}
                    onChange={(e) => setUserForm({...userForm, is_active: e.target.checked})}
                    className="rounded"
                  />
                  <span className={`transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-slate-800'
                  }`}>فعال</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={userForm.is_superuser}
                    onChange={(e) => setUserForm({...userForm, is_superuser: e.target.checked})}
                    className="rounded"
                  />
                  <span className={`transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-slate-800'
                  }`}>سوپرکاربر</span>
                </label>
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
            <div className="p-6 space-y-4">
              <div>
                <Label className={`transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-slate-800'
                }`}>رمز عبور جدید</Label>
                <Input
                  type="password"
                  value={passwordForm.password}
                  onChange={(e) => setPasswordForm({...passwordForm, password: e.target.value})}
                  className={`transition-colors duration-300 ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-white' 
                      : 'bg-white border-slate-300 text-slate-800'
                  }`}
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={passwordForm.send_email}
                    onChange={(e) => setPasswordForm({...passwordForm, send_email: e.target.checked})}
                    className="rounded"
                  />
                  <span className={`transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-slate-800'
                  }`}>ارسال ایمیل</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={passwordForm.require_change}
                    onChange={(e) => setPasswordForm({...passwordForm, require_change: e.target.checked})}
                    className="rounded"
                  />
                  <span className={`transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-slate-800'
                  }`}>نیاز به تغییر</span>
                </label>
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
            <div className="p-6 space-y-4">
              <div>
                <Label className={`transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-slate-800'
                }`}>گیرندگان</Label>
                <Select
                  value={emailForm.recipient_ids}
                  onValueChange={(ids) => setEmailForm({ ...emailForm, recipient_ids: Array.isArray(ids) ? ids : [ids] })}
                  multiple
                  className={`transition-colors duration-300 ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-white' 
                      : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {(user.full_name || user.email) + (user.email ? ` (${user.email})` : '')}
                    </SelectItem>
                  ))}
                </Select>
              </div>
              <div>
                <Label className={`transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-slate-800'
                }`}>موضوع</Label>
                <Input
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})}
                  className={`transition-colors duration-300 ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-white' 
                      : 'bg-white border-slate-300 text-slate-800'
                  }`}
                />
              </div>
              <div>
                <Label className={`transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-slate-800'
                }`}>پیام</Label>
                <Textarea
                  value={emailForm.message}
                  onChange={(e) => setEmailForm({...emailForm, message: e.target.value})}
                  className={`transition-colors duration-300 ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-white' 
                      : 'bg-white border-slate-300 text-slate-800'
                  }`}
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
