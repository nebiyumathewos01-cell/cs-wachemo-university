import { useEffect, useRef, useState } from "react";
import { Upload, Trash2, FileText, AlertCircle, Download } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { academicApi, coursesApi, chaptersApi, materialsApi } from "@/api/academic";
import type { AcademicYear, Semester, Course, Chapter, Material } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatFileSize, formatDate } from "@/utils";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import { CardSkeleton } from "@/components/common/Skeleton";
import { useToast } from "@/hooks/useToast";

export default function AdminMaterialsPage() {
  const [searchParams] = useSearchParams();
  const urlChapterId = searchParams.get("chapterId");
  
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  
  const [filterYear, setFilterYear] = useState("all");
  const [filterSem, setFilterSem] = useState("all");
  const [filterCourse, setFilterCourse] = useState("all");
  const [filterChapter, setFilterChapter] = useState(urlChapterId || "all");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Material | null>(null);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState<number | null>(null);
  
  const [upTitle, setUpTitle] = useState("");
  const [upDesc, setUpDesc] = useState("");
  const [upChapterId, setUpChapterId] = useState("");
  const [upFile, setUpFile] = useState<File | null>(null);
  const [formError, setFormError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => { 
    academicApi.getYears().then((r) => setYears(r.data)); 
    // If URL has chapterId, we ideally should backfill course, sem, year but for simplicity we just load materials for that chapter ID.
    if (urlChapterId) {
      loadMaterials(Number(urlChapterId));
    }
  }, [urlChapterId]);

  const loadMaterials = async (chId: number) => {
    setLoading(true);
    try { const r = await materialsApi.getMaterialsByChapter(chId); setMaterials(r.data); }
    finally { setLoading(false); }
  };

  const onYearChange = async (v: string) => {
    setFilterYear(v); setFilterSem("all"); setFilterCourse("all"); setFilterChapter("all"); setMaterials([]);
    if (v === "all") { setSemesters([]); setCourses([]); setChapters([]); return; }
    const [s, c] = await Promise.all([
      academicApi.getSemesters(Number(v)),
      coursesApi.getCourses({ academic_year_id: Number(v), per_page: 100 } as Parameters<typeof coursesApi.getCourses>[0]),
    ]);
    setSemesters(s.data); setCourses(c.data.items); setChapters([]);
  };

  const onSemChange = async (v: string) => {
    setFilterSem(v); setFilterCourse("all"); setFilterChapter("all"); setMaterials([]);
    if (v === "all") return;
    const r = await coursesApi.getCourses({ academic_year_id: Number(filterYear), semester_id: Number(v), per_page: 100 } as Parameters<typeof coursesApi.getCourses>[0]);
    setCourses(r.data.items); setChapters([]);
  };

  const onCourseChange = async (v: string) => {
    setFilterCourse(v); setFilterChapter("all"); setMaterials([]);
    if (v === "all") { setChapters([]); return; }
    const r = await chaptersApi.getChapters(Number(v));
    setChapters(r.data);
  };

  const onChapterChange = (v: string) => {
    setFilterChapter(v);
    if (v !== "all") loadMaterials(Number(v));
    else setMaterials([]);
  };

  const openUpload = () => {
    setUpTitle(""); setUpDesc(""); setUpFile(null); setFormError("");
    setUpChapterId(filterChapter !== "all" ? filterChapter : "");
    setUploadOpen(true);
  };

  const handleUpload = async () => {
    if (!upTitle.trim() || !upChapterId || !upFile) { setFormError("Title, chapter, and file are required."); return; }
    setSaving(true); setFormError("");
    try {
      const fd = new FormData();
      fd.append("title", upTitle.trim());
      fd.append("description", upDesc);
      fd.append("chapter_id", upChapterId);
      fd.append("file", upFile);
      await materialsApi.uploadMaterial(fd);
      setUploadOpen(false);
      if (filterChapter !== "all") loadMaterials(Number(filterChapter));
    } catch { setFormError("Upload failed. Check file type (PDF/DOC/TXT) and size (max 50MB)."); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try { await materialsApi.deleteMaterial(deleteTarget.id); setDeleteTarget(null); if (filterChapter !== "all") loadMaterials(Number(filterChapter)); }
    catch { setError("Delete failed."); }
    finally { setSaving(false); }
  };

  const handleDownload = async (id: number, title: string, ext: string) => {
    setDownloading(id);
    try {
      const response = await materialsApi.downloadMaterial(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${title}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      toast({ title: "Download failed", description: "Could not download the material.", variant: "destructive" });
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader 
        title="Manage Materials" 
        action={<Button onClick={openUpload} className="gap-2"><Upload className="h-4 w-4" />Upload Material</Button>} 
      />

      {error && <div className="callout-destructive flex items-center gap-2 p-3 rounded-md text-sm"><AlertCircle className="h-4 w-4" />{error}</div>}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {[
          { value: filterYear, onChange: onYearChange, placeholder: "All Years", items: years.filter(y => y.is_available).map(y => ({ value: String(y.id), label: y.name })) },
          { value: filterSem, onChange: onSemChange, placeholder: "All Semesters", items: semesters.map(s => ({ value: String(s.id), label: s.name })), hidden: filterYear === "all" },
          { value: filterCourse, onChange: onCourseChange, placeholder: "Select Course", items: courses.map(c => ({ value: String(c.id), label: c.name })), hidden: courses.length === 0 },
          { value: filterChapter, onChange: onChapterChange, placeholder: "Select Chapter", items: chapters.map(c => ({ value: String(c.id), label: `Ch.${c.number} ${c.title}` })), hidden: chapters.length === 0 },
        ].filter(f => !f.hidden).map((f, i) => (
          <div key={i} className="w-52">
            <Select value={f.value} onValueChange={f.onChange}>
              <SelectTrigger><SelectValue placeholder={f.placeholder} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{f.placeholder}</SelectItem>
                {f.items.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      {/* Materials list */}
      {filterChapter === "all" ? (
        <EmptyState 
          icon={FileText} 
          title="Select a chapter above" 
          description="Filter to a chapter to see its materials." 
        />
      ) : loading ? (
        <div className="grid gap-2">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : materials.length === 0 ? (
        <EmptyState 
          icon={FileText} 
          title="No materials yet" 
          description="Click 'Upload Material' to add the first material." 
        />
      ) : (
        <div className="space-y-2">
          {materials.map(mat => (
            <Card key={mat.id}><CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-destructive-subtle flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{mat.title}</p>
                  {mat.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{mat.description}</p>}
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                    <span className="uppercase font-medium">{mat.file_type}</span>
                    <span>·</span><span>{formatFileSize(mat.file_size)}</span>
                    <span>·</span><span>{formatDate(mat.created_at)}</span>
                    {mat.has_extracted_text && <span className="text-success font-medium">· AI-ready</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-primary hover:text-primary hover:bg-primary-subtle shrink-0"
                    onClick={() => handleDownload(mat.id, mat.title, mat.file_type)} 
                    aria-label="Download"
                    disabled={downloading === mat.id}
                  >
                    <Download className={`h-4 w-4 ${downloading === mat.id ? 'animate-bounce' : ''}`} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive-subtle shrink-0"
                    onClick={() => setDeleteTarget(mat)} aria-label="Delete">
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Upload Study Material</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <div className="space-y-1.5">
              <Label>Chapter *</Label>
              <Select value={upChapterId} onValueChange={setUpChapterId}>
                <SelectTrigger><SelectValue placeholder="Select chapter" /></SelectTrigger>
                <SelectContent>
                  {chapters.map(c => <SelectItem key={c.id} value={String(c.id)}>Ch.{c.number} – {c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mat-title">Title *</Label>
              <Input id="mat-title" value={upTitle} onChange={e => setUpTitle(e.target.value)} placeholder="e.g. Lecture Notes Week 1" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mat-desc">Description</Label>
              <Textarea id="mat-desc" value={upDesc} onChange={e => setUpDesc(e.target.value)} rows={2} placeholder="Optional description" />
            </div>
            <div className="space-y-1.5">
              <Label>File * (PDF, DOC, DOCX, TXT — max 50MB)</Label>
              <div
                className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                {upFile ? (
                  <div className="text-sm"><p className="font-medium">{upFile.name}</p><p className="text-muted-foreground text-xs mt-0.5">{formatFileSize(upFile.size)}</p></div>
                ) : (
                  <div className="text-muted-foreground text-sm"><Upload className="h-6 w-6 mx-auto mb-1.5 opacity-50" /><p>Click to choose file</p></div>
                )}
              </div>
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden"
                onChange={e => setUpFile(e.target.files?.[0] ?? null)} />
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
          <DialogHeader><DialogTitle>Delete Material</DialogTitle></DialogHeader>
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
