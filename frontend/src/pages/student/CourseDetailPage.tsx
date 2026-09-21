import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, AlertCircle, ChevronRight, ClipboardList, CheckCircle2, Circle, BookOpen, Brain } from "lucide-react";
import { coursesApi, chaptersApi } from "@/api/academic";
import type { Course, Chapter } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EmptyState from "@/components/common/EmptyState";
import PageHeader from "@/components/common/PageHeader";
import { ChapterSkeleton } from "@/components/common/Skeleton";

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!courseId) return;
    const id = Number(courseId);
    Promise.all([coursesApi.getCourse(id), chaptersApi.getChapters(id)])
      .then(([cr, chr]) => { setCourse(cr.data); setChapters(chr.data); })
      .catch(() => setError("Failed to load course."))
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 pb-24 lg:pb-8">
        <ChapterSkeleton /><ChapterSkeleton /><ChapterSkeleton />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-3" />
        <p className="font-medium text-sm">{error || "Course not found."}</p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link to="/courses"><ArrowLeft className="h-3.5 w-3.5 mr-1.5" />Back to Courses</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-24 lg:pb-8 space-y-6">
      <PageHeader
        title={course.name}
        backTo={{ label: 'Back to Courses', path: '/courses' }}
      />

      {/* Course header */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            {course.code && (
              <p className="text-xs font-semibold text-primary mb-1">{course.code}</p>
            )}
            <h1 className="text-xl font-bold text-foreground">{course.name}</h1>
            {course.description && (
              <div className="mt-3 callout-info rounded-lg p-3 text-sm">
                {course.description}
              </div>
            )}
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <Badge variant="subtle">{chapters.length} chapters</Badge>
              <Button asChild size="sm" variant="default" className="gap-1.5">
                <Link to={`/quizzes?course=${course.id}`}>
                  <ClipboardList className="h-3.5 w-3.5" />Generate Quiz
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                <Link to={`/ai-study?course=${course.id}`}>
                  <Brain className="h-3.5 w-3.5" />AI Study
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Chapter list */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-foreground-subtle mb-3">Chapters</h2>
        {chapters.length === 0 ? (
          <EmptyState icon={BookOpen} title="No chapters yet"
            description="Chapters will appear here once added by your instructor." />
        ) : (
          <div className="space-y-2">
            {chapters.map((ch) => {
              const hasMaterial = (ch.material_count ?? 0) > 0;
              return (
                <Link key={ch.id} to={`/chapters/${ch.id}`}>
                  <Card className="group hover:shadow-md hover:border-primary/30 transition-all cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                          {ch.number}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground">{ch.title}</p>
                          {ch.description && (
                            <p className="text-xs text-foreground-muted mt-0.5 line-clamp-1">{ch.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            {hasMaterial ? (
                              <CheckCircle2 className="h-3 w-3 text-success" />
                            ) : (
                              <Circle className="h-3 w-3 text-muted-foreground" />
                            )}
                            <p className="text-xs text-foreground-subtle flex items-center gap-1">
                              {ch.material_count} material{(ch.material_count ?? 0) !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-foreground-subtle group-hover:text-primary transition-colors shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
