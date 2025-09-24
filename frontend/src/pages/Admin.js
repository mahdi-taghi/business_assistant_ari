import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
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
} from "@/Components/admin";

function AdminPanel() {
  const { user, logout, authenticatedRequest } = useAuth();
  const router = useRouter();
  
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

  // Check if user is admin or superuser
  const isAdmin = user && (user.roles?.is_superuser || user.roles?.is_admin || user.is_superuser);

  // Debug logging
  useEffect(() => {
    console.log("=== ADMIN PANEL DEBUG ===");
    console.log("User object:", user);
    console.log("User roles:", user?.roles);
    console.log("User roles.is_admin:", user?.roles?.is_admin);
    console.log("User roles.is_superuser:", user?.roles?.is_superuser);
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

  // Fetch admin data
  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData();
    }
  }, [isAdmin]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [usersRes, chatsRes, messagesRes, emailLogsRes, errorLogsRes] = await Promise.all([
        authenticatedRequest("/api/adminpanel/users/"),
        authenticatedRequest("/api/adminpanel/chats/"),
        authenticatedRequest("/api/adminpanel/messages/"),
        authenticatedRequest("/api/adminpanel/email-logs/"),
        authenticatedRequest("/api/adminpanel/error-logs/")
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
      const response = await authenticatedRequest(`/api/adminpanel/users/${userId}/toggle_active/`, {
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
      const response = await authenticatedRequest(`/api/adminpanel/users/${userId}/`, {
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
      const response = await authenticatedRequest("/api/adminpanel/users/", {
        method: "POST",
        body: JSON.stringify(userForm)
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
      const response = await authenticatedRequest(`/api/adminpanel/users/${selectedUser.id}/`, {
        method: "PUT",
        body: JSON.stringify(userForm)
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
      const response = await authenticatedRequest(`/api/adminpanel/users/${selectedUser.id}/reset_password/`, {
        method: "POST",
        body: JSON.stringify(passwordForm)
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
      const response = await authenticatedRequest("/api/adminpanel/send-email/", {
        method: "POST",
        body: JSON.stringify(emailForm)
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
      const response = await authenticatedRequest(`/api/adminpanel/email-logs/${logId}/`, {
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
}

AdminPanel.disableLayout = true;
AdminPanel.requiresAuth = true;

export default AdminPanel;