import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

function VerifyEmailPage() {
  const router = useRouter();
  const { token, email } = router.query;
  const { resendVerification } = useAuth();
  const { theme, isDark } = useTheme();
  const [status, setStatus] = useState("loading"); // loading, success, error, expired
  const [message, setMessage] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const verifyEmail = async (verificationToken) => {
    setIsVerifying(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/auth/verify-email/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: verificationToken }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage("ایمیل شما با موفقیت تأیید شد! حالا می‌توانید وارد حساب کاربری خود شوید.");
      } else {
        if (data.detail && data.detail.includes("expired")) {
          setStatus("expired");
          setMessage("لینک تأیید منقضی شده است. لطفاً درخواست تأیید جدید ارسال کنید.");
        } else {
          setStatus("error");
          setMessage(data.detail || "خطا در تأیید ایمیل. لطفاً دوباره تلاش کنید.");
        }
      }
    } catch (error) {
      console.error("Verification error:", error);
      setStatus("error");
      setMessage("خطا در اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      await resendVerification();
      setMessage("ایمیل تأیید جدید ارسال شد. لطفاً صندوق ورودی خود را بررسی کنید.");
    } catch (error) {
      console.error("Resend error:", error);
      setMessage("خطا در ارسال ایمیل تأیید. لطفاً دوباره تلاش کنید.");
    } finally {
      setIsResending(false);
    }
  };

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else {
      setStatus("error");
      setMessage("لینک تأیید نامعتبر است.");
    }
  }, [token]);

  const getStatusIcon = () => {
    switch (status) {
      case "loading":
        return <Loader2 className="w-16 h-16 text-blue-400 animate-spin" />;
      case "success":
        return <CheckCircle className="w-16 h-16 text-green-400" />;
      case "error":
      case "expired":
        return <AlertCircle className="w-16 h-16 text-red-400" />;
      default:
        return <Mail className="w-16 h-16 text-blue-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "success":
        return "text-green-400";
      case "error":
      case "expired":
        return "text-red-400";
      default:
        return "text-blue-400";
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-10 ${
      isDark 
        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' 
        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100'
    }`}>
      <div className="w-full max-w-md">
        <div className={`rounded-3xl shadow-2xl backdrop-blur-xl p-8 sm:p-10 ${
          isDark 
            ? 'bg-slate-900/80 border border-slate-800' 
            : 'bg-white/80 border border-slate-200'
        }`}>
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              {getStatusIcon()}
            </div>

            <div className="space-y-2">
              <h2 className={`text-2xl font-semibold text-right ${
                isDark ? 'text-white' : 'text-slate-800'
              }`}>
                {status === "loading" && "در حال تأیید ایمیل..."}
                {status === "success" && "ایمیل تأیید شد!"}
                {(status === "error" || status === "expired") && "خطا در تأیید ایمیل"}
              </h2>
              
              {email && (
                <p className={`text-sm text-justify text-right ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  ایمیل: {email}
                </p>
              )}
              
              <p className={`text-sm text-justify text-right ${getStatusColor()}`}>
                {message}
              </p>
            </div>

            {status === "loading" && (
              <div className={`text-sm text-justify text-right ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                لطفاً صبر کنید...
              </div>
            )}

            {status === "success" && (
              <div className="space-y-4">
                <Button
                  onClick={() => router.push("/auth/login")}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-semibold py-3 rounded-xl transition-all duration-200"
                >
                  <span className="text-right">ورود به حساب کاربری</span>
                </Button>
              </div>
            )}

            {(status === "error" || status === "expired") && (
              <div className="space-y-4">
                <Button
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50"
                >
                  <span className="text-right">{isResending ? "در حال ارسال..." : "ارسال مجدد ایمیل تأیید"}</span>
                </Button>
                
                <div className="text-center">
                  <Link 
                    href="/auth/login" 
                    className={`font-medium text-sm ${
                      isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
                    }`}
                  >
                    <span className="text-right">بازگشت به صفحه ورود</span>
                  </Link>
                </div>
              </div>
            )}

            {status === "error" && !token && (
              <div className="text-center">
                <Link 
                  href="/auth/register" 
                  className={`font-medium text-sm ${
                    isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
                  }`}
                >
                  <span className="text-right">بازگشت به صفحه ثبت نام</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className={`mt-6 text-center text-sm text-justify text-right ${
          isDark ? 'text-slate-400' : 'text-slate-600'
        }`}>
          <p>اگر ایمیل تأیید را دریافت نکرده‌اید، لطفاً پوشه اسپم خود را نیز بررسی کنید.</p>
        </div>
      </div>
    </div>
  );
}

VerifyEmailPage.disableLayout = true;
VerifyEmailPage.requiresAuth = false;

export default VerifyEmailPage;
