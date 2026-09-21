import { useEffect, useRef, useState, useMemo } from "react";
import { Upload, Trash2, FileText, AlertCircle, Download, Search } from "lucide-react";
import { academicApi, coursesApi, pastExamsApi } from "@/api/academic";
import type { AcademicYear, Semester, Course, PastExam } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatFileSize, formatDate } from "@/utils";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import { ExamCardSkeleton } from "@/components/common/Skeleton";
import { useToast } from "@/hooks/useToast";

const EXAM_TYPES = ["Final", "Midterm", "Makeup", "Quiz", "Assignment"];

export default function AdminPastExamsPage() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<PastExam[]>([]);
  const [total, setTotal] = useState(0);
  const [filterYear, setFilterYear] = useState("all");
  const [filterSem, setFilterSem] = useState("all");
  const [filterCourse, setFilterCourse] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PastExam | null>(null);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Form
  const [fTitle, setFTitle] = useState("");
  const [fCourseId, setFCourseId] = useState("");
  const [fYearId, setFYearId] = useState("");
  const [fSemId, setFSemId] = useState("");
  const [fExamYear, setFExamYear] = useState(String(new Date().getFullYear()));
  const [fExamType, setFExamType] = useState("Final");
  const [fDesc, setFDesc] = useState("");
  const [fFile, setFFile] = useState<File | null>(null);
  const [formError, setFormError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    academicApi.getYears().then(r => setYears(r.data));
    loadExams();
  }, []);

  const loadExams = async (yId?: number, sId?: number, cId?: number) => {
    setLoading(true);
    try {
      const params: Record<string, number> = {};
      if (yId) params.academic_year_id = yId;
      if (sId) params.semester_id = sId;
      if (cId) params.course_id = cId;
      const r = await pastExamsApi.getPastExams({ ...params, per_page: 50 });
      setExams(r.data.items); setTotal(r.data.total);
    } finally { setLoading(false); }
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

  const openUpload = () => {
    setFTitle(""); setFDesc(""); setFFile(null); setFormError("");
    setFYearId(filterYear !== "all" ? filterYear : "");
    setFSemId(filterSem !== "all" ? filterSem : "");
    setFCourseId(filterCourse !== "all" ? filterCourse : "");
    setFExamYear(String(new Date().getFullYear()));
    setFExamType("Final");
    setUploadOpen(true);
  };

  const handleUpload = async () => {
    if (!fTitle.trim() || !fCourseId || !fYearId || !fSemId || !fFile) {
      setFormError("All fields except description are required."); return;
    }
    setSaving(true); setFormError("");
    try {
      const fd = new FormData();
      fd.append("title", fTitle.trim());
      fd.append("course_id", fCourseId);
      fd.append("academic_year_id", fYearId);
      fd.append("semester_id", fSemId);
      fd.append("exam_year", fExamYear);
      fd.append("exam_type", fExamType);
      fd.append("description", fDesc);
      fd.append("file", fFile);
      await pastExamsApi.uploadPastExam(fd);
      setUploadOpen(false);
      const yId = filterYear === "all" ? undefined : Number(filterYear);
      const sId = filterSem === "all" ? undefined : Number(filterSem);
      const cId = filterCourse === "all" ? undefined : Number(filterCourse);
      loadExams(yId, sId, cId);
    } catch { setFormError("Upload failed. Please check the file and try again."); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await pastExamsApi.deletePastExam(deleteTarget.id);
      setDeleteTarget(null);
      const yId = filterYear === "all" ? undefined : Number(filterYear);
      loadExams(yId);
    } catch { setError("Delete failed."); }
    finally { setSaving(false); }
  };

  const handleDownload = async (id: number, title: string, originalFilename?: string) => {
    setDownloading(id);
    try {
      const ext = originalFilename?.split(".").pop() || "pdf";
      const response = await pastExamsApi.downloadPastExam(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${title}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast({
        title: "Download Failed",
        description: "Could not download the exam file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloading(null);
    }
  };

  const getExamTypeBadgeColor = (type: string) => {
    if (type === "Final") return "bg-destructive-subtle text-destructive";
    if (type === "Midterm") return "bg-warning-subtle text-warning";
    return "bg-secondary text-secondary-foreground";
  };

  const filteredExams = useMemo(() => {
    if (!searchQuery) return exams;
    return exams.filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [exams, searchQuery]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader 
        title="Manage Past Exams" 
        badge={<Badge variant="secondary">{total} Total</Badge>}
        action={<Button onClick={openUpload} className="gap-2"><Upload className="h-4 w-4" />Upload Past Exam</Button>} 
      />

      {error && <div className="callout-destructive flex items-center gap-2 p-3 rounded-md text-sm"><AlertCircle className="h-4 w-4" />{error}</div>}

      {/* Filters & Search */}
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <div className="flex flex-wrap gap-3">
          <div className="w-44">
            <Select value={filterYear} onValueChange={onYearChange}>
              <SelectTrigger><SelectValue placeholder="All Years" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.filter(y => y.is_available).map(y => <SelectItem key={y.id} value={String(y.id)}>{y.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {filterYear !== "all" && semesters.length > 0 && (
            <div className="w-44">
              <Select value={filterSem} onValueChange={onSemChange}>
                <SelectTrigger><SelectValue placeholder="All Semesters" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {semesters.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
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
                  {courses.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            className="pl-9" 
            placeholder="Search exams..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Exams list */}
      {loading ? (
        <div className="grid gap-2"><ExamCardSkeleton count={3} /></div>
      ) : filteredExams.length === 0 ? (
        <EmptyState 
          icon={FileText} 
          title="No past exams found" 
          description={exams.length === 0 ? "Click 'Upload Past Exam' to add the first exam paper." : "Try adjusting your search query."} 
        />
      ) : (
        <div className="space-y-2">
          {filteredExams.map(exam => (
            <Card key={exam.id}><CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-info-subtle border border-info-subtle flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-[hsl(var(--info))]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{exam.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getExamTypeBadgeColor(exam.exam_type)}`}>{exam.exam_type}</span>
                    <Badge variant="secondary" className="text-xs">{exam.exam_year}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{formatFileSize(exam.file_size)}</span>
                    <span>·</span><span>{formatDate(exam.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-primary hover:text-primary hover:bg-primary-subtle shrink-0"
                    onClick={() => handleDownload(exam.id, exam.title, exam.original_filename)} 
                    aria-label="Download"
                    disabled={downloading === exam.id}
                  >
                    <Download className={`h-4 w-4 ${downloading === exam.id ? 'animate-bounce' : ''}`} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive-subtle shrink-0"
                    onClick={() => setDeleteTarget(exam)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Upload Past Exam</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <div className="space-y-1.5">
              <Label htmlFor="ex-title">Title *</Label>
              <Input id="ex-title" value={fTitle} onChange={e => setFTitle(e.target.value)} placeholder="e.g. Data Structures Final Exam 2024" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Academic Year *</Label>
                <Select value={fYearId} onValueChange={async v => {
                  setFYearId(v); setFSemId(""); setFCourseId("");
                  if (v) { const [s, c] = await Promise.all([academicApi.getSemesters(Number(v)), coursesApi.getCourses({ academic_year_id: Number(v), per_page: 100 } as Parameters<typeof coursesApi.getCourses>[0])]); setSemesters(s.data); setCourses(c.data.items); }
                }}>
                  <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                  <SelectContent>{years.filter(y => y.is_available).map(y => <SelectItem key={y.id} value={String(y.id)}>{y.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Semester *</Label>
                <Select value={fSemId} onValueChange={setFSemId} disabled={!fYearId}>
                  <SelectTrigger><SelectValue placeholder="Select semester" /></SelectTrigger>
                  <SelectContent>{semesters.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Course *</Label>
              <Select value={fCourseId} onValueChange={setFCourseId} disabled={!fSemId}>
                <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>{courses.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Exam Year *</Label>
                <Input type="number" value={fExamYear} onChange={e => setFExamYear(e.target.value)} min={2000} max={2100} />
              </div>
              <div className="space-y-1.5">
                <Label>Exam Type *</Label>
                <Select value={fExamType} onValueChange={setFExamType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{EXAM_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>File * (PDF, DOC — max 50MB)</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => fileRef.current?.click()}>
                {fFile ? <div className="text-sm"><p className="font-medium">{fFile.name}</p><p className="text-xs text-muted-foreground">{formatFileSize(fFile.size)}</p></div>
                  : <div className="text-muted-foreground text-sm"><Upload className="h-6 w-6 mx-auto mb-1.5 opacity-50" /><p>Click to choose file</p></div>}
              </div>
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => setFFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
            <Button onClick={handleUpload} disabled={saving}>
              {saving ? "Uploading…" : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Delete Past Exam</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Delete <strong>{deleteTarget?.title}</strong>? This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
