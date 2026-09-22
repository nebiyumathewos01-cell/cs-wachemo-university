import apiClient from "./client";
import type {
  AcademicYear,
  Semester,
  Course,
  Chapter,
  Material,
  PastExam,
  PaginatedResponse,
} from "@/types";

// ─── Academic Years ──────────────────────────────────────────
export const academicApi = {
  getYears: () =>
    apiClient.get<AcademicYear[]>("/academic-years"),

  getYear: (id: number) =>
    apiClient.get<AcademicYear>(`/academic-years/${id}`),

  getSemesters: (yearId: number) =>
    apiClient.get<Semester[]>(`/academic-years/${yearId}/semesters`),

  getSemester: (id: number) =>
    apiClient.get<Semester>(`/semesters/${id}`),
};

// ─── Courses ─────────────────────────────────────────────────
export const coursesApi = {
  getCourses: (params?: { academic_year_id?: number; semester_id?: number; page?: number }) =>
    apiClient.get<PaginatedResponse<Course>>("/courses", { params }),

  getCourse: (id: number) =>
    apiClient.get<Course>(`/courses/${id}`),

  createCourse: (data: Partial<Course>) =>
    apiClient.post<Course>("/courses", data),

  updateCourse: (id: number, data: Partial<Course>) =>
    apiClient.put<Course>(`/courses/${id}`, data),

  deleteCourse: (id: number) =>
    apiClient.delete(`/courses/${id}`),
};

// ─── Chapters ────────────────────────────────────────────────
export const chaptersApi = {
  getChapters: (courseId: number) =>
    apiClient.get<Chapter[]>(`/courses/${courseId}/chapters`),

  getChapter: (id: number) =>
    apiClient.get<Chapter>(`/chapters/${id}`),

  createChapter: (data: Partial<Chapter>) =>
    apiClient.post<Chapter>("/chapters", data),

  updateChapter: (id: number, data: Partial<Chapter>) =>
    apiClient.put<Chapter>(`/chapters/${id}`, data),

  deleteChapter: (id: number) =>
    apiClient.delete(`/chapters/${id}`),
};

// ─── Materials ───────────────────────────────────────────────
export const materialsApi = {
  uploadMaterial: (formData: FormData) =>
    apiClient.post<Material>("/materials/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  aiAnalyzeBatch: (formData: FormData) =>
    apiClient.post<{ items: import("@/types").AIAnalyzedMaterial[]; total_files: number }>(
      "/materials/ai-analyze-batch",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    ),

  aiConfirmBatch: (data: { items: import("@/types").AIConfirmMaterialItem[] }) =>
    apiClient.post<import("@/types").AIConfirmBatchResponse>(
      "/materials/ai-confirm-batch",
      data
    ),

  getMaterial: (id: number) =>
    apiClient.get<Material>(`/materials/${id}`),

  getMaterialsByChapter: (chapterId: number) =>
    apiClient.get<Material[]>(`/chapters/${chapterId}/materials`),

  downloadMaterial: (id: number) =>
    apiClient.get(`/materials/${id}/download`, { responseType: "blob" }),

  deleteMaterial: (id: number) =>
    apiClient.delete(`/materials/${id}`),
};

// ─── Past Exams ──────────────────────────────────────────────
export const pastExamsApi = {
  getPastExams: (params?: {
    academic_year_id?: number;
    semester_id?: number;
    course_id?: number;
    exam_year?: number;
    page?: number;
    per_page?: number;
  }) =>
    apiClient.get<PaginatedResponse<PastExam>>("/past-exams", { params }),

  getPastExam: (id: number) =>
    apiClient.get<PastExam>(`/past-exams/${id}`),

  uploadPastExam: (formData: FormData) =>
    apiClient.post<PastExam>("/past-exams/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  downloadPastExam: (id: number) =>
    apiClient.get(`/past-exams/${id}/download`, { responseType: "blob" }),

  deletePastExam: (id: number) =>
    apiClient.delete(`/past-exams/${id}`),
};
