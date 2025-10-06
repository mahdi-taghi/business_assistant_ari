import React from "react";

function AdminLoadingState({ message = "در حال بارگذاری پنل مدیریت..." }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <div className="text-white text-xl">{message}</div>
    </div>
  );
}

export default AdminLoadingState;
