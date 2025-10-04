import React, { useState, useEffect, memo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { isAdminUser } from "@/utils";
import { 
  MessageSquare, 
  LogOut,
  Shield,
  Home,
  Users,
  FileText,
  Mail,
  AlertTriangle
} from "lucide-react";

// Import admin components
import {
  AdminDashboard,
  AdminUsers,
  AdminChats,
  AdminMessages,
  AdminEmailLogs,
  AdminErrorLogs,
  AdminModals
} from "@/components/admin";

const AdminPanel = memo(function AdminPanel() {
  const { user, logout, authenticatedRequest } = useAuth();
  const router = useRouter();
  const { forceAdmin } = router.query;
  
  // State management
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dashboard stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalChats: 0,
    totalMessages: 0,
    emailLogs: 0,
    errorLogs: 0
  });
  
  // Data states
  const [users, setUsers] = useState([]);
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [errorLogs, setErrorLogs] = useState([]);
  
  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Form states
  const [userForm, setUserForm] = useState({
    full_name: "",
    email: "",
    password: "",
    is_active: true,
    is_superuser: false
  });
  
  const [emailForm, setEmailForm] = useState({
    recipient_ids: [],
    subject: "",
    message: "",
    template_name: "admin/custom_email"
  });
  
  const [passwordForm, setPasswordForm] = useState({
    password: "",
    send_email: true,
    require_change: true
  });

  // Check if user is admin or superuser (or force admin mode)
  const isAdmin = isAdminUser(user) || forceAdmin === 'true';

  // Debug logging
  useEffect(() => {
    console.log("=== ADMIN PANEL DEBUG ===");
    console.log("User object:", user);
    console.log("User roles:", user?.roles);
    console.log("User roles.is_admin:", user?.roles?.is_admin);
    console.log("User roles.is_superuser:", user?.roles?.is_superuser);
    console.log("User roles.is_staff:", user?.roles?.is_staff);
    console.log("User is_superuser:", user?.is_superuser);
    console.log("User is_admin:", user?.is_admin);
    console.log("User is_staff:", user?.is_staff);
    console.log("isAdmin calculated:", isAdmin);
    console.log("=========================");
  }, [user, isAdmin]);

  // Redirect if not admin
  useEffect(() => {
    if (user && !isAdmin) {
      console.log("Redirecting to Chat - User is not admin");
      router.replace("/Chat");
    }
  }, [user, router, isAdmin]);

  // Show debug info if not admin but user exists
  if (user && !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Debug Information</h2>
            <div className="space-y-2 text-sm">
              <div className="text-slate-300">
                <strong>User Object:</strong>
                <pre className="bg-slate-700 p-2 rounded mt-1 text-xs overflow-auto">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
              <div className="text-slate-300">
                <strong>isAdmin:</strong> {isAdmin ? 'true' : 'false'}
              </div>
              <div className="text-slate-300">
                <strong>User roles:</strong> {JSON.stringify(user?.roles, null, 2)}
              </div>
            </div>
          </div>
          <div className="text-center space-x-4">
            <Button
              onClick={() => router.replace("/Chat")}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              بازگشت به چت
            </Button>
            <Button
              onClick={() => {
                // Force admin access for debugging
                window.location.href = '/Admin?forceAdmin=true';
              }}
              variant="default"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              ورود اجباری به پنل ادمین (Debug)
            </Button>
            <div className="mt-4 text-sm text-slate-400">
              <p>اگر شما ادمین هستید اما پنل ادمین نمایش داده نمی‌شود، لطفاً:</p>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>دکمه "ورود اجباری" را کلیک کنید</li>
                <li>اطلاعات نمایش داده شده را بررسی کنید</li>
                <li>با مدیر سیستم تماس بگیرید</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fetch admin data
  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData();
    }
  }, [isAdmin]);

  // Show warning if in force admin mode
  if (forceAdmin === 'true' && !isAdminUser(user)) {
    return (
      <div className="min-h-screen bg-slate-900">
        <div className="bg-yellow-600 text-white p-4 text-center">
          <strong>⚠️ حالت Debug فعال است</strong> - شما در حال حاضر با دسترسی اجباری وارد پنل ادمین شده‌اید
        </div>
        <div className="p-8">
          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">اطلاعات کاربر</h2>
            <div className="space-y-2 text-sm">
              <div className="text-slate-300">
                <strong>User Object:</strong>
                <pre className="bg-slate-700 p-2 rounded mt-1 text-xs overflow-auto max-h-40">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
              <div className="text-slate-300">
                <strong>isAdmin (calculated):</strong> {isAdminUser(user) ? 'true' : 'false'}
              </div>
              <div className="text-slate-300">
                <strong>forceAdmin:</strong> {forceAdmin}
              </div>
            </div>
          </div>
          <div className="text-center">
            <Button
              onClick={() => router.replace("/Chat")}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              بازگشت به چت
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [usersRes, chatsRes, messagesRes, emailLogsRes, errorLogsRes] = await Promise.all([
        authenticatedRequest("/adminpanel/users/"),
        authenticatedRequest("/adminpanel/chats/"),
        authenticatedRequest("/adminpanel/messages/"),
        authenticatedRequest("/adminpanel/email-logs/"),
        authenticatedRequest("/adminpanel/error-logs/")
      ]);

      if (usersRes.ok) {
        setUsers(usersRes.data.results || usersRes.data);
      }
      if (chatsRes.ok) {
        setChats(chatsRes.data.results || chatsRes.data);
      }
      if (messagesRes.ok) {
        setMessages(messagesRes.data.results || messagesRes.data);
      }
      if (emailLogsRes.ok) {
        setEmailLogs(emailLogsRes.data.results || emailLogsRes.data);
      }
      if (errorLogsRes.ok) {
        setErrorLogs(errorLogsRes.data.results || errorLogsRes.data);
      }

      // Calculate stats
      const usersData = usersRes.ok ? (usersRes.data.results || usersRes.data) : [];
      const chatsData = chatsRes.ok ? (chatsRes.data.results || chatsRes.data) : [];
      const messagesData = messagesRes.ok ? (messagesRes.data.results || messagesRes.data) : [];
      const emailLogsData = emailLogsRes.ok ? (emailLogsRes.data.results || emailLogsRes.data) : [];
      const errorLogsData = errorLogsRes.ok ? (errorLogsRes.data.results || errorLogsRes.data) : [];
      
      setStats({
        totalUsers: usersData.length,
        activeUsers: usersData.filter(u => u.is_active).length,
        totalChats: chatsData.length,
        totalMessages: messagesData.length,
        emailLogs: emailLogsData.length,
        errorLogs: errorLogsData.length
      });

    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  // User management handlers
  const handleUserToggle = async (userId, currentStatus) => {
    try {
      const response = await authenticatedRequest(`/adminpanel/users/${userId}/toggle_active/`, {
        method: "POST"
      });
      
      if (response.ok) {
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, is_active: response.data.is_active }
            : user
        ));
      }
    } catch (error) {
      console.error("Failed to toggle user status:", error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    
    try {
      const response = await authenticatedRequest(`/adminpanel/users/${userId}/`, {
        method: "DELETE"
      });
      
      if (response.ok) {
        setUsers(users.filter(user => user.id !== userId));
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  const handleCreateUser = async () => {
    try {
      const response = await authenticatedRequest("/adminpanel/users/", {
        method: "POST",
        body: userForm
      });
      
      if (response.ok) {
        setUsers([response.data, ...users]);
        setShowUserModal(false);
        setUserForm({ full_name: "", email: "", password: "", is_active: true, is_superuser: false });
      }
    } catch (error) {
      console.error("Failed to create user:", error);
    }
  };

  const handleUpdateUser = async () => {
    try {
      const response = await authenticatedRequest(`/adminpanel/users/${selectedUser.id}/`, {
        method: "PUT",
        body: userForm
      });
      
      if (response.ok) {
        setUsers(users.map(user => user.id === selectedUser.id ? response.data : user));
        setShowUserModal(false);
        setSelectedUser(null);
      }
    } catch (error) {
      console.error("Failed to update user:", error);
    }
  };

  const handleResetPassword = async () => {
    try {
      const response = await authenticatedRequest(`/adminpanel/users/${selectedUser.id}/reset_password/`, {
        method: "POST",
        body: passwordForm
      });
      
      if (response.ok) {
        setShowPasswordModal(false);
        setSelectedUser(null);
        setPasswordForm({ password: "", send_email: true, require_change: true });
      }
    } catch (error) {
      console.error("Failed to reset password:", error);
    }
  };

  const handleSendEmail = async () => {
    try {
      const response = await authenticatedRequest("/adminpanel/send-email/", {
        method: "POST",
        body: emailForm
      });
      
      if (response.ok) {
        setShowEmailModal(false);
        setEmailForm({ recipient_ids: [], subject: "", message: "", template_name: "admin/custom_email" });
      }
    } catch (error) {
      console.error("Failed to send email:", error);
    }
  };

  const handleDeleteEmailLog = async (logId) => {
    if (!confirm("Are you sure you want to delete this email log?")) return;
    
    try {
      const response = await authenticatedRequest(`/adminpanel/email-logs/${logId}/`, {
        method: "DELETE"
      });
      
      if (response.ok) {
        setEmailLogs(emailLogs.filter(log => log.id !== logId));
      }
    } catch (error) {
      console.error("Failed to delete email log:", error);
    }
  };

  // Modal handlers
  const openUserModal = (user = null) => {
    if (user) {
      setSelectedUser(user);
      setUserForm({
        full_name: user.full_name,
        email: user.email,
        password: "",
        is_active: user.is_active,
        is_superuser: user.is_superuser
      });
    } else {
      setSelectedUser(null);
      setUserForm({ full_name: "", email: "", password: "", is_active: true, is_superuser: false });
    }
    setShowUserModal(true);
  };

  const openPasswordModal = (user) => {
    setSelectedUser(user);
    setPasswordForm({ password: "", send_email: true, require_change: true });
    setShowPasswordModal(true);
  };

  const openEmailModal = () => {
    setEmailForm({ recipient_ids: [], subject: "", message: "", template_name: "admin/custom_email" });
    setShowEmailModal(true);
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/auth/login");
  };

  if (loading && activeTab === "dashboard") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">در حال بارگذاری پنل مدیریت...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">دسترسی رد شد</div>
          <div className="text-slate-400 mb-4">شما مجوز دسترسی به پنل مدیریت را ندارید.</div>
          <div className="text-slate-500 text-sm mb-4">
            Debug info: roles={JSON.stringify(user?.roles)}
          </div>
          <Button
            onClick={() => router.push("/Chat")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            برو به چت
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-slate-800 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">پنل مدیریت</h1>
                <p className="text-sm text-slate-400">خوش آمدید، {user.full_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => router.push("/Chat")}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                چت
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <LogOut className="w-4 h-4 mr-2" />
                خروج
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-slate-900/50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-2">
            {[
              { id: "dashboard", label: "داشبورد", icon: Home },
              { id: "users", label: "کاربران", icon: Users },
              { id: "chats", label: "چت‌ها", icon: MessageSquare },
              { id: "messages", label: "پیام‌ها", icon: FileText },
              { id: "email-logs", label: "لاگ ایمیل", icon: Mail },
              { id: "error-logs", label: "لاگ خطا", icon: AlertTriangle }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Render appropriate component based on active tab */}
        {activeTab === "dashboard" && (
          <AdminDashboard 
            stats={stats}
            onRefresh={fetchDashboardData}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === "users" && (
          <AdminUsers
            users={users}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onAddUser={() => openUserModal()}
            onSendEmail={openEmailModal}
            onEditUser={openUserModal}
            onResetPassword={openPasswordModal}
            onToggleUser={handleUserToggle}
            onDeleteUser={handleDeleteUser}
          />
        )}

        {activeTab === "chats" && (
          <AdminChats
            chats={chats}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onNavigateToMessages={() => setActiveTab("messages")}
          />
        )}

        {activeTab === "messages" && (
          <AdminMessages
            messages={messages}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        )}

        {activeTab === "email-logs" && (
          <AdminEmailLogs
            emailLogs={emailLogs}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onDeleteEmailLog={handleDeleteEmailLog}
          />
        )}

        {activeTab === "error-logs" && (
          <AdminErrorLogs
            errorLogs={errorLogs}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        )}
      </div>

      {/* Modals */}
      <AdminModals
        // User Modal
        showUserModal={showUserModal}
        setShowUserModal={setShowUserModal}
        selectedUser={selectedUser}
        userForm={userForm}
        setUserForm={setUserForm}
        onUserSubmit={selectedUser ? handleUpdateUser : handleCreateUser}
        
        // Password Modal
        showPasswordModal={showPasswordModal}
        setShowPasswordModal={setShowPasswordModal}
        passwordForm={passwordForm}
        setPasswordForm={setPasswordForm}
        onPasswordSubmit={handleResetPassword}
        
        // Email Modal
        showEmailModal={showEmailModal}
        setShowEmailModal={setShowEmailModal}
        emailForm={emailForm}
        setEmailForm={setEmailForm}
        onEmailSubmit={handleSendEmail}
        users={users}
      />
    </div>
  );
});

AdminPanel.disableLayout = true;
AdminPanel.requiresAuth = true;

export default AdminPanel;
