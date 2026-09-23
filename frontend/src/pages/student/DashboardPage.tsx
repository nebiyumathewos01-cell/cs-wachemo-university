import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { academicApi } from "@/api/academic";
import { progressApi } from "@/api/progress";
import {
  BookOpen, ClipboardList, FileText, TrendingUp,
  Brain, GraduationCap, ArrowRight, ChevronRight,
  Clock, Zap, PlayCircle, Code2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatsSkeleton } from "@/components/common/Skeleton";
import StatCard from "@/components/common/StatCard";
import type { AcademicYear, StudentProgress } from "@/types";
import { cn, getScoreColor } from "@/utils";

export default function DashboardPage() {
  const { user } = useAuth();
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      academicApi.getYears(),
      progressApi.getMyProgress().catch(() => null),
    ]).then(([yr, pr]) => {
      setYears(yr.data);
      setProgress(pr?.data ?? null);
    }).finally(() => setLoading(false));
  }, []);

  const selectedYear = years.find(y => y.id === user?.selected_year_id);
  const hasActivity = (progress?.total_quizzes ?? 0) > 0;
  
  let totalCourses = years.filter(y => y.is_available).length;
  if (progress && progress.by_year) {
    totalCourses = progress.by_year.reduce((acc, y) => acc + y.courses.length, 0);
  }

  const firstCourse = progress?.by_year?.[0]?.courses?.[0];

  const quickActions = [
    { label: "Exit Exam (MoE)",   icon: GraduationCap, path: "/exit-exam",  color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Coding Practice",  icon: Code2,         path: "/coding",     color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Browse Courses",    icon: BookOpen,      path: "/courses",    color: "text-blue-600",   bg: "bg-blue-50" },
    { label: "AI Quiz",           icon: ClipboardList, path: "/quizzes",    color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Past Exams",        icon: FileText,      path: "/past-exams", color: "text-emerald-600",bg: "bg-emerald-50" },
    { label: "AI Study Assistant",icon: Brain,         path: "/ai-study",   color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Mock Exam",         icon: Clock,         path: "/mock-exams", color: "text-rose-600",   bg: "bg-rose-50" },
    { label: "My Progress",       icon: TrendingUp,    path: "/progress",   color: "text-teal-600",   bg: "bg-teal-50" },
  ];

  return (
    <div className="max-w-5xl mx-auto pb-24 lg:pb-8 space-y-6">

      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-navy-900 text-white px-6 py-7">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle at 10% 50%, hsl(220 70% 55%) 0%, transparent 40%),
                            radial-gradient(circle at 90% 10%, hsl(220 60% 65%) 0%, transparent 35%)`,
        }} />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-white/60 text-sm mb-0.5">Welcome back,</p>
            <h1 className="text-2xl font-bold">{user?.full_name}</h1>
            <p className="text-white/80 text-sm mt-1">Continue your Computer Science learning journey.</p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {selectedYear ? (
                <Badge className="bg-white/15 text-white border-white/20 hover:bg-white/20 text-xs">
                  <GraduationCap className="h-3 w-3 mr-1" />{selectedYear.name}
                </Badge>
              ) : (
                <Badge className="bg-white/15 text-white border-white/20 text-xs">
                  <Clock className="h-3 w-3 mr-1" />Select your year
                </Badge>
              )}
              <Badge className="bg-white/15 text-white border-white/20 text-xs">
                Computer Science · Wachemo University
              </Badge>
            </div>
          </div>
          <div className="hidden sm:flex h-14 w-14 rounded-2xl bg-white/10 border border-white/15 items-center justify-center shrink-0">
            <Zap className="h-6 w-6 text-white/80" />
          </div>
        </div>
      </div>

      {/* Stats row */}
      {loading ? <StatsSkeleton /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Total Quizzes"
            value={progress?.total_quizzes ?? 0}
            icon={ClipboardList}
            color="text-primary"
            bg="bg-primary-subtle"
          />
          <StatCard
            label="Mock Exams"
            value={progress?.total_mock_exams ?? 0}
            icon={GraduationCap}
            color="text-warning"
            bg="bg-warning-subtle"
          />
          <StatCard
            label="Avg Score"
            value={`${Math.round(progress?.overall_average ?? 0)}%`}
            icon={TrendingUp}
            color={getScoreColor(progress?.overall_average ?? 0)}
            bg="bg-success-subtle"
          />
          <StatCard
            label="Courses"
            value={totalCourses}
            icon={BookOpen}
            color="text-primary"
            bg="bg-info-subtle"
          />
        </div>
      )}

      {/* Continue Learning */}
      <div>
        <h2 className="text-base font-semibold mb-3">Continue Learning</h2>
        {firstCourse ? (
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="h-10 w-10 rounded-lg bg-primary-subtle flex items-center justify-center shrink-0">
                  <PlayCircle className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm text-foreground truncate">{firstCourse.course_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={firstCourse.average_score} className="h-1.5 w-24" />
                    <span className={cn("text-xs font-medium", getScoreColor(firstCourse.average_score))}>
                      {Math.round(firstCourse.average_score)}% avg
                    </span>
                  </div>
                </div>
              </div>
              <Button asChild size="sm" variant="secondary" className="shrink-0 gap-1.5">
                <Link to={`/courses/${firstCourse.course_id}`}>
                  Continue <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <BookOpen className="h-5 w-5 text-foreground-muted" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground">Ready to start?</h3>
                  <p className="text-xs text-foreground-muted">Browse courses to start your first lesson.</p>
                </div>
              </div>
              <Button asChild size="sm" className="shrink-0">
                <Link to="/courses">Browse Courses</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">Quick Access</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {quickActions.map(({ label, icon: Icon, path, color, bg }) => (
            <Link key={path} to={path}>
              <Card className="group hover:shadow-md hover:border-border-strong transition-all cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center mb-3", bg)}>
                    <Icon className={cn("h-4.5 w-4.5", color)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{label}</p>
                    <ChevronRight className="h-3.5 w-3.5 text-foreground-subtle group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Academic years */}
      <div>
        <h2 className="text-base font-semibold mb-3">Academic Years</h2>
        <div className="flex flex-wrap gap-2">
          {years.map(year => (
            year.is_available ? (
              <Link key={year.id} to={`/courses?year=${year.id}`}>
                <button className={cn(
                  "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                  user?.selected_year_id === year.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border hover:border-primary/50 hover:text-primary"
                )}>
                  {year.name}
                </button>
              </Link>
            ) : (
              <button key={year.id} disabled
                className="px-4 py-2 rounded-lg border text-sm font-medium border-border text-foreground-subtle opacity-60 flex items-center gap-2 cursor-not-allowed">
                {year.name}
                <Badge variant="coming-soon" className="text-2xs">Soon</Badge>
              </button>
            )
          ))}
          <Link to="/exit-exam">
            <button className="px-4 py-2 rounded-lg border text-sm font-medium border-border text-foreground-subtle opacity-60 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />Exit Exam
              <Badge variant="coming-soon" className="text-2xs">Soon</Badge>
            </button>
          </Link>
        </div>
      </div>

      {/* Progress summary */}
      {hasActivity && progress && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">Performance Overview</h2>
            <Link to="/progress" className="text-xs text-primary hover:underline flex items-center gap-1">
              View details <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium">Overall Average</p>
                <span className={cn("text-lg font-bold", getScoreColor(progress.overall_average))}>
                  {Math.round(progress.overall_average)}%
                </span>
              </div>
              <Progress value={progress.overall_average} className="h-2 mb-4" />
              <div className="space-y-3">
                {progress.by_year.slice(0, 1).flatMap(yd =>
                  yd.courses.slice(0, 3).map(c => (
                    <div key={c.course_id} className="flex items-center gap-3">
                      <p className="text-xs text-foreground-muted truncate flex-1">{c.course_name}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-20">
                          <Progress value={c.average_score} className="h-1.5" />
                        </div>
                        <span className={cn("text-xs font-semibold w-8 text-right", getScoreColor(c.average_score))}>
                          {Math.round(c.average_score)}%
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
