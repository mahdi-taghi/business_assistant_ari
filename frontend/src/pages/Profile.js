
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User as UserIcon, 
  Mail, 
  MessageSquare, 
  Calendar,
  Sparkles,
  Edit3,
  Save,
  X,
  Lock,
  Phone,
  Settings,
  Shield,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

import StatsCard from "../components/profile/StatsCard";
import { useChatApi } from "@/integrations/chatApi";

function formatDate(value, options) {
  try {
    if (!value) return "";
    return new Intl.DateTimeFormat("en-US", options).format(new Date(value));
  } catch (error) {
    console.warn("Failed to format date", error);
    return "";
  }
}

function formatMonthYear(value) {
  return formatDate(value, { month: "short", year: "numeric" });
}

function formatLongDate(value) {
  return formatDate(value, { month: "long", day: "numeric", year: "numeric" });
}

export default function Profile() {
  const router = useRouter();
  const { user, updateProfile, authenticatedRequest } = useAuth();
  const { isDark } = useTheme();
  const [stats, setStats] = useState({ totalChats: 0, totalMessages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const { listActiveChats, listArchivedChats } = useChatApi();
  
  // Profile editing states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    email: "",
    phone: ""
  });
  
  // Password change states
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  // Form validation and feedback
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadUserData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [active, archived] = await Promise.all([
        listActiveChats(),
        listArchivedChats(),
      ]);

      const chats = [...(Array.isArray(active) ? active : []), ...(Array.isArray(archived) ? archived : [])];
      const totalChats = chats.length;
      const totalMessages = chats.reduce((sum, chat) => sum + (chat.message_count || 0), 0);

      setStats({
        totalChats,
        totalMessages,
      });
    } catch (error) {
      console.error("Error loading user data:", error);
    }
    setIsLoading(false);
  }, [listActiveChats, listArchivedChats]);

  useEffect(() => {
    if (user) {
      loadUserData();
      setProfileForm({
        full_name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || ""
      });
    }
  }, [user, loadUserData]);

  const handleProfileSave = async () => {
    setIsSubmitting(true);
    setFormErrors({});
    setSuccessMessage("");

    try {
      const result = await updateProfile(profileForm);
      if (result.ok) {
        setSuccessMessage("پروفایل با موفقیت بروزرسانی شد");
        setIsEditingProfile(false);
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        const errorData = result.data || {};
        if (typeof errorData === 'string') {
          setFormErrors({ general: errorData });
        } else {
          setFormErrors(errorData);
        }
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setFormErrors({ general: "خطا در بروزرسانی پروفایل. لطفاً دوباره تلاش کنید." });
    }
    setIsSubmitting(false);
  };

  const handlePasswordChange = async () => {
    setIsSubmitting(true);
    setFormErrors({});
    setSuccessMessage("");

    // Validation
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setFormErrors({ confirm_password: "رمز عبور جدید و تأیید آن مطابقت ندارند" });
      setIsSubmitting(false);
      return;
    }

    if (passwordForm.new_password.length < 8) {
      setFormErrors({ new_password: "رمز عبور باید حداقل 8 کاراکتر باشد" });
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await authenticatedRequest("/auth/me/change-password/", {
        method: "POST",
        body: {
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password
        }
      });

      if (result.ok) {
        setSuccessMessage("رمز عبور با موفقیت تغییر کرد");
        setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
        setIsChangingPassword(false);
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        const errorData = result.data || {};
        if (typeof errorData === 'string') {
          setFormErrors({ general: errorData });
        } else {
          setFormErrors(errorData);
        }
      }
    } catch (error) {
      console.error("Error changing password:", error);
      setFormErrors({ general: "خطا در تغییر رمز عبور. لطفاً دوباره تلاش کنید." });
    }
    setIsSubmitting(false);
  };

  const handleProfileCancel = () => {
    setProfileForm({
      full_name: user?.full_name || "",
      email: user?.email || "",
      phone: user?.phone || ""
    });
    setIsEditingProfile(false);
    setFormErrors({});
  };

  const handlePasswordCancel = () => {
    setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
    setIsChangingPassword(false);
    setFormErrors({});
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-screen transition-colors duration-300 ${
        isDark ? 'bg-slate-900' : 'bg-slate-50'
      }`}>
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className={`h-full overflow-y-auto p-4 md:p-6 transition-colors duration-300 ${
      isDark ? 'bg-slate-900' : 'bg-slate-50'
    }`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <SidebarTrigger className={`p-2 rounded-lg transition-colors duration-200 md:hidden ${
            isDark 
              ? 'hover:bg-slate-800 text-white' 
              : 'hover:bg-slate-100 text-slate-800'
          }`} />
          <div className="flex-1 text-center md:text-left">
            <h1 className={`text-2xl md:text-3xl font-bold transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-slate-800'
            }`}>پروفایل و تنظیمات</h1>
            <p className={`hidden md:block transition-colors duration-300 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>حساب کاربری و تنظیمات خود را مدیریت کنید</p>
          </div>
        </motion.div>

        {/* Success Message */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-600/20 border border-green-500/30 rounded-lg flex items-center gap-2 text-green-400"
          >
            <CheckCircle className="w-5 h-5" />
            {successMessage}
          </motion.div>
        )}

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <StatsCard
            title="کل گفتگوها"
            value={stats.totalChats}
            icon={MessageSquare}
            bgColor="bg-blue-500"
            description="همه زمان‌ها"
          />
          <StatsCard
            title="پیام‌های ارسال شده"
            value={stats.totalMessages}
            icon={Sparkles}
            bgColor="bg-purple-500"
            description="مشارکت‌های شما"
          />
          <StatsCard
            title="عضو از"
            value={user?.created_date ? formatMonthYear(user.created_date) : "اخیراً"}
            icon={Calendar}
            bgColor="bg-green-500"
            description="خوش آمدید!"
          />
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className={`flex space-x-1 p-1 rounded-lg transition-colors duration-300 ${
            isDark ? 'bg-slate-800/50' : 'bg-slate-200/50'
          }`}>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === 'profile'
                  ? 'bg-blue-600 text-white'
                  : isDark 
                    ? 'text-slate-400 hover:text-white hover:bg-slate-700/50' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              اطلاعات پروفایل
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === 'account'
                  ? 'bg-blue-600 text-white'
                  : isDark 
                    ? 'text-slate-400 hover:text-white hover:bg-slate-700/50' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
              }`}
            >
              <Settings className="w-4 h-4" />
              جزئیات حساب
            </button>
          </div>
        </motion.div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className={`transition-colors duration-300 ${
              isDark 
                ? 'bg-slate-800/60 border-slate-700/50' 
                : 'bg-white/60 border-slate-300/50'
            }`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className={`text-xl flex items-center gap-2 transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-slate-800'
                  }`}>
                    <UserIcon className="w-5 h-5" />
                    اطلاعات پروفایل
                  </CardTitle>
                  <div className="flex gap-2">
                    {!isEditingProfile && !isChangingPassword && (
                      <Button
                        onClick={() => setIsEditingProfile(true)}
                        variant="outline"
                        size="sm"
                        className={`transition-colors duration-300 ${
                          isDark 
                            ? 'border-slate-700 text-slate-300 hover:text-blue-400' 
                            : 'border-slate-300 text-slate-600 hover:text-blue-600'
                        }`}
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        ویرایش پروفایل
                      </Button>
                    )}
                    {!isChangingPassword && (
                      <Button
                        onClick={() => setIsChangingPassword(true)}
                        variant="outline"
                        size="sm"
                        className={`transition-colors duration-300 ${
                          isDark 
                            ? 'border-slate-700 text-slate-300 hover:text-orange-400' 
                            : 'border-slate-300 text-slate-600 hover:text-orange-600'
                        }`}
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        تغییر رمز عبور
                      </Button>
                    )}
                    {isEditingProfile && (
                      <div className="flex gap-2">
                        <Button
                          onClick={handleProfileSave}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          disabled={isSubmitting}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {isSubmitting ? "در حال ذخیره..." : "ذخیره"}
                        </Button>
                        <Button
                          onClick={handleProfileCancel}
                          variant="outline"
                          size="sm"
                          className={`transition-colors duration-300 ${
                            isDark 
                              ? 'border-slate-700 text-slate-300' 
                              : 'border-slate-300 text-slate-600'
                          }`}
                        >
                          <X className="w-4 h-4 mr-2" />
                          لغو
                        </Button>
                      </div>
                    )}
                    {isChangingPassword && (
                      <div className="flex gap-2">
                        <Button
                          onClick={handlePasswordChange}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          disabled={isSubmitting}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {isSubmitting ? "در حال تغییر..." : "تغییر رمز عبور"}
                        </Button>
                        <Button
                          onClick={handlePasswordCancel}
                          variant="outline"
                          size="sm"
                          className={`transition-colors duration-300 ${
                            isDark 
                              ? 'border-slate-700 text-slate-300' 
                              : 'border-slate-300 text-slate-600'
                          }`}
                        >
                          <X className="w-4 h-4 mr-2" />
                          لغو
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* General Error */}
                {formErrors.general && (
                  <div className="p-3 bg-red-600/20 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    {formErrors.general}
                  </div>
                )}

                {/* Profile Information Form */}
                {isEditingProfile && (
                  <div className="space-y-6">
                    <h3 className={`text-lg font-semibold flex items-center gap-2 transition-colors duration-300 ${
                      isDark ? 'text-white' : 'text-slate-800'
                    }`}>
                      <Edit3 className="w-5 h-5" />
                      ویرایش اطلاعات شخصی
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="full_name" className={`transition-colors duration-300 ${
                          isDark ? 'text-slate-300' : 'text-slate-600'
                        }`}>نام کامل</Label>
                        <Input
                          id="full_name"
                          value={profileForm.full_name}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                          className={`mt-1 transition-colors duration-300 ${
                            isDark 
                              ? 'bg-slate-800/50 border-slate-700/50 text-slate-100' 
                              : 'bg-white/50 border-slate-300/50 text-slate-800'
                          }`}
                          placeholder="نام کامل خود را وارد کنید"
                        />
                        {formErrors.full_name && (
                          <p className="text-red-400 text-sm mt-1">{formErrors.full_name}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="email" className={`transition-colors duration-300 ${
                          isDark ? 'text-slate-300' : 'text-slate-600'
                        }`}>ایمیل</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                          className={`mt-1 transition-colors duration-300 ${
                            isDark 
                              ? 'bg-slate-800/50 border-slate-700/50 text-slate-100' 
                              : 'bg-white/50 border-slate-300/50 text-slate-800'
                          }`}
                          placeholder="ایمیل خود را وارد کنید"
                        />
                        {formErrors.email && (
                          <p className="text-red-400 text-sm mt-1">{formErrors.email}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="phone" className={`transition-colors duration-300 ${
                          isDark ? 'text-slate-300' : 'text-slate-600'
                        }`}>شماره تلفن</Label>
                        <Input
                          id="phone"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                          className={`mt-1 transition-colors duration-300 ${
                            isDark 
                              ? 'bg-slate-800/50 border-slate-700/50 text-slate-100' 
                              : 'bg-white/50 border-slate-300/50 text-slate-800'
                          }`}
                          placeholder="شماره تلفن خود را وارد کنید"
                        />
                        {formErrors.phone && (
                          <p className="text-red-400 text-sm mt-1">{formErrors.phone}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Password Change Form */}
                {isChangingPassword && (
                  <div className="space-y-6">
                    <h3 className={`text-lg font-semibold flex items-center gap-2 transition-colors duration-300 ${
                      isDark ? 'text-white' : 'text-slate-800'
                    }`}>
                      <Lock className="w-5 h-5" />
                      تغییر رمز عبور
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="current_password" className={`transition-colors duration-300 ${
                          isDark ? 'text-slate-300' : 'text-slate-600'
                        }`}>رمز عبور فعلی</Label>
                        <div className="relative mt-1">
                          <Input
                            id="current_password"
                            type={showPasswords.current ? "text" : "password"}
                            value={passwordForm.current_password}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                            className={`pr-10 transition-colors duration-300 ${
                              isDark 
                                ? 'bg-slate-800/50 border-slate-700/50 text-slate-100' 
                                : 'bg-white/50 border-slate-300/50 text-slate-800'
                            }`}
                            placeholder="رمز عبور فعلی خود را وارد کنید"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('current')}
                            className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${
                              isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-600'
                            }`}
                          >
                            {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {formErrors.current_password && (
                          <p className="text-red-400 text-sm mt-1">{formErrors.current_password}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="new_password" className={`transition-colors duration-300 ${
                          isDark ? 'text-slate-300' : 'text-slate-600'
                        }`}>رمز عبور جدید</Label>
                        <div className="relative mt-1">
                          <Input
                            id="new_password"
                            type={showPasswords.new ? "text" : "password"}
                            value={passwordForm.new_password}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                            className={`pr-10 transition-colors duration-300 ${
                              isDark 
                                ? 'bg-slate-800/50 border-slate-700/50 text-slate-100' 
                                : 'bg-white/50 border-slate-300/50 text-slate-800'
                            }`}
                            placeholder="رمز عبور جدید (حداقل 8 کاراکتر)"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('new')}
                            className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${
                              isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-600'
                            }`}
                          >
                            {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {formErrors.new_password && (
                          <p className="text-red-400 text-sm mt-1">{formErrors.new_password}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="confirm_password" className={`transition-colors duration-300 ${
                          isDark ? 'text-slate-300' : 'text-slate-600'
                        }`}>تأیید رمز عبور جدید</Label>
                        <div className="relative mt-1">
                          <Input
                            id="confirm_password"
                            type={showPasswords.confirm ? "text" : "password"}
                            value={passwordForm.confirm_password}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                            className={`pr-10 transition-colors duration-300 ${
                              isDark 
                                ? 'bg-slate-800/50 border-slate-700/50 text-slate-100' 
                                : 'bg-white/50 border-slate-300/50 text-slate-800'
                            }`}
                            placeholder="رمز عبور جدید را دوباره وارد کنید"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('confirm')}
                            className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${
                              isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-600'
                            }`}
                          >
                            {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {formErrors.confirm_password && (
                          <p className="text-red-400 text-sm mt-1">{formErrors.confirm_password}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Display Current Information */}
                {!isEditingProfile && !isChangingPassword && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className={`transition-colors duration-300 ${
                          isDark ? 'text-slate-300' : 'text-slate-600'
                        }`}>نام کامل</Label>
                        <p className={`mt-1 flex items-center gap-2 transition-colors duration-300 ${
                          isDark ? 'text-white' : 'text-slate-800'
                        }`}>
                          <UserIcon className={`w-4 h-4 transition-colors duration-300 ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                          }`} />
                          {user?.full_name || "تنظیم نشده"}
                        </p>
                      </div>
                      
                      <div>
                        <Label className={`transition-colors duration-300 ${
                          isDark ? 'text-slate-300' : 'text-slate-600'
                        }`}>ایمیل</Label>
                        <p className={`mt-1 flex items-center gap-2 transition-colors duration-300 ${
                          isDark ? 'text-white' : 'text-slate-800'
                        }`}>
                          <Mail className={`w-4 h-4 transition-colors duration-300 ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                          }`} />
                          {user?.email}
                          <Badge variant="secondary" className="bg-green-600/10 text-green-400 ml-2">
                            تأیید شده
                          </Badge>
                        </p>
                      </div>

                      <div>
                        <Label className={`transition-colors duration-300 ${
                          isDark ? 'text-slate-300' : 'text-slate-600'
                        }`}>شماره تلفن</Label>
                        <p className={`mt-1 flex items-center gap-2 transition-colors duration-300 ${
                          isDark ? 'text-white' : 'text-slate-800'
                        }`}>
                          <Phone className={`w-4 h-4 transition-colors duration-300 ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                          }`} />
                          {user?.phone || "تنظیم نشده"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}


        {/* Account Tab */}
        {activeTab === 'account' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className={`transition-colors duration-300 ${
              isDark 
                ? 'bg-slate-800/60 border-slate-700/50' 
                : 'bg-white/60 border-slate-300/50'
            }`}>
              <CardHeader>
                <CardTitle className={`text-xl flex items-center gap-2 transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-slate-800'
                }`}>
                  <Settings className="w-5 h-5" />
                  جزئیات حساب
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className={`transition-colors duration-300 ${
                      isDark ? 'text-slate-300' : 'text-slate-600'
                    }`}>شناسه حساب</Label>
                    <p className={`text-sm mt-1 font-mono transition-colors duration-300 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      {user?.id?.substring(0, 8)}...
                    </p>
                  </div>
                  <div>
                    <Label className={`transition-colors duration-300 ${
                      isDark ? 'text-slate-300' : 'text-slate-600'
                    }`}>نقش</Label>
                    <div className="mt-1">
                      <Badge 
                        variant="secondary" 
                        className={user?.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}
                      >
                        {user?.role || 'user'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className={`transition-colors duration-300 ${
                      isDark ? 'text-slate-300' : 'text-slate-600'
                    }`}>عضو از</Label>
                    <p className={`text-sm mt-1 transition-colors duration-300 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      {user?.created_date ? formatLongDate(user.created_date) : "اخیراً"}
                    </p>
                  </div>
                  <div>
                    <Label className={`transition-colors duration-300 ${
                      isDark ? 'text-slate-300' : 'text-slate-600'
                    }`}>آخرین بروزرسانی</Label>
                    <p className={`text-sm mt-1 transition-colors duration-300 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      {user?.updated_date ? formatLongDate(user.updated_date) : "هرگز"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
