import { useEffect, useState } from "react";
import { FileText, Download, Search, AlertCircle } from "lucide-react";
import { academicApi, coursesApi, pastExamsApi } from "@/api/academic";
import type { AcademicYear, Semester, Course, PastExam } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatFileSize, formatDate } from "@/utils";
import PageHeader from "@/components/common/PageHeader";
import { ExamCardSkeleton } from "@/components/common/Skeleton";
import EmptyState from "@/components/common/EmptyState";
import { useToast } from "@/hooks/useToast";

export default function PastExamsPage() {
  const { toast } = useToast();
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<PastExam[]>([]);
  const [total, setTotal] = useState(0);
  const [filterYear, setFilterYear] = useState("all");
  const [filterSem, setFilterSem] = useState("all");
  const [filterCourse, setFilterCourse] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState<number | null>(null);

  useEffect(() => {
    academicApi.getYears().then(r => setYears(r.data));
    loadExams();
  }, []);

  const loadExams = async (yId?: number, sId?: number, cId?: number) => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, number> = {};
      if (yId) params.academic_year_id = yId;
      if (sId) params.semester_id = sId;
      if (cId) params.course_id = cId;
      const r = await pastExamsApi.getPastExams({ ...params, per_page: 50 });
      setExams(r.data.items);
      setTotal(r.data.total);
    } catch { setError("Failed to load past exams. Please try again."); }
    finally { setLoading(false); }
  };

  const onYearChange = async (v: string) => {
    setFilterYear(v); setFilterSem("all"); setFilterCourse("all");
    const yId = v === "all" ? undefined : Number(v);
    if (yId) {
      const [s, c] = await Promise.all([
        academicApi.getSemesters(yId),
        coursesApi.getCourses({ academic_year_id: yId, per_page: 100 } as Parameters<typeof coursesApi.getCourses>[0]),
      ]);
      setSemesters(s.data); setCourses(c.data.items);
    } else { setSemesters([]); setCourses([]); }
    loadExams(yId);
  };

  const onSemChange = async (v: string) => {
    setFilterSem(v); setFilterCourse("all");
    const yId = filterYear === "all" ? undefined : Number(filterYear);
    const sId = v === "all" ? undefined : Number(v);
    if (sId) {
      const r = await coursesApi.getCourses({ academic_year_id: yId, semester_id: sId, per_page: 100 } as Parameters<typeof coursesApi.getCourses>[0]);
      setCourses(r.data.items);
    }
    loadExams(yId, sId);
  };

  const onCourseChange = (v: string) => {
    setFilterCourse(v);
    const yId = filterYear === "all" ? undefined : Number(filterYear);
    const sId = filterSem === "all" ? undefined : Number(filterSem);
    loadExams(yId, sId, v === "all" ? undefined : Number(v));
  };

  const handleClearFilters = () => {
    setFilterYear("all");
    setFilterSem("all");
    setFilterCourse("all");
    setSearch("");
    setSemesters([]);
    setCourses([]);
    loadExams();
  };

  const handleDownload = async (exam: PastExam) => {
    setDownloading(exam.id);
    try {
      const res = await pastExamsApi.downloadPastExam(exam.id);
      const url = URL.createObjectURL(new Blob([res.data as BlobPart]));
      const a = document.createElement("a");
      a.href = url; a.download = exam.original_filename; a.click();
      URL.revokeObjectURL(url);
    } catch { 
      toast({ title: "Download Failed", description: "Could not download the exam. Please try again.", variant: "destructive" });
    }
    finally { setDownloading(null); }
  };

  const filtered = exams.filter(e =>
    !search || e.title.toLowerCase().includes(search.toLowerCase())
  );

  const getExamTypeVariant = (t: string) => {
    if (t === "Final") return "destructive";
    if (t === "Midterm") return "warning";
    if (t === "Makeup") return "secondary";
    return "outline";
  };

  const isFiltering = filterYear !== "all" || filterSem !== "all" || filterCourse !== "all" || search !== "";

  return (
    <div className="page-container space-y-6">
      <PageHeader
        title="Past Examination Library"
        description="Browse and download past university exam papers."
        icon={FileText}
      />

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-destructive-subtle text-destructive text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search exam titles…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="w-44">
              <Select value={filterYear} onValueChange={onYearChange}>
                <SelectTrigger><SelectValue placeholder="All Years" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {years.filter(y => y.is_available).map(y => (
                    <SelectItem key={y.id} value={String(y.id)}>{y.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {filterYear !== "all" && semesters.length > 0 && (
              <div className="w-44">
                <Select value={filterSem} onValueChange={onSemChange}>
                  <SelectTrigger><SelectValue placeholder="All Semesters" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Semesters</SelectItem>
                    {semesters.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {courses.length > 0 && (
              <div className="w-52">
                <Select value={filterCourse} onValueChange={onCourseChange}>
                  <SelectTrigger><SelectValue placeholder="All Courses" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {courses.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {isFiltering && (
              <Button variant="ghost" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="space-y-3 mt-4">
          <ExamCardSkeleton />
          <ExamCardSkeleton />
          <ExamCardSkeleton />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No past exams found"
          description={exams.length === 0 ? "No exam papers have been uploaded yet. Check back later." : "No results match your search or filters."}
          action={isFiltering ? { label: "Clear Filters", onClick: handleClearFilters } : undefined}
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Showing {filtered.length} of {total} exam{total !== 1 ? "s" : ""}
          </p>
          <div className="space-y-3">
            {filtered.map(exam => (
              <Card key={exam.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-xl bg-primary-subtle border border-primary/20 flex flex-col items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="text-[10px] text-primary font-bold mt-0.5">{exam.exam_year}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{exam.title}</p>
                        <Badge variant={getExamTypeVariant(exam.exam_type) as any}>{exam.exam_type}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 mb-1">
                        {(exam as any).course ? (exam as any).course.name : `Course ID: ${exam.course_id}`}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{exam.exam_year}</span>
                        <span>·</span>
                        <span>{formatFileSize(exam.file_size)}</span>
                        <span>·</span>
                        <span>{formatDate(exam.created_at)}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 gap-1.5"
                      onClick={() => handleDownload(exam)}
                      disabled={downloading === exam.id}
                      aria-label="Download exam"
                    >
                      {downloading === exam.id
                        ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        : <Download className="h-3.5 w-3.5" />}
                      <span className="hidden sm:inline">Download</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
