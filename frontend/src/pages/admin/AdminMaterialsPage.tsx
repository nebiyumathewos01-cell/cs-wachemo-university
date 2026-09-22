import { useEffect, useRef, useState } from "react";
import {
  Upload,
  Trash2,
  FileText,
  AlertCircle,
  Download,
  Sparkles,
  CheckCircle2,
  X,
  FileUp,
  Loader2,
  Check,
  Layers,
  GraduationCap
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { academicApi, coursesApi, chaptersApi, materialsApi } from "@/api/academic";
import type { AcademicYear, Semester, Course, Chapter, Material, AIAnalyzedMaterial, AIConfirmMaterialItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  
  // Manual Upload Form States
  const [upTitle, setUpTitle] = useState("");
  const [upDesc, setUpDesc] = useState("");
  const [upChapterId, setUpChapterId] = useState("");
  const [upFile, setUpFile] = useState<File | null>(null);
  const [formError, setFormError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  
  // AI Auto-Organizer States (Step-by-Step)
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiStage, setAiStage] = useState<"setup_and_upload" | "analyzing" | "review" | "saving">("setup_and_upload");
  const [aiYearId, setAiYearId] = useState<string>("all");
  const [aiSemId, setAiSemId] = useState<string>("all");
  const [aiSemestersList, setAiSemestersList] = useState<Semester[]>([]);
  const [aiFiles, setAiFiles] = useState<File[]>([]);
  const [aiAnalyzedItems, setAiAnalyzedItems] = useState<AIAnalyzedMaterial[]>([]);
  const [aiEditedItems, setAiEditedItems] = useState<AIConfirmMaterialItem[]>([]);
  const [aiProgressText, setAiProgressText] = useState("");
  const aiInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  useEffect(() => { 
    academicApi.getYears().then((r) => setYears(r.data)); 
    if (urlChapterId) {
      loadMaterials(Number(urlChapterId));
    }
  }, [urlChapterId]);

  const loadMaterials = async (chId: number) => {
    setLoading(true);
    try { 
      const r = await materialsApi.getMaterialsByChapter(chId); 
      setMaterials(r.data); 
    } finally { 
      setLoading(false); 
    }
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

  // ─── Manual Upload Handler ──────────────────────────────────
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
      toast({ title: "Material Uploaded", description: `Uploaded "${upTitle.trim()}" successfully.` });
      if (filterChapter !== "all") loadMaterials(Number(filterChapter));
    } catch { 
      setFormError("Upload failed. Check file type (PDF/PPT/DOC/TXT) and size (max 50MB)."); 
    } finally { 
      setSaving(false); 
    }
  };

  // ─── AI Auto-Organizer Handlers (Guided Flow) ───────────────
  const openAiOrganizer = () => {
    // Default to currently selected year/semester if active
    const initialYear = filterYear !== "all" ? filterYear : (years[0]?.id ? String(years[0].id) : "all");
    setAiYearId(initialYear);
    setAiSemId(filterSem !== "all" ? filterSem : "all");
    
    if (initialYear !== "all") {
      academicApi.getSemesters(Number(initialYear)).then(res => setAiSemestersList(res.data));
    } else {
      setAiSemestersList([]);
    }

    setAiFiles([]);
    setAiAnalyzedItems([]);
    setAiEditedItems([]);
    setAiStage("setup_and_upload");
    setAiModalOpen(true);
  };

  const onAiYearSelect = async (yearId: string) => {
    setAiYearId(yearId);
    setAiSemId("all");
    if (yearId !== "all") {
      const res = await academicApi.getSemesters(Number(yearId));
      setAiSemestersList(res.data);
      if (res.data.length > 0) {
        setAiSemId(String(res.data[0].id));
      }
    } else {
      setAiSemestersList([]);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const dropped = Array.from(e.dataTransfer.files);
      setAiFiles(prev => [...prev, ...dropped]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      setAiFiles(prev => [...prev, ...selected]);
    }
  };

  const removeAiFile = (index: number) => {
    setAiFiles(prev => prev.filter((_, i) => i !== index));
  };

  const startAiAnalysis = async () => {
    if (aiFiles.length === 0) return;
    setAiStage("analyzing");
    setAiProgressText(`Agentic AI is analyzing ${aiFiles.length} file(s) for your selected curriculum...`);

    try {
      const fd = new FormData();
      aiFiles.forEach(f => fd.append("files", f));

      if (aiYearId && aiYearId !== "all") {
        fd.append("academic_year_id", aiYearId);
      }
      if (aiSemId && aiSemId !== "all") {
        fd.append("semester_id", aiSemId);
      }

      const res = await materialsApi.aiAnalyzeBatch(fd);
      setAiAnalyzedItems(res.data.items);

      // Initialize editable items
      const editable: AIConfirmMaterialItem[] = res.data.items.map(item => ({
        filename: item.filename,
        original_filename: item.original_filename,
        title: item.title,
        description: item.description || "",
        academic_year_id: item.academic_year_id,
        academic_year_name: item.academic_year_name,
        semester_id: item.semester_id,
        semester_name: item.semester_name,
        course_id: item.course_id,
        course_name: item.course_name,
        chapter_id: item.chapter_id,
        chapter_number: item.chapter_number,
        chapter_title: item.chapter_title,
      }));

      setAiEditedItems(editable);
      setAiStage("review");
    } catch (err: any) {
      console.error(err);
      const detail = err?.response?.data?.detail;
      const errMsg = typeof detail === "string" ? detail : (Array.isArray(detail) ? detail.map((d: any) => d.msg || JSON.stringify(d)).join(", ") : err?.message);
      toast({
        title: "AI Analysis Failed",
        description: errMsg || "Could not analyze files. Check your network or file format (PDF, PPT, DOCX).",
        variant: "destructive",
      });
      setAiStage("setup_and_upload");
    }
  };

  const updateEditedItem = (index: number, field: keyof AIConfirmMaterialItem, val: any) => {
    setAiEditedItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: val } : item));
  };

  const handleConfirmAndOrganize = async () => {
    setAiStage("saving");
    try {
      const res = await materialsApi.aiConfirmBatch({ items: aiEditedItems });
      toast({
        title: "✨ All Materials Organized!",
        description: res.data.message || `Successfully organized ${aiEditedItems.length} materials into their chapters.`,
      });
      setAiModalOpen(false);

      // Reload materials if we are viewing a chapter
      if (filterChapter !== "all") {
        loadMaterials(Number(filterChapter));
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Organization Failed",
        description: err?.response?.data?.detail || "Could not commit materials. Please try again.",
        variant: "destructive",
      });
      setAiStage("review");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try { 
      await materialsApi.deleteMaterial(deleteTarget.id); 
      setDeleteTarget(null); 
      if (filterChapter !== "all") loadMaterials(Number(filterChapter)); 
      toast({ title: "Material deleted" });
    } catch { 
      setError("Delete failed."); 
    } finally { 
      setSaving(false); 
    }
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
        description="Upload course lecture notes, slides, and learning documents. Use AI Auto-Organizer to bulk-classify materials instantly."
        action={
          <div className="flex items-center gap-2">
            <Button
              onClick={openAiOrganizer}
              className="bg-gradient-to-r from-[#ff6633] to-[#e65526] hover:from-[#e65526] hover:to-[#d0451a] text-white font-bold gap-2 shadow-md shadow-[#ff6633]/20"
            >
              <Sparkles className="h-4 w-4" />
              AI Auto-Organizer (Bulk)
            </Button>
            <Button onClick={openUpload} variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              Manual Upload
            </Button>
          </div>
        } 
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
          description="Filter by year, semester, course, and chapter to view materials, or use 'AI Auto-Organizer' to upload everything at once." 
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
          title="No materials in this chapter yet" 
          description="Click 'AI Auto-Organizer' or 'Manual Upload' to add files." 
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
                    {mat.has_extracted_text && <span className="text-emerald-500 font-medium">· AI-ready</span>}
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

      {/* ══════════════════════════════════════════════════════════════
          AI AUTO-ORGANIZER MODAL (Step-by-Step Guided Multi-Upload)
          ══════════════════════════════════════════════════════════════ */}
      <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#ff6633] to-[#e65526] flex items-center justify-center text-white shadow-sm shadow-[#ff6633]/30">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg">Agentic AI Material Auto-Organizer</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select your target Year &amp; Semester, drop all course files, and AI will automatically organize chapters &amp; courses!
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* STEP 1: Guided Context & Multi-file Dropzone */}
          {aiStage === "setup_and_upload" && (
            <div className="space-y-4 py-2 flex-1 overflow-y-auto pr-1">
              
              {/* Year & Semester Context Box */}
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-[#161a1f] border border-slate-200 dark:border-[#222831] space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-border/50">
                  <GraduationCap className="h-4 w-4 text-[#ff6633]" />
                  <span className="text-xs font-bold text-foreground">
                    Step 1: Choose Target Academic Year &amp; Semester (Guides the AI)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-2xs font-semibold text-muted-foreground uppercase">Academic Year</Label>
                    <Select value={aiYearId} onValueChange={onAiYearSelect}>
                      <SelectTrigger className="bg-card text-xs">
                        <SelectValue placeholder="Select Academic Year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">🔍 Auto-Detect Year with AI</SelectItem>
                        {years.filter(y => y.is_available).map(y => (
                          <SelectItem key={y.id} value={String(y.id)}>
                            🎓 {y.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-2xs font-semibold text-muted-foreground uppercase">Semester</Label>
                    <Select value={aiSemId} onValueChange={setAiSemId} disabled={aiYearId === "all" || aiSemestersList.length === 0}>
                      <SelectTrigger className="bg-card text-xs">
                        <SelectValue placeholder="Select Semester" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">🔍 Auto-Detect Semester with AI</SelectItem>
                        {aiSemestersList.map(s => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            📅 {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Multi-File Dropzone */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#ff6633]" />
                  <span className="text-xs font-bold text-foreground">
                    Step 2: Upload All Material Files At Once
                  </span>
                </div>

                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => aiInputRef.current?.click()}
                  className="border-2 border-dashed border-[#ff6633]/40 hover:border-[#ff6633] bg-[#ff6633]/5 rounded-xl p-7 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
                >
                  <div className="h-11 w-11 rounded-full bg-[#ff6633]/15 flex items-center justify-center text-[#ff6633]">
                    <FileUp className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-sm text-foreground">
                    Drag and drop your lecture slides, notes &amp; documents here
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    Select 5–20 files at once (PDF, PPT, PPTX, Word .docx, or Text files).
                  </p>
                </div>
                <input
                  ref={aiInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              {/* Selected Files List */}
              {aiFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      Selected Files ({aiFiles.length})
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAiFiles([])}
                      className="text-xs text-muted-foreground hover:text-destructive h-7 px-2"
                    >
                      Clear All
                    </Button>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {aiFiles.map((file, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <span className="font-medium truncate">{file.name}</span>
                          <span className="text-muted-foreground font-mono text-3xs shrink-0">
                            ({formatFileSize(file.size)})
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => removeAiFile(i)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STAGE 2: Scanning & Processing Animation */}
          {aiStage === "analyzing" && (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-full bg-[#ff6633]/15 flex items-center justify-center text-[#ff6633] animate-pulse">
                  <Sparkles className="h-8 w-8 animate-spin" />
                </div>
              </div>
              <div className="space-y-1 max-w-md">
                <h4 className="font-bold text-base text-foreground">Agentic AI is Reading &amp; Classifying...</h4>
                <p className="text-xs text-muted-foreground">{aiProgressText}</p>
              </div>
              <div className="w-64 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#ff6633] to-[#ffa375] w-full animate-pulse" />
              </div>
            </div>
          )}

          {/* STAGE 3: Review & Edit Before Final Commit */}
          {aiStage === "review" && (
            <div className="space-y-4 py-2 flex-1 overflow-y-auto pr-1">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span><strong>AI Classification Complete:</strong> Review the auto-detected courses and chapters below. You can tweak any item before confirming.</span>
                </div>
                <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/15">
                  {aiEditedItems.length} Files Ready
                </Badge>
              </div>

              <div className="space-y-3">
                {aiEditedItems.map((item, idx) => {
                  const originalAnalysis = aiAnalyzedItems[idx];
                  return (
                    <Card key={idx} className="border border-border bg-card/60 overflow-hidden shadow-xs">
                      <CardContent className="p-4 space-y-3">
                        {/* Header: Filename & AI Confidence */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-4 w-4 text-[#ff6633] shrink-0" />
                            <span className="font-bold text-xs text-foreground truncate max-w-sm">
                              {item.original_filename}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {originalAnalysis && (
                              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-3xs gap-1">
                                <Sparkles className="h-2.5 w-2.5" />
                                {Math.round((originalAnalysis.confidence || 0.9) * 100)}% Match
                              </Badge>
                            )}
                            {originalAnalysis?.is_new_course && (
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-3xs">
                                + New Course
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Editable Classification Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                          {/* Academic Year */}
                          <div className="space-y-1">
                            <Label className="text-3xs font-semibold text-muted-foreground uppercase">Year</Label>
                            <Input
                              value={item.academic_year_name || "2nd Year"}
                              onChange={e => updateEditedItem(idx, "academic_year_name", e.target.value)}
                              className="h-8 text-xs bg-background"
                            />
                          </div>

                          {/* Semester */}
                          <div className="space-y-1">
                            <Label className="text-3xs font-semibold text-muted-foreground uppercase">Semester</Label>
                            <Input
                              value={item.semester_name || "Semester I"}
                              onChange={e => updateEditedItem(idx, "semester_name", e.target.value)}
                              className="h-8 text-xs bg-background"
                            />
                          </div>

                          {/* Course Name */}
                          <div className="space-y-1 sm:col-span-2">
                            <Label className="text-3xs font-semibold text-muted-foreground uppercase">Course Name</Label>
                            <Input
                              value={item.course_name}
                              onChange={e => updateEditedItem(idx, "course_name", e.target.value)}
                              className="h-8 text-xs font-semibold bg-background"
                            />
                          </div>

                          {/* Chapter Number */}
                          <div className="space-y-1">
                            <Label className="text-3xs font-semibold text-muted-foreground uppercase">Chapter #</Label>
                            <Input
                              type="number"
                              min={1}
                              value={item.chapter_number}
                              onChange={e => updateEditedItem(idx, "chapter_number", parseInt(e.target.value) || 1)}
                              className="h-8 text-xs bg-background"
                            />
                          </div>

                          {/* Chapter Title */}
                          <div className="space-y-1 sm:col-span-3">
                            <Label className="text-3xs font-semibold text-muted-foreground uppercase">Chapter Title</Label>
                            <Input
                              value={item.chapter_title}
                              onChange={e => updateEditedItem(idx, "chapter_title", e.target.value)}
                              className="h-8 text-xs bg-background"
                            />
                          </div>

                          {/* Clean Material Title */}
                          <div className="space-y-1 sm:col-span-4">
                            <Label className="text-3xs font-semibold text-muted-foreground uppercase">Display Title</Label>
                            <Input
                              value={item.title}
                              onChange={e => updateEditedItem(idx, "title", e.target.value)}
                              className="h-8 text-xs bg-background"
                            />
                          </div>
                        </div>

                        {/* AI Reasoning Note */}
                        {originalAnalysis?.reasoning && (
                          <p className="text-3xs text-muted-foreground/80 italic flex items-center gap-1 pt-1">
                            <span>💡</span> {originalAnalysis.reasoning}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* STAGE 4: Saving State */}
          {aiStage === "saving" && (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="h-10 w-10 text-[#ff6633] animate-spin" />
              <h4 className="font-bold text-base">Organizing &amp; Publishing Materials...</h4>
              <p className="text-xs text-muted-foreground">Creating courses, chapters, and storing materials into the academic hierarchy.</p>
            </div>
          )}

          <DialogFooter className="border-t border-border pt-3">
            {aiStage === "setup_and_upload" && (
              <>
                <Button variant="outline" onClick={() => setAiModalOpen(false)}>Cancel</Button>
                <Button
                  onClick={startAiAnalysis}
                  disabled={aiFiles.length === 0}
                  className="bg-[#ff6633] hover:bg-[#e65526] text-white font-bold gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Analyze {aiFiles.length > 0 ? `(${aiFiles.length} files)` : ""} with AI
                </Button>
              </>
            )}

            {aiStage === "review" && (
              <>
                <Button variant="outline" onClick={() => setAiStage("setup_and_upload")}>Back to Upload</Button>
                <Button
                  onClick={handleConfirmAndOrganize}
                  className="bg-gradient-to-r from-[#ff6633] to-[#e65526] hover:from-[#e65526] hover:to-[#d0451a] text-white font-black gap-2 shadow-md shadow-[#ff6633]/20"
                >
                  <Check className="h-4 w-4" />
                  Confirm &amp; Organize All ({aiEditedItems.length} Materials)
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════
          MANUAL UPLOAD DIALOG (Single file standard upload)
          ══════════════════════════════════════════════════════════════ */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Manual Study Material Upload</DialogTitle></DialogHeader>
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
              <Label>File * (PDF, PPT, DOCX, TXT — max 50MB)</Label>
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
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" className="hidden"
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
