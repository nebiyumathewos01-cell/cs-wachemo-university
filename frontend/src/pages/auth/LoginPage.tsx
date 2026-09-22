import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye, EyeOff, Loader2, ArrowRight,
  Brain, FileText,
  ShieldCheck, KeyRound, Mail,
  Sparkles, Zap, GraduationCap
} from "lucide-react";
import { useAuth, getErrorMessage } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import ThemeToggle from "@/components/common/ThemeToggle";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type Form = z.infer<typeof schema>;

export default function LoginPage() {
  const { login, isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<Form>({ resolver: zodResolver(schema) });

  if (!isLoading && isAuthenticated) {
    return <Navigate to={user?.role === "admin" ? "/admin" : "/dashboard"} replace />;
  }

  const onSubmit = async (data: Form) => {
    try {
      setError("");
      const u = await login(data);
      navigate(u.role === "admin" ? "/admin" : "/dashboard", { replace: true });
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50 dark:bg-[#121518] text-slate-900 dark:text-[#f3f4f6] selection:bg-[#ff6633]/30 selection:text-white transition-colors duration-200">
      {/* ── Left Half: Full-Bleed University Brand (lg:w-1/2) ─────────── */}
      <div className="w-full lg:w-1/2 bg-slate-100/80 dark:bg-[#161a1f] border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-[#222831] p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Cyber Grid Background */}
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, #ff6633 1px, transparent 1px),
                              linear-gradient(to bottom, #ff6633 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />

        {/* Ambient Burp Orange Glow */}
        <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] bg-[#ff6633]/10 dark:bg-[#ff6633]/12 rounded-full blur-[140px] pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="h-14 w-14 rounded-full bg-white p-1 border-2 border-[#ff6633]/40 shadow-md shadow-[#ff6633]/15 overflow-hidden flex items-center justify-center shrink-0">
              <img
                src="/wachemo-logo.png"
                alt="Wachemo University Logo"
                className="h-full w-full object-contain rounded-full"
              />
            </div>
            <div>
              <p className="font-bold text-lg leading-tight tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                Wachemo University
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#ff6633]/15 text-[#ff6633] border border-[#ff6633]/30">
                  CS
                </span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Department of Computer Science</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-white/80 dark:bg-[#1f252d] border border-slate-200 dark:border-[#2d3642] rounded-full px-3 py-1 text-2xs font-mono text-[#ff6633] shadow-xs">
            <span className="h-2 w-2 rounded-full bg-[#ff6633] animate-pulse" />
            <span>CoSc Active</span>
          </div>
        </div>

        {/* Center Content */}
        <div className="relative z-10 my-auto py-10 space-y-6 max-w-xl">
          <div className="inline-flex items-center gap-2 bg-[#ff6633]/10 border border-[#ff6633]/25 rounded-full px-3.5 py-1 text-xs text-[#ff8855] font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-[#ff6633]" />
            Wachemo University CS
          </div>

          <h1 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Computer Science <br />
            <span className="bg-gradient-to-r from-[#ff6633] via-[#ff8855] to-[#ffa375] bg-clip-text text-transparent">
              Learning &amp; Examination
            </span>
          </h1>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {[
              { icon: FileText, title: "Course Materials", desc: "Organized lecture slides & notes" },
              { icon: Brain, title: "AI Chapter Quizzes", desc: "Interactive practice with explanations" },
              { icon: GraduationCap, title: "Past Exam Archive", desc: "Midterms & finals with PDF downloads" },
              { icon: Zap, title: "AI Study Assistant", desc: "24/7 intelligent course guidance" },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="p-3.5 rounded-xl bg-white/70 dark:bg-[#1d2229]/80 border border-slate-200/80 dark:border-[#2b333e] shadow-xs flex items-start gap-3"
              >
                <div className="h-8 w-8 rounded-lg bg-[#ff6633]/15 border border-[#ff6633]/25 flex items-center justify-center text-[#ff6633] shrink-0 mt-0.5">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-xs text-slate-900 dark:text-white leading-tight">{title}</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Left Bottom Tag */}
        <div className="relative z-10 pt-4 border-t border-slate-200 dark:border-[#222831] flex items-center justify-between text-2xs text-slate-500 dark:text-slate-400 font-mono">
          <span>&lt;Code The Future /&gt;</span>
          <span>Think · Build · Innovate</span>
        </div>
      </div>

      {/* ── Right Half: Full-Bleed Login Form (lg:w-1/2) ──────────────── */}
      <div className="w-full lg:w-1/2 bg-slate-50 dark:bg-[#121518] p-8 sm:p-12 lg:p-16 flex flex-col justify-between items-center relative">
        {/* Top Controls on Right Side */}
        <div className="w-full max-w-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xs font-mono uppercase tracking-wider text-[#ff6633] font-bold">
              Secure Gateway
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle className="h-8 w-8 text-slate-600 dark:text-[#9ca3af] hover:text-slate-900 dark:hover:text-white bg-white dark:bg-[#1a1f26] border border-slate-200 dark:border-[#2d3642] shadow-xs" />
            <Badge variant="outline" className="text-2xs font-mono gap-1 text-[#ff6633] border-[#ff6633]/40 bg-[#ff6633]/10 px-2.5 py-1">
              <ShieldCheck className="h-3.5 w-3.5 text-[#ff6633]" /> Sign In
            </Badge>
          </div>
        </div>

        {/* Center Form Container */}
        <div className="w-full max-w-md my-auto py-8 space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Welcome to Wachemo CS
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#9ca3af] mt-1.5">
              Built for CS students — sign in to access course materials, quizzes, and past exams.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-[#3b1219] border border-red-200 dark:border-red-500/40 text-red-700 dark:text-red-300 text-xs px-4 py-3 flex items-start gap-2.5">
              <div className="min-w-0 flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-[#e2e8f0]">
                Email Address
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="neba@gmail.com"
                  autoComplete="email"
                  autoFocus
                  aria-invalid={!!errors.email}
                  className="pl-10 h-12 bg-white dark:bg-[#181d24] border-slate-300 dark:border-[#2f3744] focus-visible:border-[#ff6633] focus-visible:ring-2 focus-visible:ring-[#ff6633]/30 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#64748b] text-sm shadow-xs"
                  {...register("email")}
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-[#94a3b8] pointer-events-none" />
              </div>
              {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-slate-700 dark:text-[#e2e8f0]">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  className="pl-10 pr-11 h-12 bg-white dark:bg-[#181d24] border-slate-300 dark:border-[#2f3744] focus-visible:border-[#ff6633] focus-visible:ring-2 focus-visible:ring-[#ff6633]/30 font-mono text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#64748b] shadow-xs"
                  {...register("password")}
                />
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-[#94a3b8] pointer-events-none" />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:text-[#94a3b8] dark:hover:text-[#f3f4f6] transition-colors p-1"
                  onClick={() => setShowPwd(v => !v)}
                  aria-label={showPwd ? "Hide password" : "Show password"}
                  aria-expanded={showPwd}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              className="w-full h-12 gap-2 text-sm font-bold bg-[#ff6633] hover:bg-[#e65526] text-white shadow-lg shadow-[#ff6633]/25 border border-[#ff7b47]/40 transition-all mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? "Signing in…" : "Sign In to Wachemo CS →"}
              {!isSubmitting && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          {/* Footer Link */}
          <div className="text-center text-xs text-slate-500 dark:text-[#9ca3af] pt-4 border-t border-slate-200/80 dark:border-[#222831]">
            Don&apos;t have an account yet?{" "}
            <Link to="/register" className="text-[#ff6633] font-bold hover:underline">
              Create student account →
            </Link>
          </div>
        </div>

        {/* ── Bottom Attribution on Right Half ────────────────────────── */}
        <div className="w-full max-w-md text-center space-y-1 pt-4 border-t border-slate-200/60 dark:border-[#1e242c]">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Developed by Nebiyu Mathewos
          </p>
          <p className="text-2xs text-slate-500 dark:text-[#64748b] font-mono">
            Computer Science Learning Platform
          </p>
        </div>
      </div>
    </div>
  );
}
