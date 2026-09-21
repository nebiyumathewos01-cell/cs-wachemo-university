import apiClient from "./client";
import type { User, PaginatedResponse } from "@/types";

export const adminApi = {
  getStudents: (params?: { page?: number; search?: string; role_filter?: string }) =>
    apiClient.get<PaginatedResponse<User>>("/admin/students", { params }),

  toggleStudentStatus: (userId: number) =>
    apiClient.patch<{ message: string; is_active: boolean }>(`/admin/students/${userId}/status`),

  updateStudent: (userId: number, data: { full_name?: string; username?: string; email?: string; role?: string; is_active?: boolean }) =>
    apiClient.put<{ message: string }>(`/admin/students/${userId}`, data),

  deleteStudent: (userId: number) =>
    apiClient.delete<{ message: string }>(`/admin/students/${userId}`),

  getAnalytics: () =>
    apiClient.get("/admin/analytics"),

  getAiLogs: (params?: { page?: number }) =>
    apiClient.get("/admin/ai-logs", { params }),

  reviewAiQuestion: (questionId: number, action: "approve" | "reject", data?: { text?: string; explanation?: string }) =>
    apiClient.put(`/admin/questions/${questionId}/review`, { action, ...data }),
};
