
import React, { useState, useEffect } from "react";
import { User, ChatSession } from "@/Entities/all";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  User as UserIcon, 
  Mail, 
  MessageSquare, 
  Calendar,
  Sparkles,
  Edit3,
  Save,
  X
} from "lucide-react";
import { motion } from "framer-motion";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useRouter } from "next/router";

import StatsCard from "../components/profile/StatsCard";

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
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ totalChats: 0, totalMessages: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editForm, setEditForm] = useState({
    full_name: "",
    bio: "",
    avatar_url: ""
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const userData = await User.me();
      setUser(userData);
      setEditForm({
        full_name: userData.full_name || "",
        bio: userData.bio || "",
        avatar_url: userData.avatar_url || ""
      });

      // Load stats
      const sessions = await ChatSession.filter({ created_by: userData.email });
      setStats({
        totalChats: sessions.length,
        totalMessages: userData.total_messages || 0
      });

    } catch (error) {
      console.error("Error loading user data:", error);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    try {
      const updatedUser = await User.updateMyUserData(editForm);
      setUser(updatedUser);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleCancel = () => {
    setEditForm({
      full_name: user?.full_name || "",
      bio: user?.bio || "",
      avatar_url: user?.avatar_url || ""
    });
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-900 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          
          className="flex items-center gap-4 mb-8"
        >
          <SidebarTrigger className="hover:bg-slate-800 p-2 rounded-lg transition-colors duration-200 text-white md:hidden" />
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-white">پروفایل</h1>
            <p className="text-slate-400 hidden md:block">حساب کاربری و تنظیمات خود را مدیریت کنید</p>
          </div>
        </motion.div>

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
            value={user?.created_date ? formatMonthYear(user.created_date) : "Recently"}
            icon={Calendar}
            bgColor="bg-green-500"
            description="خوش آمدید!"
          />
        </motion.div>

        {/* Profile Card */}
        <motion.div
          
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          
        >
          <Card className="bg-slate-800/60 border-slate-700/50 p-4 md:p-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-white">اطلاعات پروفایل</CardTitle>
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-slate-300 hover:text-blue-400"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    ویرایش پروفایل
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSave}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      ذخیره
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      size="sm"
                      className="border-slate-700 text-slate-300"
                    >
                      <X className="w-4 h-4 mr-2" />
                      لغو
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar and Basic Info */}
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="flex-shrink-0">
                  <Avatar className="w-24 h-24 md:w-28 md:h-28">
                    <AvatarImage src={isEditing ? editForm.avatar_url : user?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-2xl">
                      {(isEditing ? editForm.full_name : user?.full_name)?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-slate-300">نام کامل</Label>
                      {isEditing ? (
                        <Input
                          id="name"
                          value={editForm.full_name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                          className="mt-1 bg-slate-800/50 border-slate-700/50 text-slate-100"
                        />
                      ) : (
                        <p className="text-white mt-1 flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-slate-400" />
                          {user?.full_name || "تنظیم نشده"}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="email" className="text-slate-300">ایمیل</Label>
                      <p className="text-white mt-1 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-300" />
                        {user?.email}
                        <Badge variant="secondary" className="bg-green-600/10 text-green-400 ml-2">
                          تأیید شده
                        </Badge>
                      </p>
                    </div>
                  </div>

                  {isEditing && (
                    <div>
                      <Label htmlFor="avatar" className="text-slate-300">آدرس آواتار</Label>
                      <Input
                        id="avatar"
                        value={editForm.avatar_url}
                        onChange={(e) => setEditForm(prev => ({ ...prev, avatar_url: e.target.value }))}
                        placeholder="https://example.com/avatar.jpg"
                        className="mt-1 bg-slate-800/50 border-slate-700/50 text-slate-100"
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="bio" className="text-slate-300">بیوگرافی</Label>
                    {isEditing ? (
                      <Textarea
                        id="bio"
                        value={editForm.bio}
                        onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="درباره خودتان بگویید..."
                        className="mt-1 bg-slate-800/50 border-slate-700/50 text-slate-100 resize-none"
                        rows={3}
                      />
                    ) : (
                      <p className="text-slate-300 mt-1">
                        {user?.bio || "هنوز بیوگرافی اضافه نشده است."}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Account Details */}
        <motion.div
          
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          
          className="mt-6"
        >
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-lg text-white">جزئیات حساب</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-slate-300">شناسه حساب</Label>
                  <p className="text-slate-400 text-sm mt-1 font-mono">
                    {user?.id?.substring(0, 8)}...
                  </p>
                </div>
                <div>
                  <Label className="text-slate-300">نقش</Label>
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
                  <Label className="text-slate-300">عضو از</Label>
                  <p className="text-slate-400 text-sm mt-1">
                    {user?.created_date ? formatLongDate(user.created_date) : "اخیراً"}
                  </p>
                </div>
                <div>
                  <Label className="text-slate-300">آخرین بروزرسانی</Label>
                  <p className="text-slate-400 text-sm mt-1">
                    {user?.updated_date ? formatLongDate(user.updated_date) : "هرگز"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
