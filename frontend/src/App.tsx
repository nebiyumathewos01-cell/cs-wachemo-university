import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { Loader2, Construction } from "lucide-react";

// Layouts
import StudentLayout from "@/layouts/StudentLayout";
import AdminLayout from "@/layouts/AdminLayout";

// Guards
import ProtectedRoute from "@/components/common/ProtectedRoute";
import NotFoundPage from "@/components/common/NotFoundPage";

// Auth (not lazy — needed immediately)
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";

// Public / Demo pages
const DemoPage          = lazy(() => import("@/pages/public/DemoPage"));

// Student pages (lazy for performance)
const DashboardPage     = lazy(() => import("@/pages/student/DashboardPage"));
const CoursesPage       = lazy(() => import("@/pages/student/CoursesPage"));
const CourseDetailPage  = lazy(() => import("@/pages/student/CourseDetailPage"));
const ChapterDetailPage = lazy(() => import("@/pages/student/ChapterDetailPage"));
const QuizzesPage       = lazy(() => import("@/pages/student/QuizzesPage"));
const MockExamsPage     = lazy(() => import("@/pages/student/MockExamsPage"));
const PastExamsPage     = lazy(() => import("@/pages/student/PastExamsPage"));
const AIStudyPage       = lazy(() => import("@/pages/student/AIStudyPage"));
const ProgressPage      = lazy(() => import("@/pages/student/ProgressPage"));
const BookmarksPage     = lazy(() => import("@/pages/student/BookmarksPage"));
const ProfilePage       = lazy(() => import("@/pages/student/ProfilePage"));
const StudentFeedbackPage = lazy(() => import("@/pages/student/StudentFeedbackPage"));
const PaymentPage       = lazy(() => import("@/pages/student/PaymentPage"));

// Coming Soon & Special Exams pages
const ExitExamPage   = lazy(() => import("@/pages/coming-soon/ExitExamPage"));
const FourthYearPage = lazy(() => import("@/pages/coming-soon/FourthYearPage"));

// Admin pages (lazy)
const AdminDashboardPage  = lazy(() => import("@/pages/admin/AdminDashboardPage"));
const AdminPaymentsPage   = lazy(() => import("@/pages/admin/AdminPaymentsPage"));
const AdminCoursesPage    = lazy(() => import("@/pages/admin/AdminCoursesPage"));
const AdminChaptersPage   = lazy(() => import("@/pages/admin/AdminChaptersPage"));
const AdminMaterialsPage  = lazy(() => import("@/pages/admin/AdminMaterialsPage"));
const AdminPastExamsPage  = lazy(() => import("@/pages/admin/AdminPastExamsPage"));
const AdminStudentsPage   = lazy(() => import("@/pages/admin/AdminStudentsPage"));
const AdminCommentsPage   = lazy(() => import("@/pages/admin/AdminCommentsPage"));
const AdminAnalyticsPage  = lazy(() => import("@/pages/admin/AdminAnalyticsPage"));
const AdminAIReviewPage   = lazy(() => import("@/pages/admin/AdminAIReviewPage"));

// ─── Page loading fallback ───────────────────────────────────
function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white p-1 border border-[#ff6633]/40 shadow-sm overflow-hidden">
        <img
          src="/wachemo-logo.png"
          alt="Wachemo Logo"
          className="h-full w-full object-contain rounded-full"
        />
      </div>
      <div className="flex items-center text-muted-foreground gap-2 mt-1">
        <Loader2 className="h-4 w-4 animate-spin text-[#ff6633]" />
        <span className="text-sm font-medium">Loading Wachemo CS...</span>
      </div>
    </div>
  );
}

// ─── Placeholder for future phases ──────────────────────────
function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="max-w-2xl mx-auto pb-20 lg:pb-0 pt-8">
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      <p className="text-muted-foreground text-sm mb-6">{description}</p>
      
      <div className="border-2 border-dashed border-border/60 bg-surface rounded-xl p-10 flex flex-col items-center justify-center text-center">
        <div className="h-12 w-12 rounded-full bg-info-subtle flex items-center justify-center mb-4">
          <Construction className="h-6 w-6 text-info" />
        </div>
        <div className="callout-info w-full max-w-sm mb-0">
          <p className="font-semibold text-info mb-1">Coming in a future update</p>
          <p className="text-xs text-info/80">This feature is currently under active development.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Root redirect ───────────────────────────────────────────
function RootRedirect() {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === "admin") return <Navigate to="/admin" replace />;
  return <Navigate to="/dashboard" replace />;
}

// ─── All routes ──────────────────────────────────────────────
function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Root */}
        <Route path="/" element={<RootRedirect />} />

        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/demo" element={<DemoPage />} />

        {/* ── Open Preview Routes (accessible to all, styled in StudentLayout) ── */}
        <Route element={<StudentLayout />}>
          <Route path="/exit-exam"             element={<ExitExamPage />} />
          <Route path="/payment"               element={<PaymentPage />} />
        </Route>

        {/* ── Student Protected Routes ───────────────────────── */}
        <Route element={<ProtectedRoute requiredRole="student" />}>
          <Route element={<StudentLayout />}>
            <Route path="/dashboard"             element={<DashboardPage />} />
            <Route path="/courses"               element={<CoursesPage />} />
            <Route path="/courses/:courseId"     element={<CourseDetailPage />} />
            <Route path="/chapters/:chapterId"   element={<ChapterDetailPage />} />
            <Route path="/quizzes"               element={<QuizzesPage />} />
            <Route path="/mock-exams"            element={<MockExamsPage />} />
            <Route path="/past-exams"            element={<PastExamsPage />} />
            <Route path="/ai-study"              element={<AIStudyPage />} />
            <Route path="/progress"              element={<ProgressPage />} />
            <Route path="/bookmarks"             element={<BookmarksPage />} />
            <Route path="/profile"               element={<ProfilePage />} />
            <Route path="/feedback"              element={<StudentFeedbackPage />} />
            <Route path="/4th-year"              element={<FourthYearPage />} />
          </Route>
        </Route>

        {/* ── Admin ─────────────────────────────────────────── */}
        <Route element={<ProtectedRoute requiredRole="admin" />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin"               element={<AdminDashboardPage />} />
            <Route path="/admin/payments"      element={<AdminPaymentsPage />} />
            <Route path="/admin/courses"       element={<AdminCoursesPage />} />
            <Route path="/admin/chapters"      element={<AdminChaptersPage />} />
            <Route path="/admin/materials"     element={<AdminMaterialsPage />} />
            <Route path="/admin/past-exams"    element={<AdminPastExamsPage />} />
            <Route path="/admin/ai-review"     element={<AdminAIReviewPage />} />
            <Route path="/admin/students"      element={<AdminStudentsPage />} />
            <Route path="/admin/comments"      element={<AdminCommentsPage />} />
            <Route path="/admin/analytics"     element={<AdminAnalyticsPage />} />
            <Route path="/admin/questions"     element={<PlaceholderPage title="Manage Questions" description="View, edit, and manage the AI-generated question bank." />} />
            <Route path="/admin/settings"      element={<PlaceholderPage title="Settings" description="Platform configuration and academic year management." />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

import { ThemeProvider } from "@/contexts/ThemeContext";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}
