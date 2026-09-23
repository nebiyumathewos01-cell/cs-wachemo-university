import apiClient from "./client";
import type { Quiz, QuizAttempt, QuizResult, Difficulty } from "@/types";

export interface GenerateQuizRequest {
  academic_year_id: number;
  semester_id: number;
  course_id: number;
  chapter_id?: number | null;
  num_questions: number;
  difficulty: Difficulty;
}

export interface MockExamRequest {
  academic_year_id: number;
  semester_id: number;
  course_id: number;
  chapter_ids?: number[];
  num_questions: number;
  difficulty: Difficulty;
  time_limit_minutes: number;
}

export interface SubmitQuizRequest {
  answers: Array<{
    question_id: number;
    selected_option_id?: number;
    text_answer?: string;
  }>;
}

export const quizApi = {
  generateQuiz: (data: GenerateQuizRequest) =>
    apiClient.post<Quiz>("/ai/generate-quiz", data),

  generateMaterialQuiz: (data: import("@/types").GenerateMaterialQuizRequest) =>
    apiClient.post<Quiz>("/ai/generate-material-quiz", data),

  generateMockExam: (data: MockExamRequest) =>
    apiClient.post<Quiz>("/ai/generate-mock-exam", data),

  getQuiz: (id: number) =>
    apiClient.get<Quiz>(`/quizzes/${id}`),

  startQuiz: (quizId: number) =>
    apiClient.post<QuizAttempt>(`/quizzes/${quizId}/start`),

  submitQuiz: (attemptId: number, data: SubmitQuizRequest) =>
    apiClient.post<QuizResult>(`/quiz-attempts/${attemptId}/submit`, data),

  getAttempt: (attemptId: number) =>
    apiClient.get<QuizAttempt>(`/quiz-attempts/${attemptId}`),

  getMyAttempts: (params?: { course_id?: number; page?: number }) =>
    apiClient.get<QuizAttempt[]>("/quiz-attempts/me", { params }),
};
