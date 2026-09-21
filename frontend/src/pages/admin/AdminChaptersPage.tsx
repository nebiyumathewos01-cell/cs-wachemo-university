import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, BookMarked, AlertCircle, ChevronRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams, Link } from "react-router-dom";
import { academicApi, coursesApi, chaptersApi } from "@/api/academic";
import type { AcademicYear, Semester, Course, Chapter } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import { ChapterSkeleton } from "@/components/common/Skeleton";

const chapterSchema = z.object({
  number: z.coerce.number().min(1, "Chapter number must be at least 1"),
  title: z.string().min(2, "Chapter title is required").max(200),
  description: z.string().max(500).optional(),
  course_id: z.coerce.number().min(1, "Select a course"),
});
type ChapterForm = z.infer<typeof chapterSchema>;

export default function AdminChaptersPage() {
  const [searchParams] = useSearchParams();
  const urlCourseId = searchParams.get("courseId");

  const [years, setYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [filterYearId, setFilterYearId] = useState<string>("all");
  const [filterSemesterId, setFilterSemesterId] = useState<string>("all");
  const [filterCourseId, setFilterCourseId] = useState<string>(urlCourseId || "all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingChapter, setDeletingChapter] = useState<Chapter | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ChapterForm>({
    resolver: zodResolver(chapterSchema),
  });

  // Initial load
  useEffect(() => {
    academicApi.getYears().then((r) => setYears(r.data));
    coursesApi.getCourses({ per_page: 100 } as Parameters<typeof coursesApi.getCourses>[0]).then((r) => {
      setCourses(r.data.items);
      if (urlCourseId && r.data.items.some((c: Course) => c.id === Number(urlCourseId))) {
        setFilterCourseId(urlCourseId);
        loadChapters(Number(urlCourseId));
      }
    });
  }, [urlCourseId]);

  const loadChapters = async (courseId: number) => {
    setLoading(true);
    try {
      const res = await chaptersApi.getChapters(courseId);
      setChapters(res.data);
    } catch {
      setError("Failed to load chapters.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterYear = async (val: string) => {
    setFilterYearId(val);
    setFilterSemesterId("all");
    setFilterCourseId("all");
    setChapters([]);
    if (val === "all") { setSemesters([]); setCourses([]); return; }
    const [semRes, courseRes] = await Promise.all([
      academicApi.getSemesters(Number(val)),
      coursesApi.getCourses({ academic_year_id: Number(val), per_page: 100 } as Parameters<typeof coursesApi.getCourses>[0]),
    ]);
    setSemesters(semRes.data);
    setCourses(courseRes.data.items);
  };

  const handleFilterSemester = async (val: string) => {
    setFilterSemesterId(val);
    setFilterCourseId("all");
    setChapters([]);
    const yearId = filterYearId === "all" ? undefined : Number(filterYearId);
    const semId = val === "all" ? undefined : Number(val);
    const res = await coursesApi.getCourses({ academic_year_id: yearId, semester_id: semId, per_page: 100 } as Parameters<typeof coursesApi.getCourses>[0]);
    setCourses(res.data.items);
  };

  const handleFilterCourse = (val: string) => {
    setFilterCourseId(val);
    if (val === "all") { setChapters([]); return; }
    loadChapters(Number(val));
  };

  const getCourse = (id: number) => courses.find((c) => c.id === id);

  const openCreate = () => {
    setEditingChapter(null);
    const courseId = filterCourseId !== "all" ? Number(filterCourseId) : 0;
    const lastNum = chapters.length > 0 ? Math.max(...chapters.map((c) => c.number)) + 1 : 1;
    reset({ number: lastNum, title: "", description: "", course_id: courseId });
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (chapter: Chapter) => {
    setEditingChapter(chapter);
    reset({
      number: chapter.number,
      title: chapter.title,
      description: chapter.description ?? "",
      course_id: chapter.course_id,
    });
    setFormError("");
    setDialogOpen(true);
  };

  const onSubmit = async (data: ChapterForm) => {
    setSaving(true);
    setFormError("");
    try {
      if (editingChapter) {
        await chaptersApi.updateChapter(editingChapter.id, data);
      } else {
        await chaptersApi.createChapter(data);
      }
      setDialogOpen(false);
      if (filterCourseId !== "all") await loadChapters(Number(filterCourseId));
    } catch {
      setFormError("Failed to save chapter. Please check all fields.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingChapter) return;
    setSaving(true);
    try {
      await chaptersApi.deleteChapter(deletingChapter.id);
      setDeleteDialogOpen(false);
      if (filterCourseId !== "all") await loadChapters(Number(filterCourseId));
    } catch {
      setError("Failed to delete chapter.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader 
        title="Manage Chapters" 
        action={
          <Button onClick={openCreate} disabled={filterCourseId === "all"} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Chapter
          </Button>
        }
      />

      {error && (
        <div className="callout-destructive flex items-center gap-2 p-3 rounded-md text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="w-44">
          <Select value={filterYearId} onValueChange={handleFilterYear}>
            <SelectTrigger><SelectValue placeholder="All Years" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {years.filter((y) => y.is_available).map((y) => (
                <SelectItem key={y.id} value={String(y.id)}>{y.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filterYearId !== "all" && semesters.length > 0 && (
          <div className="w-44">
            <Select value={filterSemesterId} onValueChange={handleFilterSemester}>
              <SelectTrigger><SelectValue placeholder="All Semesters" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                {semesters.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {courses.length > 0 && (
          <div className="w-56">
            <Select value={filterCourseId} onValueChange={handleFilterCourse}>
              <SelectTrigger><SelectValue placeholder="Select a course" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Select a course</SelectItem>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Breadcrumb / course info */}
      {filterCourseId !== "all" && (() => {
        const course = getCourse(Number(filterCourseId));
        return course ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookMarked className="h-4 w-4" />
            <span>{course.name}</span>
            {course.code && <Badge variant="secondary">{course.code}</Badge>}
            <ChevronRight className="h-3 w-3" />
            <span>{chapters.length} chapter{chapters.length !== 1 ? "s" : ""}</span>
          </div>
        ) : null;
      })()}

      {/* Chapter list */}
      {filterCourseId === "all" ? (
        <EmptyState 
          icon={BookMarked} 
          title="Select a course above" 
          description="Choose a year, semester, and course to manage its chapters." 
        />
      ) : loading ? (
        <div className="grid gap-2">
          <ChapterSkeleton count={4} />
        </div>
      ) : chapters.length === 0 ? (
        <EmptyState 
          icon={BookMarked} 
          title="No chapters yet" 
          description="Click 'Add Chapter' to create the first chapter." 
        />
      ) : (
        <div className="grid gap-2">
          {chapters.map((ch) => (
            <Card key={ch.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0 font-bold text-sm text-secondary-foreground">
                      {ch.number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{ch.title}</p>
                      {ch.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{ch.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {ch.material_count ?? 0} material{(ch.material_count ?? 0) !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="link" asChild className="text-xs h-8">
                      <Link to={`/admin/materials?chapterId=${ch.id}`}>Manage Materials →</Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(ch)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive-subtle"
                      onClick={() => { setDeletingChapter(ch); setDeleteDialogOpen(true); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingChapter ? "Edit Chapter" : "Add New Chapter"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            {formError && <p className="text-sm text-destructive">{formError}</p>}

            <div className="space-y-1.5">
              <Label>Course *</Label>
              <Select
                value={watch("course_id") ? String(watch("course_id")) : ""}
                onValueChange={(v) => setValue("course_id", Number(v))}
              >
                <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.course_id && <p className="text-xs text-destructive">{errors.course_id.message}</p>}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="number">Number *</Label>
                <Input id="number" type="number" min={1} {...register("number")} />
                {errors.number && <p className="text-xs text-destructive">{errors.number.message}</p>}
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="ch-title">Title *</Label>
                <Input id="ch-title" placeholder="Chapter title" {...register("title")} />
                {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ch-desc">Description</Label>
              <Textarea id="ch-desc" placeholder="Brief description…" rows={3} {...register("description")} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : editingChapter ? "Save Changes" : "Create Chapter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Delete Chapter</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete <strong>Chapter {deletingChapter?.number}: {deletingChapter?.title}</strong>?
            All materials in this chapter will also be deleted.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
