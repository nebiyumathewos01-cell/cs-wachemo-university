import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye, EyeOff, Loader2, ArrowRight,
  Brain, FileText,
  ShieldCheck, KeyRound, Mail, User,
  Sparkles, Zap, GraduationCap,
  CreditCard, Copy, Target
} from "lucide-react";
import { useAuth, getErrorMessage } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import ThemeToggle from "@/components/common/ThemeToggle";
import PaymentModal from "@/components/payment/PaymentModal";

const schema = z.object({
  full_name: z.string().min(2, "Full name is required").max(100),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(5, "Password must be at least 5 characters"),
  confirm_password: z.string(),
}).refine(d => d.password === d.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"]
});

type Form = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: registerUser, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [error, setError] = useState("");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const CBE_ACCOUNT = "1000503206505";
  const handleCopyAccount = () => {
    navigator.clipboard.writeText(CBE_ACCOUNT);
    toast({
      title: "CBE Account Copied!",
      description: `Account ${CBE_ACCOUNT} copied to clipboard.`,
    });
  };

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const pwdValue = watch("password", "");
  let score = 0;
  if (pwdValue.length >= 8) score += 1;
  if (/[A-Z]/.test(pwdValue)) score += 1;
  if (/[0-9]/.test(pwdValue)) score += 1;
  if (/[^A-Za-z0-9]/.test(pwdValue)) score += 1;

  if (!isLoading && isAuthenticated) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (data: Form) => {
    try {
      setError("");
      await registerUser({
        full_name: data.full_name.trim(),
        email: data.email,
        password: data.password
      });
      navigate("/dashboard", { replace: true });
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
            <span>Registration Open</span>
          </div>
        </div>

        {/* Center Content */}
        <div className="relative z-10 my-auto py-10 space-y-6 max-w-xl">
          <div className="inline-flex items-center gap-2 bg-[#ff6633]/10 border border-[#ff6633]/25 rounded-full px-3.5 py-1 text-xs text-[#ff6633] font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-[#ff6633]" />
            Join The Department
          </div>

          <h1 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Create Your <br />
            <span className="bg-gradient-to-r from-[#ff6633] via-[#ff8855] to-[#ffa375] bg-clip-text text-transparent">
              Student Account
            </span>
          </h1>

          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
            Gain full access to course lecture notes, interactive AI quizzes, mock exams, and verified university past papers.
          </p>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {[
              { icon: GraduationCap, title: "Exit Exam & GPE Prep", desc: "National Exit Exam & GPE competency mastery", highlight: true },
              { icon: FileText, title: "Course Repository", desc: "Lecture slides, notes & syllabi", highlight: false },
              { icon: Brain, title: "AI Practice Quizzes", desc: "Instant chapter-based self assessment", highlight: false },
              { icon: Zap, title: "AI Study Tutor", desc: "Interactive computer science guidance", highlight: false },
            ].map(({ icon: Icon, title, desc, highlight }) => (
              <div
                key={title}
                className={`p-3.5 rounded-xl border shadow-xs flex items-start gap-3 transition-colors ${
                  highlight
                    ? "bg-purple-100/80 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800"
                    : "bg-white/70 dark:bg-[#1d2229]/80 border-slate-200/80 dark:border-[#2b333e]"
                }`}
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  highlight
                    ? "bg-[#800080] text-white"
                    : "bg-[#ff6633]/15 border border-[#ff6633]/25 text-[#ff6633]"
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-xs text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                    {title}
                    {highlight && <Badge className="bg-[#800080] text-white text-[9px] px-1.5 py-0">Featured</Badge>}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Special Promotional Offer Notice */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
            <Zap className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-[12px] flex items-center gap-1.5">
                <span>🔥 Early Bird Access: Only 50 ETB</span>
                <span className="text-[10px] bg-amber-500 text-black px-1.5 py-0.2 rounded font-extrabold">Save 50%</span>
              </p>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                50 ETB promo valid until <strong>September 30, 2026</strong>. Price becomes 100 ETB thereafter.
                Pay via <strong>CBE: 1000503206505 (Nebiyu Mathewos)</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Left Bottom Tag */}
        <div className="relative z-10 pt-4 border-t border-slate-200 dark:border-[#222831] flex items-center justify-between text-2xs text-slate-500 dark:text-slate-400 font-mono">
          <Link to="/demo" className="text-[#ff6633] font-bold hover:underline flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Try Interactive Demo
          </Link>
          <span>Think · Build · Innovate</span>
        </div>
      </div>

      {/* ── Right Half: Full-Bleed Register Form (lg:w-1/2) ───────────── */}
      <div className="w-full lg:w-1/2 bg-slate-50 dark:bg-[#121518] p-8 sm:p-12 lg:p-16 flex flex-col justify-between items-center relative">
        {/* Top Controls on Right Side */}
        <div className="w-full max-w-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xs font-mono uppercase tracking-wider text-[#ff6633] font-bold">
              New Account
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle className="h-8 w-8 text-slate-600 dark:text-[#9ca3af] hover:text-slate-900 dark:hover:text-white bg-white dark:bg-[#1a1f26] border border-slate-200 dark:border-[#2d3642] shadow-xs" />
            <Badge variant="outline" className="text-2xs font-mono gap-1 text-[#ff6633] border-[#ff6633]/40 bg-[#ff6633]/10 px-2.5 py-1">
              <ShieldCheck className="h-3.5 w-3.5 text-[#ff6633]" /> Register
            </Badge>
          </div>
        </div>

        {/* Center Form Container */}
        <div className="w-full max-w-md my-auto py-6 space-y-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Create Student Account
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#9ca3af] mt-1">
              Join Computer Science Wachemo University Portal
            </p>
          </div>

          {/* 💳 Prominent CBE Payment & Feature Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-purple-500/10 to-[#ff6633]/15 border-2 border-amber-500/40 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span>CBE Payment & Portal Access</span>
              </span>
              <Badge className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] px-2 py-0.5 shadow-xs">
                50 ETB PROMO
              </Badge>
            </div>
            
            <div className="bg-white/90 dark:bg-[#181d24]/90 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Bank:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">Commercial Bank of Ethiopia (CBE)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Account:</span>
                <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  <span>1000503206505</span>
                  <button
                    type="button"
                    onClick={handleCopyAccount}
                    className="text-amber-600 hover:text-amber-700"
                    title="Copy CBE Account"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Holder:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">Nebiyu Mathewos</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Price:</span>
                <span className="font-extrabold text-amber-600 dark:text-amber-400">
                  50 ETB <span className="line-through text-slate-400 font-normal text-[11px]">100 ETB</span> (Until Sept 30, 2026)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <Button
                type="button"
                size="sm"
                onClick={() => setPaymentModalOpen(true)}
                className="w-full bg-[#800080] hover:bg-[#6b006b] text-white text-xs font-bold h-9 shadow-xs"
              >
                <CreditCard className="h-3.5 w-3.5 mr-1" /> Pay / Submit Proof
              </Button>
              <Link to="/demo" className="w-full">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full text-xs font-bold h-9 border-[#ff6633]/40 text-[#ff6633] hover:bg-[#ff6633]/10"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1 text-amber-500" /> Free Demo
                </Button>
              </Link>
            </div>

            {/* Quick Exam Prep Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <Link to="/exit-exam" className="w-full">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-full text-[11px] font-semibold h-8 bg-purple-100/80 dark:bg-purple-950/50 text-purple-900 dark:text-purple-300 hover:bg-purple-200/80"
                >
                  <GraduationCap className="h-3.5 w-3.5 mr-1 text-purple-600" /> Exit Exam (Soon)
                </Button>
              </Link>
              <Link to="/gpe-exam" className="w-full">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-full text-[11px] font-semibold h-8 bg-indigo-100/80 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-300 hover:bg-indigo-200/80"
                >
                  <Target className="h-3.5 w-3.5 mr-1 text-indigo-600" /> GPE Exam Prep
                </Button>
              </Link>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-[#3b1219] border border-red-200 dark:border-red-500/40 text-red-700 dark:text-red-300 text-xs px-4 py-3 flex items-start gap-2.5">
              <div className="min-w-0 flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="full_name" className="text-xs font-semibold text-slate-700 dark:text-[#e2e8f0]">
                Full Name
              </Label>
              <div className="relative">
                <Input
                  id="full_name"
                  placeholder="e.g. Nebiyu Mathewos"
                  autoFocus
                  className="pl-10 h-11 bg-white dark:bg-[#181d24] border-slate-300 dark:border-[#2f3744] focus-visible:border-[#ff6633] focus-visible:ring-2 focus-visible:ring-[#ff6633]/30 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#64748b] text-sm shadow-xs"
                  {...register("full_name")}
                />
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-[#94a3b8] pointer-events-none" />
              </div>
              {errors.full_name && <p className="text-xs text-red-500 font-medium">{errors.full_name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-[#e2e8f0]">
                Email Address
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="neba@gmail.com"
                  className="pl-10 h-11 bg-white dark:bg-[#181d24] border-slate-300 dark:border-[#2f3744] focus-visible:border-[#ff6633] focus-visible:ring-2 focus-visible:ring-[#ff6633]/30 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#64748b] text-sm shadow-xs"
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
                  placeholder="At least 8 characters"
                  className="pl-10 pr-11 h-11 bg-white dark:bg-[#181d24] border-slate-300 dark:border-[#2f3744] focus-visible:border-[#ff6633] focus-visible:ring-2 focus-visible:ring-[#ff6633]/30 font-mono text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#64748b] shadow-xs"
                  {...register("password")}
                />
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-[#94a3b8] pointer-events-none" />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:text-[#94a3b8] dark:hover:text-[#f3f4f6] transition-colors p-1"
                  onClick={() => setShowPwd(v => !v)}
                  aria-expanded={showPwd}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password strength indicator */}
              <div className="space-y-1 pt-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(level => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        pwdValue.length > 0
                          ? score >= level
                            ? score <= 2
                              ? "bg-amber-500"
                              : "bg-[#ff6633]"
                            : "bg-slate-200 dark:bg-[#28303a]"
                          : "bg-slate-200 dark:bg-[#28303a]"
                      }`}
                    />
                  ))}
                </div>
                {pwdValue.length > 0 && (
                  <p className="text-[11px] text-slate-500 dark:text-[#9ca3af] font-mono">
                    Security: {score <= 1 ? "Weak" : score <= 3 ? "Medium" : "Strong"}
                  </p>
                )}
              </div>
              {errors.password && <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm" className="text-xs font-semibold text-slate-700 dark:text-[#e2e8f0]">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirm"
                  type={showConfirmPwd ? "text" : "password"}
                  placeholder="Repeat password"
                  className="pl-10 pr-11 h-11 bg-white dark:bg-[#181d24] border-slate-300 dark:border-[#2f3744] focus-visible:border-[#ff6633] focus-visible:ring-2 focus-visible:ring-[#ff6633]/30 font-mono text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#64748b] shadow-xs"
                  {...register("confirm_password")}
                />
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-[#94a3b8] pointer-events-none" />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:text-[#94a3b8] dark:hover:text-[#f3f4f6] transition-colors p-1"
                  onClick={() => setShowConfirmPwd(v => !v)}
                  aria-expanded={showConfirmPwd}
                >
                  {showConfirmPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirm_password && <p className="text-xs text-red-500 font-medium">{errors.confirm_password.message}</p>}
            </div>

            <Button
              type="submit"
              className="w-full h-12 gap-2 text-sm font-bold bg-[#ff6633] hover:bg-[#e65526] text-white shadow-lg shadow-[#ff6633]/25 border border-[#ff7b47]/40 transition-all mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? "Creating Account…" : "Register Account →"}
              {!isSubmitting && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          {/* Form Footer */}
          <div className="pt-4 mt-2 border-t border-slate-200/80 dark:border-[#222831] text-center text-xs text-slate-500 dark:text-[#9ca3af]">
            Already registered?{" "}
            <Link to="/login" className="text-[#ff6633] font-bold hover:underline">
              Sign in to portal →
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

      <PaymentModal open={paymentModalOpen} onOpenChange={setPaymentModalOpen} />
    </div>
  );
}
