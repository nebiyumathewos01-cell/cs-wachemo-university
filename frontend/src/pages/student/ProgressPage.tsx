import { useEffect, useState } from "react";
import { TrendingUp, AlertCircle, BookOpen, CheckCircle2, XCircle, ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";
import { progressApi } from "@/api/progress";
import type { StudentProgress } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn, getScoreColor, formatScore } from "@/utils";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import { StatsSkeleton, CardSkeleton } from "@/components/common/Skeleton";
import EmptyState from "@/components/common/EmptyState";

export default function ProgressPage() {
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    progressApi
      .getMyProgress()
      .then(r => setProgress(r.data))
      .catch(() => setError("Failed to load progress data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-container space-y-6">
        <PageHeader title="My Progress" description="Track your academic performance and identify areas for improvement." icon={TrendingUp} />
        <StatsSkeleton count={3} />
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (error || !progress) {
    return (
      <div className="page-container space-y-6">
        <PageHeader title="My Progress" description="Track your academic performance and identify areas for improvement." icon={TrendingUp} />
        <div className="flex items-center gap-2 p-4 rounded-md bg-destructive-subtle text-destructive text-sm max-w-md">
          <AlertCircle className="h-4 w-4 shrink-0" />{error || "No progress data found."}
        </div>
      </div>
    );
  }

  const hasActivity = progress.total_quizzes > 0;

  return (
    <div className="page-container space-y-6">
      <PageHeader 
        title="My Progress" 
        description="Track your academic performance and identify areas for improvement." 
        icon={TrendingUp} 
      />

      {!hasActivity ? (
        <EmptyState
          icon={ClipboardList}
          title="No quiz activity yet"
          description="Take a quiz to start tracking your progress."
          action={{ label: "Go to Quizzes", onClick: () => window.location.href = '/quizzes' }}
        />
      ) : (
        <>
          {/* Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard 
              label="Total Quizzes" 
              value={progress.total_quizzes.toString()} 
              icon={ClipboardList} 
              bg="bg-primary-subtle" 
              color="text-primary" 
            />
            <StatCard 
              label="Mock Exams" 
              value={progress.total_mock_exams.toString()} 
              icon={BookOpen} 
              bg="bg-warning-subtle" 
              color="text-warning" 
            />
            <StatCard 
              label="Overall Average" 
              value={`${Math.round(progress.overall_average)}%`} 
              icon={TrendingUp} 
              bg="bg-success-subtle" 
              color={getScoreColor(progress.overall_average)} 
            />
          </div>

          {/* By Year */}
          <div className="space-y-8 mt-6">
            {progress.by_year.map(yearData => (
              <div key={yearData.year_name} className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">{yearData.year_name}</h2>
                <div className="grid gap-4">
                  {yearData.courses.map(course => (
                    <Card key={course.course_id}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <p className="font-semibold text-lg">{course.course_name}</p>
                          <span className={cn("text-xl font-bold", getScoreColor(course.average_score))}>
                            {formatScore(course.average_score)}
                          </span>
                        </div>
                        <Progress value={course.average_score} className="h-2.5 mb-4" />
                        <div className="flex flex-wrap items-center gap-6 text-sm">
                          <span className="text-muted-foreground font-medium">{course.quiz_attempts} attempt{course.quiz_attempts !== 1 ? "s" : ""}</span>
                          {course.strong_chapters.length > 0 && (
                            <span className="flex items-center gap-1.5 text-success">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="font-medium">Strong:</span> {course.strong_chapters.slice(0, 2).join(", ")}
                            </span>
                          )}
                          {course.weak_chapters.length > 0 && (
                            <span className="flex items-center gap-1.5 text-destructive">
                              <XCircle className="h-4 w-4" />
                              <span className="font-medium">Review:</span> {course.weak_chapters.slice(0, 2).join(", ")}
                            </span>
                          )}
                          
                          {course.weak_chapters.length > 0 && (
                            <Button asChild variant="link" size="sm" className="ml-auto text-primary h-auto p-0">
                              <Link to="/quizzes">Practice Now &rarr;</Link>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
