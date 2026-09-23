import apiClient from "./client";

export interface CodingProblem {
  id: number;
  title: string;
  slug: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  description: string;
  constraints?: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  starter_code: Record<string, string>;
  points: number;
  is_solved?: boolean;
}

export interface TestCaseResult {
  test_case: number;
  input: string;
  expected_output: string;
  actual_output: string;
  passed: boolean;
  execution_time_ms: number;
  error?: string;
}

export interface CodingRunResponse {
  passed: boolean;
  passed_count: number;
  total_count: number;
  test_results: TestCaseResult[];
  runtime_ms: number;
  memory_mb: number;
  error?: string;
}

export interface CodingSubmitResponse {
  submission_id: number;
  status: string;
  passed_count: number;
  total_count: number;
  runtime_ms: number;
  memory_mb: number;
  xp_awarded: number;
  error_message?: string;
}

export interface UserCodingStats {
  solved_count: number;
  total_count: number;
  easy_solved: number;
  medium_solved: number;
  hard_solved: number;
  streak: number;
  total_xp: number;
  completion_percentage: number;
}

export const codingApi = {
  getProblems: (params?: { category?: string; difficulty?: string; search?: string; status_filter?: string }) =>
    apiClient.get<CodingProblem[]>("/coding/problems", { params }),

  getProblem: (id: number) =>
    apiClient.get<CodingProblem>(`/coding/problems/${id}`),

  runCode: (id: number, data: { language: string; code: string }) =>
    apiClient.post<CodingRunResponse>(`/coding/problems/${id}/run`, data),

  submitCode: (id: number, data: { language: string; code: string }) =>
    apiClient.post<CodingSubmitResponse>(`/coding/problems/${id}/submit`, data),

  explainWithAI: (id: number, data: { language?: string; code?: string; mode?: string }) =>
    apiClient.post<{ explanation: string }>(`/coding/problems/${id}/explain-ai`, data),

  getUserStats: () =>
    apiClient.get<UserCodingStats>("/coding/user-stats"),
};
