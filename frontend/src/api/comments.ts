import apiClient from "./client";
import type { Comment, PaginatedComments } from "@/types";

export interface CreateCommentData {
  title?: string;
  content: string;
  category?: string;
  is_private?: boolean;
}

export interface UpdateCommentData {
  title?: string;
  content?: string;
  category?: string;
  is_private?: boolean;
  is_resolved?: boolean;
}

export const commentsApi = {
  createComment: (data: CreateCommentData) =>
    apiClient.post<Comment>("/comments", data),

  getComments: (params?: {
    page?: number;
    per_page?: number;
    category?: string;
    status_filter?: "all" | "pending" | "replied" | "resolved";
    search?: string;
  }) => apiClient.get<PaginatedComments>("/comments", { params }),

  getMyComments: (params?: { page?: number; per_page?: number }) =>
    apiClient.get<PaginatedComments>("/comments/my", { params }),

  replyComment: (commentId: number, admin_reply: string) =>
    apiClient.put<Comment>(`/comments/${commentId}/reply`, { admin_reply }),

  updateComment: (commentId: number, data: UpdateCommentData) =>
    apiClient.patch<Comment>(`/comments/${commentId}`, data),

  deleteComment: (commentId: number) =>
    apiClient.delete<{ message: string }>(`/comments/${commentId}`),
};
