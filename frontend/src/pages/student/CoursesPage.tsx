import { useEffect, useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { BookOpen, ChevronRight, AlertCircle, Clock, Search, X } from "lucide-react";
import { academicApi, coursesApi } from "@/api/academic";
import type { AcademicYear, Semester, Course } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/common/EmptyState";
import PageHeader from "@/components/common/PageHeader";
import { CardSkeleton } from "@/components/common/Skeleton";
import { cn } from "@/utils";

export default function CoursesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selYearId, setSelYearId] = useState<number | null>(
    searchParams.get("year") ? Number(searchParams.get("year")) : null
  );
  const [selSemId, setSelSemId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    academicApi.getYears().then(r => setYears(r.data)).catch(() => setError("Failed to load years."));
  }, []);

  useEffect(() => {
    if (!selYearId) { setSemesters([]); setCourses([]); return; }
    const yr = years.find(y => y.id === selYearId);
    if (yr && !yr.is_available) { setSemesters([]); setCourses([]); return; }
    setLoading(true);
    academicApi.getSemesters(selYearId)
      .then(r => { setSemesters(r.data); setSelSemId(null); setCourses([]); })
      .catch(() => setError("Failed to load semesters."))
      .finally(() => setLoading(false));
  }, [selYearId, years]);

  useEffect(() => {
    if (!selYearId || !selSemId) { setCourses([]); return; }
    setLoading(true);
    coursesApi.getCourses({ academic_year_id: selYearId, semester_id: selSemId })
      .then(r => setCourses(r.data.items))
      .catch(() => setError("Failed to load courses."))
      .finally(() => setLoading(false));
  }, [selSemId, selYearId]);

  const selYear = years.find(y => y.id === selYearId);

  const selectYear = (y: AcademicYear) => {
    if (!y.is_available) return;
    setSelYearId(y.id);
    setSearchParams({ year: String(y.id) });
  };
  
  const handleReset = () => {
    setSelYearId(null);
    setSelSemId(null);
    setSearchQuery("");
    setSearchParams({});
  };

  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return courses;
    const lowerQuery = searchQuery.toLowerCase();
    return courses.filter(c => 
      c.name.toLowerCase().includes(lowerQuery) || 
      (c.code && c.code.toLowerCase().includes(lowerQuery))
    );
  }, [courses, searchQuery]);

  return (
    <div className="max-w-4xl mx-auto pb-24 lg:pb-8 space-y-6">
      <PageHeader 
        title="Courses" 
        description="Select your year, semester, and course to start learning." 
        icon={BookOpen} 
      />

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive-subtle border border-destructive/20 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      {/* Step 1 — Year */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-foreground-subtle">Academic Year</p>
          {(selYearId || selSemId) && (
             <Button variant="ghost" size="xs" onClick={handleReset} className="h-6 text-xs text-foreground-subtle hover:text-foreground">
               Reset filters
             </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {years.map(yr => (
            <button
              key={yr.id}
              onClick={() => selectYear(yr)}
              disabled={!yr.is_available}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                !yr.is_available && "opacity-50 cursor-not-allowed",
                selYearId === yr.id
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card border-border hover:border-primary/50 hover:text-primary"
              )}
            >
              {yr.name}
              {!yr.is_available && <Badge variant="coming-soon" className="text-2xs"><Clock className="h-2.5 w-2.5 mr-0.5" />Soon</Badge>}
            </button>
          ))}
        </div>
      </div>

      {/* Coming soon */}
      {selYear && !selYear.is_available && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="py-12 text-center">
            <div className="h-12 w-12 rounded-2xl bg-orange-100 border border-orange-200 flex items-center justify-center mx-auto mb-4">
              <Clock className="h-6 w-6 text-orange-500" />
            </div>
            <h3 className="font-semibold text-orange-800">{selYear.name} — Coming Soon</h3>
            <p className="text-sm text-orange-700 mt-2 max-w-sm mx-auto">
              {selYear.name} Computer Science courses will be available soon.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Step 2 — Semester */}
      {selYear?.is_available && semesters.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-foreground-subtle mb-3">Semester</p>
          <div className="flex flex-wrap gap-2">
            {semesters.map(s => (
              <button key={s.id} onClick={() => setSelSemId(s.id)}
                className={cn(
                  "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                  selSemId === s.id
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card border-border hover:border-primary/50 hover:text-primary"
                )}>
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3 — Search */}
      {selSemId && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-subtle" />
          <input
            type="text"
            placeholder="Search courses by name or code..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-10 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-subtle hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {loading && (
        <div className="grid sm:grid-cols-2 gap-3 pt-2">
          <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      )}

      {/* Courses grid */}
      {selSemId && !loading && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-foreground-subtle mb-3">
            {filteredCourses.length} Course{filteredCourses.length !== 1 ? "s" : ""}
          </p>
          {filteredCourses.length === 0 ? (
            <EmptyState icon={BookOpen} title={searchQuery ? "No courses found" : "No courses yet"}
              description={searchQuery ? "Try adjusting your search query." : "Courses will appear here once added by your instructor."} />
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {filteredCourses.map(c => (
                <Link key={c.id} to={`/courses/${c.id}`}>
                  <Card className="group hover:shadow-md hover:border-primary/30 transition-all cursor-pointer h-full">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          {c.code && <p className="text-xs font-semibold text-primary mb-1">{c.code}</p>}
                          <h3 className="font-semibold text-sm text-foreground leading-snug">{c.name}</h3>
                        </div>
                        <ChevronRight className="h-4 w-4 text-foreground-subtle shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                      </div>
                      {c.description && (
                        <p className="text-xs text-foreground-muted line-clamp-2 mb-3">{c.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-foreground-subtle">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {c.chapter_count ?? 0} chapters
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
