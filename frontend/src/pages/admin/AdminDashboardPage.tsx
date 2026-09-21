import { useEffect, useState } from "react";
import { adminApi } from "@/api/admin";
import {
  Users,
  BookOpen,
  FileUp,
  FileText,
  ClipboardList,
  TrendingUp,
  LayoutDashboard,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import { StatsSkeleton } from "@/components/common/Skeleton";

interface Analytics {
  total_students: number;
  total_courses: number;
  total_materials: number;
  total_past_exams: number;
  total_quiz_attempts: number;
}

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = () => {
    setLoading(true);
    setError("");
    adminApi
      .getAnalytics()
      .then((res) => setAnalytics(res.data))
      .catch(() => {
        setError("Failed to load analytics");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = analytics
    ? [
        { label: "Total Students", value: analytics.total_students, icon: Users, bg: "bg-primary-subtle", color: "text-primary" },
        { label: "Total Courses", value: analytics.total_courses, icon: BookOpen, bg: "bg-success-subtle", color: "text-success" },
        { label: "Total Materials", value: analytics.total_materials, icon: FileUp, bg: "bg-warning-subtle", color: "text-warning" },
        { label: "Past Exams", value: analytics.total_past_exams, icon: FileText, bg: "bg-info-subtle", color: "text-[hsl(var(--info))]" },
        { label: "Quiz Attempts", value: analytics.total_quiz_attempts, icon: ClipboardList, bg: "bg-destructive-subtle", color: "text-destructive" },
      ]
    : [];

  const quickActions = [
    { label: "Add Course", path: "/admin/courses", icon: BookOpen },
    { label: "Upload Material", path: "/admin/materials", icon: FileUp },
    { label: "Upload Past Exam", path: "/admin/past-exams", icon: FileText },
    { label: "Manage Students", path: "/admin/students", icon: Users },
    { label: "View Analytics", path: "/admin/analytics", icon: TrendingUp },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader 
        title="Admin Dashboard" 
        description="Computer Science Wachemo University" 
        icon={LayoutDashboard} 
      />

      {error && (
        <div className="callout-destructive flex items-center justify-between p-4 rounded-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadData}>Retry</Button>
        </div>
      )}

      {/* Stats */}
      {loading ? (
        <StatsSkeleton count={5} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map(({ label, value, icon, color, bg }) => (
             <StatCard 
               key={label} 
               label={label} 
               value={value} 
               icon={icon} 
               bg={bg} 
               color={color} 
             />
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {quickActions.map(({ label, path, icon: Icon }) => (
            <Button key={path} asChild variant="outline" className="h-auto flex-col gap-2 py-4">
              <Link to={path}>
                <Icon className="h-5 w-5" />
                <span className="text-xs">{label}</span>
              </Link>
            </Button>
          ))}
        </div>
      </div>

      {/* Sections overview */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Content Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Link to="/admin/courses" className="flex items-center justify-between p-2 rounded hover:bg-accent">
              <span>Manage Courses</span>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link to="/admin/chapters" className="flex items-center justify-between p-2 rounded hover:bg-accent">
              <span>Manage Chapters</span>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link to="/admin/materials" className="flex items-center justify-between p-2 rounded hover:bg-accent">
              <span>Manage Materials</span>
              <FileUp className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link to="/admin/past-exams" className="flex items-center justify-between p-2 rounded hover:bg-accent">
              <span>Manage Past Exams</span>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI & Students</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Link to="/admin/ai-review" className="flex items-center justify-between p-2 rounded hover:bg-accent">
              <span>AI Quiz Review</span>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link to="/admin/students" className="flex items-center justify-between p-2 rounded hover:bg-accent">
              <span>View Students</span>
              <Users className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link to="/admin/analytics" className="flex items-center justify-between p-2 rounded hover:bg-accent">
              <span>Analytics</span>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
