import React from "react";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

function AdminAccessDenied({ onNavigateToChat }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-8 backdrop-blur-xl text-center shadow-xl">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">دسترسی غیرمجاز</h1>
        <p className="text-slate-300 mb-6 leading-relaxed">
          متأسفانه شما دسترسی لازم برای مشاهده پنل مدیریت را ندارید. لطفاً با مدیر سیستم تماس بگیرید یا با نقش کاربری مناسب وارد شوید.
        </p>
        <Button
          onClick={onNavigateToChat}
          variant="outline"
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          بازگشت به چت
        </Button>
      </div>
    </div>
  );
}

export default AdminAccessDenied;
