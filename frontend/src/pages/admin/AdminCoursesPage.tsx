import { useEffect, useState, useMemo } from "react";
import { Plus, Pencil, Trash2, BookOpen, AlertCircle, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { academicApi, coursesApi } from "@/api/academic";
import type { AcademicYear, Semester, Course } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import { CardSkeleton } from "@/components/common/Skeleton";
import { Link } from "react-router-dom";

// ─── Schema ──────────────────────────────────────────────────
const courseSchema = z.object({
  name: z.string().min(2, "Course name is required").max(200),
  code: z.string().max(20).optional(),
  description: z.string().max(500).optional(),
  academic_year_id: z.coerce.number().min(1, "Select an academic year"),
  semester_id: z.coerce.number().min(1, "Select a semester"),
});
type CourseForm = z.infer<typeof courseSchema>;

// ─── Component ───────────────────────────────────────────────
export default function AdminCoursesPage() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter state
  const [filterYearId, setFilterYearId] = useState<string>("all");
  const [filterSemesterId, setFilterSemesterId] = useState<string>("all");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CourseForm>({
    resolver: zodResolver(courseSchema),
  });

  const watchedYearId = watch("academic_year_id");

  // Load years and initial courses
  useEffect(() => {
    Promise.all([
      academicApi.getYears(),
      coursesApi.getCourses({ per_page: 100 } as Parameters<typeof coursesApi.getCourses>[0]),
    ])
      .then(([yearsRes, coursesRes]) => {
        setYears(yearsRes.data);
        setCourses(coursesRes.data.items);
      })
      .catch(() => setError("Failed to load data."))
      .finally(() => setLoading(false));
  }, []);

  // Load semesters when year changes in form
  useEffect(() => {
    if (!watchedYearId) return;
    academicApi.getSemesters(Number(watchedYearId)).then((r) => setSemesters(r.data));
  }, [watchedYearId]);

  // Reload filtered courses
  const reloadCourses = async (yearId?: number, semId?: number) => {
    const params: Record<string, number> = {};
    if (yearId) params.academic_year_id = yearId;
    if (semId) params.semester_id = semId;
    const res = await coursesApi.getCourses({ ...params, per_page: 100 } as Parameters<typeof coursesApi.getCourses>[0]);
    setCourses(res.data.items);
  };

  const handleFilterYear = async (val: string) => {
    setFilterYearId(val);
    setFilterSemesterId("all");
    const yearId = val === "all" ? undefined : Number(val);
    if (yearId) {
      const semRes = await academicApi.getSemesters(yearId);
      setSemesters(semRes.data);
    }
    await reloadCourses(yearId);
  };

  const handleFilterSemester = async (val: string) => {
    setFilterSemesterId(val);
    const yearId = filterYearId === "all" ? undefined : Number(filterYearId);
    const semId = val === "all" ? undefined : Number(val);
    await reloadCourses(yearId, semId);
  };

  // Open create dialog
  const openCreate = () => {
    setEditingCourse(null);
    reset({ name: "", code: "", description: "", academic_year_id: 0, semester_id: 0 });
    setSemesters([]);
    setFormError("");
    setDialogOpen(true);
  };

  // Open edit dialog
  const openEdit = async (course: Course) => {
    setEditingCourse(course);
    const semRes = await academicApi.getSemesters(course.academic_year_id);
    setSemesters(semRes.data);
    reset({
      name: course.name,
      code: course.code ?? "",
      description: course.description ?? "",
      academic_year_id: course.academic_year_id,
      semester_id: course.semester_id,
    });
    setFormError("");
    setDialogOpen(true);
  };

  const onSubmit = async (data: CourseForm) => {
    setSaving(true);
    setFormError("");
    try {
      if (editingCourse) {
        await coursesApi.updateCourse(editingCourse.id, data);
      } else {
        await coursesApi.createCourse(data);
      }
      setDialogOpen(false);
      await reloadCourses(
        filterYearId === "all" ? undefined : Number(filterYearId),
        filterSemesterId === "all" ? undefined : Number(filterSemesterId),
      );
    } catch {
      setFormError("Failed to save course. Please check all fields.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCourse) return;
    setSaving(true);
    try {
      await coursesApi.deleteCourse(deletingCourse.id);
      setDeleteDialogOpen(false);
      setDeletingCourse(null);
      await reloadCourses(
        filterYearId === "all" ? undefined : Number(filterYearId),
        filterSemesterId === "all" ? undefined : Number(filterSemesterId),
      );
    } catch {
      setError("Failed to delete course.");
    } finally {
      setSaving(false);
    }
  };

  const getYearName = (id: number) => years.find((y) => y.id === id)?.name ?? "";
  
  // Actually, wait, getting semester name from semesters list may not work if semesters list is filtered by form or something, but we load semesters per year. 
  // For the course card we can just show "Sem X" if we don't have the full sem name, or better, we might need all semesters for mapping. 
  // Let's do a simple cache or just pass semester_id. 
  // Let's just find it in semesters if available, else fallback to ID.
  const getSemName = (id: number) => semesters.find((s) => s.id === id)?.name ?? `Sem ${id}`;

  const filteredCourses = useMemo(() => {
    return courses.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (c.code && c.code.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [courses, searchQuery]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader 
        title="Manage Courses" 
        action={<Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Add Course</Button>} 
      />

      {error && (
        <div className="callout-destructive flex items-center gap-2 p-3 rounded-md text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3">
          <div className="w-44">
            <Select value={filterYearId} onValueChange={handleFilterYear}>
              <SelectTrigger>
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
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
                <SelectTrigger>
                  <SelectValue placeholder="All Semesters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {semesters.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            className="pl-9" 
            placeholder="Search courses..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Course list */}
      {loading ? (
        <div className="grid gap-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredCourses.length === 0 ? (
        <EmptyState 
          icon={BookOpen} 
          title="No courses found" 
          description={courses.length === 0 ? "Click 'Add Course' to create the first course." : "Try adjusting your search or filters."} 
        />
      ) : (
        <div className="grid gap-3">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-primary-subtle flex items-center justify-center shrink-0">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{course.name}</p>
                        {course.code && (
                          <Badge variant="secondary" className="text-xs">{course.code}</Badge>
                        )}
                        <Badge variant="outline" className="text-xs">{getSemName(course.semester_id)}</Badge>
                      </div>
                      {course.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {course.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span>{getYearName(course.academic_year_id)}</span>
                        <span>·</span>
                        <span>{course.chapter_count ?? 0} chapters</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="link" asChild className="text-xs h-8">
                      <Link to={`/admin/chapters?courseId=${course.id}`}>Manage Chapters →</Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(course)}
                      aria-label="Edit course"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive-subtle"
                      onClick={() => { setDeletingCourse(course); setDeleteDialogOpen(true); }}
                      aria-label="Delete course"
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

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCourse ? "Edit Course" : "Add New Course"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="name">Course Name *</Label>
              <Input id="name" placeholder="e.g. Data Structures and Algorithms" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="code">Course Code</Label>
              <Input id="code" placeholder="e.g. CS301" {...register("code")} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Academic Year *</Label>
                <Select
                  value={watchedYearId ? String(watchedYearId) : ""}
                  onValueChange={(v) => {
                    setValue("academic_year_id", Number(v));
                    setValue("semester_id", 0);
                    academicApi.getSemesters(Number(v)).then((r) => setSemesters(r.data));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.filter((y) => y.is_available).map((y) => (
                      <SelectItem key={y.id} value={String(y.id)}>{y.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.academic_year_id && <p className="text-xs text-destructive">{errors.academic_year_id.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Semester *</Label>
                <Select
                  value={watch("semester_id") ? String(watch("semester_id")) : ""}
                  onValueChange={(v) => setValue("semester_id", Number(v))}
                  disabled={semesters.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.semester_id && <p className="text-xs text-destructive">{errors.semester_id.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Brief course description…" rows={3} {...register("description")} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : editingCourse ? "Save Changes" : "Create Course"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{deletingCourse?.name}</strong>?
            This will also delete all its chapters and materials.
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
