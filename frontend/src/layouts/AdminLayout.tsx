import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, BookMarked, FileUp, FileText,
  Sparkles, Users, BarChart2, Settings, LogOut,
  Menu, X, Shield, ChevronLeft, ChevronRight, ClipboardList,
  MessageSquare
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn, getInitials } from "@/utils";
import ThemeToggle from "@/components/common/ThemeToggle";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard",    path: "/admin",             icon: LayoutDashboard },
    ],
  },
  {
    label: "Academic",
    items: [
      { label: "Courses",      path: "/admin/courses",     icon: BookOpen },
      { label: "Chapters",     path: "/admin/chapters",    icon: BookMarked },
      { label: "Materials",    path: "/admin/materials",   icon: FileUp },
      { label: "Past Exams",   path: "/admin/past-exams",  icon: FileText },
    ],
  },
  {
    label: "AI",
    items: [
      { label: "AI Review",    path: "/admin/ai-review",   icon: Sparkles },
      { label: "Questions",    path: "/admin/questions",   icon: ClipboardList },
    ],
  },
  {
    label: "Users & Community",
    items: [
      { label: "Students",     path: "/admin/students",    icon: Users },
      { label: "Feedback & Comments", path: "/admin/comments", icon: MessageSquare },
      { label: "Analytics",    path: "/admin/analytics",   icon: BarChart2 },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Settings",     path: "/admin/settings",    icon: Settings },
    ],
  },
];

const PAGE_TITLES: Record<string, string> = {
  "/admin/courses":   "Manage Courses",
  "/admin/chapters":  "Manage Chapters",
  "/admin/materials": "Manage Materials",
  "/admin/past-exams":"Manage Past Exams",
  "/admin/ai-review": "AI Quiz Review",
  "/admin/questions": "Manage Questions",
  "/admin/students":  "Student Directory & Registration",
  "/admin/comments":  "Student Comments & Feedback Session",
  "/admin/analytics": "Analytics",
  "/admin/settings":  "Settings",
  "/admin":           "Admin Dashboard",
};

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const h = () => { if (window.innerWidth < 1280) setCollapsed(true); else setCollapsed(false); };
    h(); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h);
  }, []);
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = async () => { await logout(); navigate("/login"); };
  const initials = getInitials(user?.full_name, "AD");

  const pageTitle = Object.entries(PAGE_TITLES).find(([k]) => location.pathname.startsWith(k))?.[1] ?? "Admin";

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
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground leading-tight">Admin Console</p>
            <p className="text-2xs text-foreground-muted font-mono">Wachemo CS</p>
          </div>
        )}
        {!isMobile ? (
          <button onClick={() => setCollapsed(v => !v)} className="p-1 rounded hover:bg-muted text-foreground-subtle transition-colors">
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <button onClick={() => setMobileOpen(false)} className="p-1 rounded hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Admin badge */}
      {(!collapsed || isMobile) && (
        <div className="mx-3 mt-3 mb-1 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-amber-600 shrink-0" />
          <span className="text-2xs text-amber-700 font-semibold">Administrator</span>
        </div>
      )}

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {NAV_GROUPS.map(group => (
          <div key={group.label} className="mb-1">
            {(!collapsed || isMobile) && (
              <p className="text-2xs font-semibold uppercase tracking-widest text-foreground-subtle px-3 py-1.5">{group.label}</p>
            )}
            {group.items.map(({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end={path === "/admin"}
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
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-border px-2 py-2 shrink-0">
        <div className={cn("flex items-center gap-3 px-3 py-2", collapsed && !isMobile ? "justify-center" : "")}>
          <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">{initials}</div>
          {(!collapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user?.full_name}</p>
              <p className="text-2xs text-foreground-subtle">Admin</p>
            </div>
          )}
          {(!collapsed || isMobile) && (
            <button onClick={handleLogout} className="p-1.5 rounded hover:bg-muted text-foreground-subtle hover:text-destructive transition-colors" aria-label="Sign out">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 bg-card border-r border-border transition-all duration-200",
        collapsed ? "w-[60px]" : "w-[220px]"
      )}>
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-[240px] bg-card border-r border-border h-full shadow-xl z-50 animate-slide-in">
            <SidebarContent isMobile />
          </aside>
        </div>
      )}

      {/* Content */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-200",
        collapsed ? "lg:ml-[60px]" : "lg:ml-[220px]"
      )}>
        <header className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b border-border h-14 flex items-center px-4 gap-3 shrink-0">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-1.5 rounded hover:bg-muted text-foreground-muted">
            <Menu className="h-5 w-5" />
          </button>
          <h2 className="text-sm font-semibold flex-1 lg:text-base">{pageTitle}</h2>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-medium px-2.5 py-1 rounded-full">
              <Shield className="h-3 w-3" />Admin
            </div>
            {/* Theme Toggle (Day / Night mode) */}
            <ThemeToggle className="h-8 w-8 text-foreground-muted" />
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{initials}</div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 pb-16 lg:pb-0 animate-fade-up">
          <Outlet />
        </main>

        <footer className="border-t border-border py-3 px-6 text-center text-2xs text-foreground-subtle no-print">
          Computer Science Wachemo University &middot; Developed by Nebiyu Mathewos
        </footer>
      </div>

      {/* ── Mobile bottom nav ─────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-20 bg-card border-t border-border flex no-print">
        {[
          { label: "Dashboard", path: "/admin",            icon: LayoutDashboard },
          { label: "Courses",   path: "/admin/courses",    icon: BookOpen },
          { label: "Materials", path: "/admin/materials",  icon: FileUp },
          { label: "Students",  path: "/admin/students",   icon: Users },
        ].map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/admin"}
            className={({ isActive }) => cn(
              "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-2xs font-medium transition-colors",
              isActive ? "text-primary" : "text-foreground-subtle"
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        ))}
        <button
          onClick={() => setMobileOpen(true)}
          className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-2xs font-medium transition-colors text-foreground-subtle"
        >
          <Menu className="h-5 w-5" />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}
