import apiClient from "./client";
import type { StudentProgress, Bookmark, BookmarkType } from "@/types";

export const progressApi = {
  getMyProgress: () =>
    apiClient.get<StudentProgress>("/progress"),
};

export const bookmarksApi = {
  getBookmarks: () =>
    apiClient.get<Bookmark[]>("/bookmarks"),

  addBookmark: (data: { bookmark_type: BookmarkType; reference_id: number; title: string }) =>
    apiClient.post<Bookmark>("/bookmarks", data),

  removeBookmark: (id: number) =>
    apiClient.delete(`/bookmarks/${id}`),
};
