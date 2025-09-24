import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot, Sparkles } from "lucide-react";

function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(form);
      router.replace("/Chat");
    } catch (err) {
      console.error("Login failed", err);
      
      // Check if the error is related to email verification
      if (err?.message && err.message.includes("email not verified")) {
        setError("لطفاً ابتدا ایمیل خود را تأیید کنید. ایمیل تأیید به آدرس شما ارسال شده است.");
      } else {
        const message = err?.message || "ورود ناموفق بود. لطفاً جزئیات خود را بررسی کنید و دوباره تلاش کنید.";
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="hidden lg:flex flex-col space-y-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <p className="uppercase text-xs tracking-widest text-blue-300">دستیار هوشمند آری</p>
              <h1 className="text-3xl font-bold">خوش آمدید</h1>
            </div>
          </div>
          <p className="text-slate-300 leading-relaxed">
            وارد شوید تا تجربه دستیار هوشمند در سطح سازمانی را باز کنید. گفتگوهای موجود، جزئیات پروفایل و داشبورد هوشمند شما منتظرتان است.
          </p>
          <div className="flex items-center gap-3 text-slate-400">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span>تاریخچه گفتگوها، پروفایل شخصی و پنل کنترل مدرن.</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl p-8 sm:p-10">
          <div className="mb-8 text-center space-y-2">
            <h2 className="text-2xl font-semibold text-white">ورود</h2>
            <p className="text-sm text-slate-400">اطلاعات ثبت نام خود را وارد کنید تا ادامه دهید.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">ایمیل</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-200">رمز عبور</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={form.password}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
                {error}
                {error.includes("ایمیل خود را تأیید کنید") && (
                  <div className="mt-2">
                    <Link 
                      href="/auth/verify-email" 
                      className="text-blue-400 hover:text-blue-300 font-medium text-xs underline"
                    >
                      ارسال مجدد ایمیل تأیید
                    </Link>
                  </div>
                )}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white font-semibold py-6 rounded-xl transition-all duration-200"
            >
              {isSubmitting ? "در حال ورود..." : "ورود"}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-400">
            <span>جدید هستید؟ </span>
            <Link href="/auth/register" className="text-blue-400 hover:text-blue-300 font-medium">
              حساب کاربری بسازید
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

LoginPage.disableLayout = true;
LoginPage.requiresAuth = false;

export default LoginPage;
