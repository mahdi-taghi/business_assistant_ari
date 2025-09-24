# Admin Components

This directory contains all the admin panel components for the chatbot UI application.

## Components

### AdminDashboard
- **Purpose**: Main dashboard with statistics and quick actions
- **Props**: 
  - `stats`: Dashboard statistics object
  - `onRefresh`: Function to refresh data
  - `onNavigateToTab`: Function to navigate to different tabs

### AdminUsers
- **Purpose**: User management interface
- **Props**:
  - `users`: Array of user objects
  - `searchTerm`: Current search term
  - `onSearchChange`: Function to handle search input changes
  - `onAddUser`: Function to open add user modal
  - `onSendEmail`: Function to open send email modal
  - `onEditUser`: Function to open edit user modal
  - `onResetPassword`: Function to open reset password modal
  - `onToggleUser`: Function to toggle user active status
  - `onDeleteUser`: Function to delete user

### AdminChats
- **Purpose**: Chat management interface
- **Props**:
  - `chats`: Array of chat objects
  - `searchTerm`: Current search term
  - `onSearchChange`: Function to handle search input changes
  - `onNavigateToMessages`: Function to navigate to messages tab

### AdminMessages
- **Purpose**: Message management interface
- **Props**:
  - `messages`: Array of message objects
  - `searchTerm`: Current search term
  - `onSearchChange`: Function to handle search input changes

### AdminEmailLogs
- **Purpose**: Email logs management interface
- **Props**:
  - `emailLogs`: Array of email log objects
  - `searchTerm`: Current search term
  - `onSearchChange`: Function to handle search input changes
  - `onDeleteEmailLog`: Function to delete email log

### AdminErrorLogs
- **Purpose**: Error logs management interface
- **Props**:
  - `errorLogs`: Array of error log objects
  - `searchTerm`: Current search term
  - `onSearchChange`: Function to handle search input changes

### AdminModals
- **Purpose**: All modal dialogs for admin operations
- **Props**:
  - User Modal: `showUserModal`, `setShowUserModal`, `selectedUser`, `userForm`, `setUserForm`, `onUserSubmit`
  - Password Modal: `showPasswordModal`, `setShowPasswordModal`, `passwordForm`, `setPasswordForm`, `onPasswordSubmit`
  - Email Modal: `showEmailModal`, `setShowEmailModal`, `emailForm`, `setEmailForm`, `onEmailSubmit`, `users`

## Usage

```jsx
import {
  AdminDashboard,
  AdminUsers,
  AdminChats,
  AdminMessages,
  AdminEmailLogs,
  AdminErrorLogs,
  AdminModals
} from "@/Components/admin";

// Use components in your admin panel
<AdminDashboard 
  stats={stats}
  onRefresh={fetchDashboardData}
  onNavigateToTab={setActiveTab}
/>
```

## Features

- **Modular Design**: Each component handles a specific admin functionality
- **Reusable**: Components can be used independently
- **Consistent Styling**: All components follow the same design system
- **Search Functionality**: Built-in search for all list components
- **Modal Management**: Centralized modal handling
- **Responsive**: Mobile-friendly design
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Styling

All components use the same design system:
- Dark theme with slate colors
- Consistent spacing and typography
- Hover effects and transitions
- Responsive grid layouts
- Glassmorphism effects for cards
