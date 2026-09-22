// ============================================================
// AUTH & USER TYPES
// ============================================================

export type UserRole = "student" | "admin";

export interface User {
  id: number;
  email: string;
  username?: string | null;
  full_name: string;
  role: UserRole;
  selected_year_id: number | null;
  selected_year_name?: string | null;
  quiz_attempts_count?: number;
  created_at: string;
  is_active: boolean;
}

export interface Comment {
  id: number;
  user_id: number;
  title: string | null;
  content: string;
  category: string;
  is_private: boolean;
  admin_reply: string | null;
  replied_at: string | null;
  replied_by_name: string | null;
  is_resolved: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    full_name: string;
    username?: string | null;
    email: string;
    role: string;
  };
}

export interface PaginatedComments {
  items: Comment[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
  pending_count: number;
  resolved_count: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  full_name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// ============================================================
// ACADEMIC STRUCTURE TYPES
// ============================================================

export interface AcademicYear {
  id: number;
  name: string;          // "2nd Year", "3rd Year", "4th Year"
  order: number;
  is_available: boolean; // false = Coming Soon
  created_at: string;
}

export interface Semester {
  id: number;
  name: string;          // "Semester I", "Semester II"
  order: number;
  academic_year_id: number;
  academic_year?: AcademicYear;
  created_at: string;
}

export interface Course {
  id: number;
  name: string;
  code: string;
  description: string | null;
  semester_id: number;
  academic_year_id: number;
  semester?: Semester;
  academic_year?: AcademicYear;
  chapter_count?: number;
  created_at: string;
}

export interface Chapter {
  id: number;
  number: number;
  title: string;
  description: string | null;
  course_id: number;
  course?: Course;
  material_count?: number;
  created_at: string;
}

export interface Material {
  id: number;
  title: string;
  description: string | null;
  filename: string;
  original_filename: string;
  file_size: number;
  file_type: string;
  chapter_id: number;
  course_id: number;
  chapter?: Chapter;
  course?: Course;
  has_extracted_text: boolean;
  created_at: string;
}

export interface AIAnalyzedMaterial {
  filename: string;
  original_filename: string;
  title: string;
  description?: string;
  academic_year_name: string;
  academic_year_id?: number | null;
  semester_name: string;
  semester_id?: number | null;
  course_name: string;
  course_id?: number | null;
  chapter_number: number;
  chapter_title: string;
  chapter_id?: number | null;
  confidence: number;
  reasoning: string;
  is_new_course: boolean;
  is_new_chapter: boolean;
}

export interface AIAnalyzeBatchResponse {
  items: AIAnalyzedMaterial[];
  total_files: number;
}

export interface AIConfirmMaterialItem {
  filename: string;
  original_filename: string;
  title: string;
  description?: string;
  academic_year_id?: number | null;
  academic_year_name?: string;
  semester_id?: number | null;
  semester_name?: string;
  course_id?: number | null;
  course_name: string;
  chapter_id?: number | null;
  chapter_number: number;
  chapter_title: string;
}

export interface AIConfirmBatchRequest {
  items: AIConfirmMaterialItem[];
}

export interface AIConfirmedResultItem {
  material_id: number;
  title: string;
  course_name: string;
  chapter_title: string;
  status: string;
}

export interface AIConfirmBatchResponse {
  message: string;
  created_count: number;
  results: AIConfirmedResultItem[];
}


export interface PastExam {
  id: number;
  title: string;
  course_id: number;
  academic_year_id: number;
  semester_id: number;
  exam_year: number;
  exam_type: string;   // "Final", "Midterm", "Makeup"
  filename: string;
  original_filename: string;
  file_size: number;
  course?: Course;
  academic_year?: AcademicYear;
  semester?: Semester;
  created_at: string;
}

// ============================================================
// QUIZ TYPES
// ============================================================

export type QuestionType = "mcq" | "true_false" | "short_answer";
export type Difficulty = "easy" | "medium" | "hard" | "exam_practice";
export type QuizStatus = "pending" | "in_progress" | "completed";

export interface QuestionOption {
  id: number;
  label: string;       // "A", "B", "C", "D"
  text: string;
  is_correct: boolean;
}

export interface Question {
  id: number;
  text: string;
  question_type: QuestionType;
  difficulty: Difficulty;
  explanation: string | null;
  chapter_id: number;
  course_id: number;
  chapter?: Chapter;
  course?: Course;
  options?: QuestionOption[];
  created_at: string;
}

export interface Quiz {
  id: number;
  title: string;
  chapter_id: number | null;
  course_id: number;
  academic_year_id: number;
  difficulty: Difficulty;
  question_count: number;
  questions?: Question[];
  created_at: string;
}

export interface QuizAttempt {
  id: number;
  quiz_id: number;
  student_id: number;
  status: QuizStatus;
  score: number | null;
  total_questions: number;
  correct_answers: number | null;
  started_at: string;
  completed_at: string | null;
  quiz?: Quiz;
}

export interface StudentAnswer {
  question_id: number;
  selected_option_id: number | null;
  text_answer: string | null;
  is_correct: boolean | null;
}

export interface QuizResult {
  attempt_id: number;
  score: number;
  total_questions: number;
  correct_answers: number;
  incorrect_answers: number;
  answers: Array<{
    question: Question;
    student_answer: StudentAnswer;
    is_correct: boolean;
  }>;
  weak_topics: string[];
  recommendations: string[];
}

// ============================================================
// PROGRESS TYPES
// ============================================================

export interface CourseProgress {
  course_id: number;
  course_name: string;
  quiz_attempts: number;
  average_score: number;
  strong_chapters: string[];
  weak_chapters: string[];
}

export interface StudentProgress {
  student_id: number;
  by_year: Array<{
    year_name: string;
    courses: CourseProgress[];
  }>;
  total_quizzes: number;
  total_mock_exams: number;
  overall_average: number;
}

// ============================================================
// BOOKMARK TYPES
// ============================================================

export type BookmarkType = "course" | "chapter" | "material" | "question" | "past_exam";

export interface Bookmark {
  id: number;
  student_id: number;
  bookmark_type: BookmarkType;
  reference_id: number;
  title: string;
  created_at: string;
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface ApiError {
  detail: string;
  status_code?: number;
}

// ============================================================
// UI / NAVIGATION TYPES
// ============================================================

export interface NavItem {
  label: string;
  path: string;
  icon?: string;
  badge?: string;
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
}
