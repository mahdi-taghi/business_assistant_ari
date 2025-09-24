import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

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
  return (
    <>
      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-slate-900 border-slate-800 w-full max-w-md mx-4">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">
                {selectedUser ? "ویرایش کاربر" : "ایجاد کاربر"}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <Label className="text-white">نام کامل</Label>
                <Input
                  value={userForm.full_name}
                  onChange={(e) => setUserForm({...userForm, full_name: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white">ایمیل</Label>
                <Input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white">رمز عبور</Label>
                <Input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
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
                  <span className="text-white">فعال</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={userForm.is_superuser}
                    onChange={(e) => setUserForm({...userForm, is_superuser: e.target.checked})}
                    className="rounded"
                  />
                  <span className="text-white">سوپرکاربر</span>
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-slate-800 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowUserModal(false)}
                className="border-slate-700 text-slate-300"
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
          <Card className="bg-slate-900 border-slate-800 w-full max-w-md mx-4">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">بازنشانی رمز عبور</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <Label className="text-white">رمز عبور جدید</Label>
                <Input
                  type="password"
                  value={passwordForm.password}
                  onChange={(e) => setPasswordForm({...passwordForm, password: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
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
                  <span className="text-white">ارسال ایمیل</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={passwordForm.require_change}
                    onChange={(e) => setPasswordForm({...passwordForm, require_change: e.target.checked})}
                    className="rounded"
                  />
                  <span className="text-white">نیاز به تغییر</span>
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-slate-800 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPasswordModal(false)}
                className="border-slate-700 text-slate-300"
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
          <Card className="bg-slate-900 border-slate-800 w-full max-w-md mx-4">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">ارسال ایمیل</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <Label className="text-white">گیرندگان</Label>
                <Select
                  value={emailForm.recipient_ids}
                  onChange={(e) => setEmailForm({...emailForm, recipient_ids: Array.from(e.target.selectedOptions, option => option.value)})}
                  multiple
                  className="bg-slate-800 border-slate-700 text-white"
                >
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.full_name} ({user.email})</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label className="text-white">موضوع</Label>
                <Input
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white">پیام</Label>
                <Textarea
                  value={emailForm.message}
                  onChange={(e) => setEmailForm({...emailForm, message: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                  rows={4}
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-800 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowEmailModal(false)}
                className="border-slate-700 text-slate-300"
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
