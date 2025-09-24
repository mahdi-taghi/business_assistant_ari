import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, UserPlus } from "lucide-react";

function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("رمزهای عبور مطابقت ندارند. لطفاً دوباره تلاش کنید.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone_number: form.phone_number || undefined,
        password: form.password,
      });
      // Redirect to verification page instead of profile
      router.replace("/auth/verify-email?email=" + encodeURIComponent(form.email));
    } catch (err) {
      console.error("Registration failed", err);
      const message = err?.message || "ثبت نام ناموفق بود. لطفاً جزئیات خود را بررسی کنید.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl p-8 sm:p-10 order-last lg:order-first">
          <div className="mb-8 text-center space-y-2">
            <h2 className="text-2xl font-semibold text-white">حساب کاربری خود را بسازید</h2>
            <p className="text-sm text-slate-400">چند جزئیات به اشتراک بگذارید تا بتوانیم فضای کاری هوشمند شما را شخصی‌سازی کنیم.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="text-slate-200">نام</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  required
                  value={form.first_name}
                  onChange={handleChange}
                  placeholder="John"
                  className="w-full px-4 py-3 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name" className="text-slate-200">نام خانوادگی</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  required
                  value={form.last_name}
                  onChange={handleChange}
                  placeholder="Doe"
                  className="w-full px-4 py-3 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            </div>

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
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <div className="space-y-2">
                <Label htmlFor="phone_number" className="text-slate-200">شماره موبایل (اختیاری)</Label>
              <Input
                id="phone_number"
                name="phone_number"
                value={form.phone_number}
                onChange={handleChange}
                placeholder="09123456789"
                className="w-full px-4 py-3 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">رمز عبور</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-200">تأیید رمز عبور</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white font-semibold py-6 rounded-xl transition-all duration-200"
            >
              {isSubmitting ? "در حال ثبت نام..." : "ایجاد حساب"}
            </Button>
          </form>

          <div className="mt-6 text-xs text-slate-500 text-center">
            با ایجاد حساب کاربری، شما با شرایط خدمات دستیار هوشمند آری موافقت می‌کنید.
          </div>
        </div>

        <div className="flex flex-col justify-center space-y-6 text-white max-lg:text-center">
          <div className="flex items-center gap-3 justify-center lg:justify-start">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
              <UserPlus className="w-7 h-7" />
            </div>
            <div className="text-left">
              <p className="uppercase text-xs tracking-widest text-blue-300">دستیار هوشمند آری</p>
              <h1 className="text-3xl font-bold">فضای کاری هوشمند شخصی‌سازی شده</h1>
            </div>
          </div>
          <p className="text-slate-300 leading-relaxed">
            حضور خود را در دستیار هوشمند آری بسازید، گفتگوهای خود را در دسترس نگه دارید و پروفایل خود را در فضایی طراحی شده برای تیم‌های مدرن مدیریت کنید.
          </p>
          <div className="flex items-start gap-3 text-slate-300 max-lg:justify-center">
            <Sparkles className="w-5 h-5 text-purple-400 mt-1" />
            <ul className="space-y-2 text-sm text-left">
              <li>گفتگوها را در داشبورد چت زیبا سازماندهی کنید.</li>
              <li>فعالیت‌ها و نکات برجسته شخصی خود را پیگیری کنید.</li>
              <li>تنظیمات حساب و امنیت را کنترل کنید.</li>
            </ul>
          </div>
          <div className="text-sm text-slate-400">
            قبلاً حساب دارید؟ {" "}
            <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 font-medium">
              به جای آن وارد شوید
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

RegisterPage.disableLayout = true;
RegisterPage.requiresAuth = false;

export default RegisterPage;
