import apiClient from "./client";

export interface StudyRequest {
  academic_year_id: number;
  course_id: number;
  chapter_id: number;
  question: string;
}

export interface StudyResponse {
  answer: string;
  sources: Array<{ material_title: string; chapter_title: string }>;
}

export const aiApi = {
  askStudyAssistant: (data: StudyRequest) =>
    apiClient.post<StudyResponse>("/ai/study", data),
};
