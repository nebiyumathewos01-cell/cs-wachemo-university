import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation, Outlet, Link } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, ClipboardList, FileText,
  Brain, TrendingUp, Bookmark, User, LogOut,
  Menu, X, GraduationCap, Clock, ChevronLeft,
  ChevronRight, Bell, Search, Settings, MessageSquare,
  CreditCard, Sparkles, LogIn, Code2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn, getInitials } from "@/utils";
import { academicApi } from "@/api/academic";
import { Button } from "@/components/ui/button";
import YearSelectPrompt from "@/components/common/YearSelectPrompt";
import ThemeToggle from "@/components/common/ThemeToggle";
import PaywallBanner from "@/components/payment/PaywallBanner";
import PaymentModal from "@/components/payment/PaymentModal";

const NAV_MAIN = [
  { label: "Dashboard",       path: "/dashboard",   icon: LayoutDashboard },
  { label: "Courses",         path: "/courses",     icon: BookOpen },
  { label: "Coding Practice", path: "/coding",      icon: Code2 },
  { label: "Quizzes",         path: "/quizzes",     icon: ClipboardList },
  { label: "Past Exams",      path: "/past-exams",  icon: FileText },
  { label: "Mock Exams",      path: "/mock-exams",  icon: GraduationCap },
  { label: "AI Study",        path: "/ai-study",    icon: Brain },
  { label: "Progress",        path: "/progress",    icon: TrendingUp },
  { label: "Bookmarks",       path: "/bookmarks",   icon: Bookmark },
  { label: "Feedback & Q&A",  path: "/feedback",    icon: MessageSquare },
  { label: "Payment & Access", path: "/payment",   icon: CreditCard },
];

const NAV_BOTTOM = [
  { label: "Try Demo",   path: "/demo",     icon: Sparkles },
  { label: "Settings",   path: "/settings",  icon: Settings },
  { label: "Profile",    path: "/profile",   icon: User },
];

const PAGE_TITLES: Record<string, string> = {
  "/payment":    "Payment & CBE Verification (50 ETB)",
  "/dashboard":  "Dashboard",
  "/courses":    "Courses",
  "/coding":     "Coding Practice",
  "/quizzes":    "AI Quiz",
  "/past-exams": "Past Exams",
  "/mock-exams": "Mock Exams",
  "/ai-study":   "AI Study Assistant",
  "/exit-exam":  "National Exit Exam Hub",
  "/progress":   "My Progress",
  "/bookmarks":  "Bookmarks",
  "/feedback":   "Comments & Feedback Session",
  "/profile":    "Profile",
  "/4th-year":   "4th Year",
};

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [yearName, setYearName] = useState<string>("Year");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // Auto-collapse on small screens
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth < 1280) setCollapsed(true);
      else setCollapsed(false);
    };
    handler();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Fetch year name
  useEffect(() => {
    if (user?.selected_year_id) {
      academicApi.getYear(user.selected_year_id).then(res => {
        if (res.data?.name) {
          setYearName(res.data.name);
        }
      }).catch(console.error);
    }
  }, [user?.selected_year_id]);

  // Close mobile drawer on navigate
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const handleLogout = async () => { await logout(); navigate("/login"); };

  const pageTitle = Object.entries(PAGE_TITLES).find(([k]) =>
    location.pathname.startsWith(k)
  )?.[1] ?? "CS Wachemo";

  const initials = getInitials(user?.full_name, "CS");

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 border-b border-border px-4 py-4 shrink-0",
        collapsed && !isMobile ? "justify-center px-3" : ""
      )}>
        <div className="h-9 w-9 rounded-full bg-white p-0.5 border border-[#ff6633]/30 shadow-xs flex items-center justify-center shrink-0 overflow-hidden">
          <img
            src="/wachemo-logo.png"
            alt="Wachemo University Logo"
            className="h-full w-full object-contain rounded-full"
          />
        </div>
        {(!collapsed || isMobile) && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground leading-tight">Wachemo University</p>
            <p className="text-2xs text-foreground-muted font-mono leading-tight">Computer Science</p>
          </div>
        )}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(v => !v)}
            className="ml-auto p-1 rounded hover:bg-muted text-foreground-subtle hover:text-foreground transition-colors"
            aria-label="Toggle sidebar"
          >
            {collapsed
              ? <ChevronRight className="h-3.5 w-3.5" />
              : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        )}
        {isMobile && (
          <button onClick={() => setSidebarOpen(false)} className="ml-auto p-1 rounded hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {!collapsed && !isMobile && (
          <p className="text-2xs font-semibold uppercase tracking-widest text-foreground-subtle px-3 mb-2">
            Learning
          </p>
        )}
        {NAV_MAIN.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative",
              collapsed && !isMobile ? "justify-center px-2.5" : "",
              isActive
                ? "bg-primary-subtle text-primary nav-active-indicator"
                : "text-foreground-muted hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {(!collapsed || isMobile) && <span>{label}</span>}
          </NavLink>
        ))}

        {!collapsed && !isMobile && (
          <p className="text-2xs font-semibold uppercase tracking-widest text-foreground-subtle px-3 mt-4 mb-2">
            Coming Soon
          </p>
        )}
        {(collapsed && !isMobile) && <div className="my-2 border-t border-border" />}
        <NavLink
          to="/exit-exam"
          className={({ isActive }) => cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative",
            collapsed && !isMobile ? "justify-center px-2.5" : "",
            isActive
              ? "bg-primary-subtle text-primary nav-active-indicator"
              : "text-foreground-subtle hover:bg-muted hover:text-foreground-muted"
          )}
        >
          <Clock className="h-4 w-4 shrink-0 opacity-60" />
          {(!collapsed || isMobile) && (
            <span className="flex items-center gap-2">
              Exit Exam
              <span className="text-2xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-medium">Soon</span>
            </span>
          )}
        </NavLink>
        <NavLink
          to="/4th-year"
          className={({ isActive }) => cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative",
            collapsed && !isMobile ? "justify-center px-2.5" : "",
            isActive
              ? "bg-primary-subtle text-primary nav-active-indicator"
              : "text-foreground-subtle hover:bg-muted hover:text-foreground-muted"
          )}
        >
          <GraduationCap className="h-4 w-4 shrink-0 opacity-60" />
          {(!collapsed || isMobile) && (
            <span className="flex items-center gap-2">
              4th Year
              <span className="text-2xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-medium">Soon</span>
            </span>
          )}
        </NavLink>
      </nav>

      {/* Bottom nav */}
      <div className="border-t border-border px-2 py-2 space-y-0.5 shrink-0">
        {NAV_BOTTOM.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative",
              collapsed && !isMobile ? "justify-center px-2.5" : "",
              isActive ? "bg-primary-subtle text-primary nav-active-indicator" : "text-foreground-muted hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {(!collapsed || isMobile) && <span>{label}</span>}
          </NavLink>
        ))}

        {/* User row */}
        <div className={cn(
          "flex items-center gap-3 px-3 py-2.5 mt-1",
          collapsed && !isMobile ? "justify-center" : ""
        )}>
          <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
            {user ? initials : "CS"}
          </div>
          {(!collapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user?.full_name || "Guest Preview"}</p>
              <p className="text-2xs text-foreground-subtle truncate">
                {user ? user.email : "50 ETB Full Access"}
              </p>
            </div>
          )}
          {(!collapsed || isMobile) && (
            user ? (
              <button
                onClick={handleLogout}
                className="p-1.5 rounded hover:bg-muted text-foreground-subtle hover:text-destructive transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            ) : (
              <Link
                to="/login"
                className="p-1.5 rounded hover:bg-muted text-primary transition-colors flex items-center gap-1 text-xs font-semibold"
                title="Sign In"
              >
                <LogIn className="h-3.5 w-3.5" />
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );

  const sidebarWidth = collapsed ? "w-[60px]" : "w-[220px]";

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Year select prompt */}
      {user && user.selected_year_id === null && <YearSelectPrompt />}

      {/* ── Desktop Sidebar ───────────────────────── */}
      <aside className={cn(
        "hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 bg-card border-r border-border",
        "transition-all duration-200",
        sidebarWidth
      )}>
        <SidebarContent />
      </aside>

      {/* ── Mobile Drawer ─────────────────────────── */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-[240px] bg-card border-r border-border h-full shadow-xl z-50 animate-slide-in">
            <SidebarContent isMobile />
          </aside>
        </div>
      )}

      {/* ── Main area ─────────────────────────────── */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-200",
        collapsed ? "lg:ml-[60px]" : "lg:ml-[220px]"
      )}>
        {/* Top header */}
        <header className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b border-border h-14 flex items-center px-4 gap-3 shrink-0">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 rounded hover:bg-muted text-foreground-muted"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Page title */}
          <h2 className="text-sm font-semibold text-foreground flex-1 lg:text-base">{pageTitle}</h2>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Pay 50 ETB Button if not paid */}
            {(!user || !user.is_paid) && (
              <Button
                size="sm"
                onClick={() => setPaymentModalOpen(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 h-8 gap-1.5 shadow-sm border border-amber-500/40 animate-pulse"
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Pay 50 ETB (CBE)</span>
                <span className="sm:hidden">50 ETB</span>
              </Button>
            )}

            {!user && (
              <Link to="/login">
                <Button size="sm" variant="outline" className="text-xs h-8">
                  Sign In
                </Button>
              </Link>
            )}

            <button className="p-1.5 rounded-full hover:bg-muted text-foreground-muted transition-colors">
              <Search className="h-4 w-4" />
            </button>
            <button className="p-1.5 rounded-full hover:bg-muted text-foreground-muted transition-colors relative mr-1">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive border border-card"></span>
            </button>
            {/* Academic year pill */}
            {user?.selected_year_id && (
              <div className="hidden sm:flex items-center gap-1.5 bg-primary-subtle text-primary text-xs font-medium px-2.5 py-1.5 rounded-full">
                <GraduationCap className="h-3 w-3" />
                <span>{yearName}</span>
              </div>
            )}
            {/* Theme Toggle (Day / Night mode) */}
            <ThemeToggle className="h-8 w-8 text-foreground-muted" />

            {/* Avatar */}
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold ml-1">
              {user ? initials : "CS"}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 pb-16 lg:pb-0 animate-fade-up">
          {location.pathname !== "/payment" && <PaywallBanner />}
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t border-border py-3 px-6 text-center text-2xs text-foreground-subtle no-print">
          Computer Science Wachemo University &middot; Developed by Nebiyu Mathewos
        </footer>
      </div>

      <PaymentModal open={paymentModalOpen} onOpenChange={setPaymentModalOpen} />

      {/* ── Mobile bottom nav ─────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-20 bg-card border-t border-border flex no-print">
        {[
          { label: "Home",    path: "/dashboard",  icon: LayoutDashboard },
          { label: "Courses", path: "/courses",    icon: BookOpen },
          { label: "Quizzes", path: "/quizzes",    icon: ClipboardList },
          { label: "Exams",   path: "/past-exams", icon: FileText },
          { label: "Profile", path: "/profile",    icon: User },
        ].map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => cn(
              "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-2xs font-medium transition-colors",
              isActive ? "text-primary" : "text-foreground-subtle"
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
