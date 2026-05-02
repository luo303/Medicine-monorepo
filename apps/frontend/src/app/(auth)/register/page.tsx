"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { register } from "@/features/auth/api/auth";
import { useTheme } from "@/components/theme-provider";

export default function RegisterPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 6) {
      setError("密码长度至少为 6 位");
      return;
    }

    setLoading(true);

    try {
      const result = await register({ username, password });

      if (result.code === 201) {
        setSuccess("注册成功！即将跳转到登录页面...");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setError(result.message || "注册失败");
      }
    } catch (err: any) {
      setError(err.message || "注册失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page w-full min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* 动态背景层 */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900" />

      {/* 背景装饰光球 */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-teal-500/8 blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[400px] h-[400px] rounded-full bg-cyan-500/6 blur-[100px] animate-pulse-slow delay-2000" />
      <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-emerald-500/5 blur-[80px]" />

      {/* 网格背景 */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)`,
          backgroundSize: "60px 60px"
        }}
      />

      {/* 主题切换按钮 */}
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="absolute top-5 right-5 z-30 w-10 h-10 flex items-center justify-center rounded-xl bg-white/8 backdrop-blur-md border border-white/10 text-slate-300 hover:text-white hover:bg-white/15 transition-all duration-300"
        aria-label={theme === "dark" ? "切换亮色模式" : "切换暗色模式"}
      >
        {theme === "dark" ? (
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        ) : (
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        )}
      </button>

      {/* 主卡片容器 */}
      <div className="relative z-10 w-full max-w-[420px]">
        {/* 品牌标识 */}
        <div className="text-center mb-7 auth-brand-enter">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-500 shadow-xl shadow-cyan-500/25 mb-4 ring-1 ring-white/10">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1.5">创建新账号</h1>
          <p className="text-sm text-slate-400">加入智能医疗数据管理平台</p>
        </div>

        {/* 注册表单卡片 */}
        <form onSubmit={handleSubmit} className="auth-card-enter">
          <div className="rounded-2xl bg-white/[0.07] backdrop-blur-2xl border border-white/[0.08] shadow-2xl shadow-black/20 overflow-hidden">
            {/* 卡片头部 */}
            <div className="px-7 pt-7 pb-5">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-cyan-400 to-emerald-400" />
                <h2 className="text-lg font-bold text-white">用户注册</h2>
              </div>
              <p className="text-xs text-slate-500 ml-5 pl-0.5">填写以下信息创建您的账号</p>
            </div>

            {/* 表单内容 */}
            <div className="px-7 pb-7 space-y-4">
              {/* 错误提示 */}
              {error && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 animate-shake">
                  <svg
                    className="w-4 h-4 text-red-400 mt-0.5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm text-red-300">{error}</span>
                </div>
              )}

              {/* 成功提示 */}
              {success && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <svg
                    className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm text-emerald-300">{success}</span>
                </div>
              )}

              {/* 用户名输入 */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="username"
                  className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-0.5"
                >
                  用户名
                </Label>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors duration-200">
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <Input
                    id="username"
                    type="text"
                    placeholder="请输入用户名"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                    className="h-11 pl-11 bg-white/[0.06] border-white/[0.1] text-white placeholder:text-slate-600 rounded-xl focus:border-cyan-500/50 focus:bg-white/[0.09] focus:ring-1 focus:ring-cyan-500/25 transition-all duration-200"
                  />
                </div>
              </div>

              {/* 密码输入 */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="password"
                  className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-0.5"
                >
                  密码
                </Label>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors duration-200">
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="请输入密码（至少 6 位）"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="h-11 pl-11 bg-white/[0.06] border-white/[0.1] text-white placeholder:text-slate-600 rounded-xl focus:border-cyan-500/50 focus:bg-white/[0.09] focus:ring-1 focus:ring-cyan-500/25 transition-all duration-200"
                  />
                </div>
              </div>

              {/* 密码强度指示器（可选） */}
              <div className="flex gap-1.5">
                {[1, 2, 3].map(level => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      password.length >= level * 2
                        ? password.length >= 6
                          ? "bg-emerald-400/60"
                          : "bg-yellow-400/50"
                        : "bg-white/[0.06]"
                    }`}
                  />
                ))}
              </div>

              {/* 注册按钮 */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 active:scale-[0.98] text-sm"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                      <path
                        d="M4 12a8 8 0 018-8"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="opacity-75"
                        strokeLinecap="round"
                      />
                    </svg>
                    正在注册...
                  </span>
                ) : (
                  "创建账号"
                )}
              </Button>
            </div>

            {/* 底部链接 */}
            <div className="px-7 py-4 bg-white/[0.02] border-t border-white/[0.06]">
              <p className="text-center text-sm text-slate-500">
                已有账号？{" "}
                <Link
                  href="/login"
                  className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors duration-200 underline-offset-2 hover:underline"
                >
                  立即登录
                </Link>
              </p>
            </div>
          </div>
        </form>

        {/* 底部说明 */}
        <p className="text-center text-xs text-slate-600 mt-5 auth-footer-enter">
          注册即表示您同意我们的服务条款和隐私政策
        </p>
      </div>
    </div>
  );
}
