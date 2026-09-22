import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Brain, Loader2, AlertCircle, ChevronLeft, ChevronRight, CheckCircle2, XCircle, TrendingUp, RotateCcw } from "lucide-react";
import { academicApi, coursesApi, chaptersApi } from "@/api/academic";
import { quizApi } from "@/api/quiz";
import type { AcademicYear, Semester, Course, Chapter, Quiz, Difficulty, QuizResult } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn, getDifficultyLabel, getScoreColor } from "@/utils";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useToast } from "@/hooks/useToast";

type Step = "setup" | "generating" | "quiz" | "submitting" | "results";

const DIFFICULTIES: { value: Difficulty; label: string; desc: string }[] = [
  { value: "easy",          label: "Easy",         desc: "Basic recall" },
  { value: "medium",        label: "Medium",       desc: "Application" },
  { value: "hard",          label: "Hard",         desc: "Analysis" },
  { value: "exam_practice", label: "Exam Practice",desc: "University exam level" },
];

export default function QuizzesPage() {
  const [params] = useSearchParams();
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selYear, setSelYear] = useState("");
  const [selSem, setSelSem] = useState("");
  const [selCourse, setSelCourse] = useState(params.get("course") ?? "");
  const [selChapter, setSelChapter] = useState(params.get("chapter") ?? "");
  const [numQ, setNumQ] = useState("10");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [setupError, setSetupError] = useState("");
  const [step, setStep] = useState<Step>("setup");
  const [genStatus, setGenStatus] = useState("");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [showIncorrectOnly, setShowIncorrectOnly] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const { toast } = useToast();

  const [isSemestersLoading, setIsSemestersLoading] = useState(false);
  const [isCoursesLoading, setIsCoursesLoading] = useState(false);
  const [isChaptersLoading, setIsChaptersLoading] = useState(false);

  useEffect(() => { academicApi.getYears().then(r => setYears(r.data)); }, []);

  const onYearChange = async (v: string) => {
    setSelYear(v); setSelSem(""); setSelCourse(""); setSelChapter("");
    setIsSemestersLoading(true);
    setIsCoursesLoading(true);
    try {
      const [s, c] = await Promise.all([
        academicApi.getSemesters(Number(v)),
        coursesApi.getCourses({ academic_year_id: Number(v), per_page: 100 } as Parameters<typeof coursesApi.getCourses>[0]),
      ]);
      setSemesters(s.data); setCourses(c.data.items); setChapters([]);
    } finally {
      setIsSemestersLoading(false);
      setIsCoursesLoading(false);
    }
  };

  const onSemChange = async (v: string) => {
    setSelSem(v); setSelCourse(""); setSelChapter("");
    setIsCoursesLoading(true);
    try {
      const r = await coursesApi.getCourses({ academic_year_id: Number(selYear), semester_id: Number(v), per_page: 100 } as Parameters<typeof coursesApi.getCourses>[0]);
      setCourses(r.data.items); setChapters([]);
    } finally {
      setIsCoursesLoading(false);
    }
  };

  const onCourseChange = async (v: string) => {
    setSelCourse(v); 
    setSelChapter("all");
    setIsChaptersLoading(true);
    try {
      const r = await chaptersApi.getChapters(Number(v));
      setChapters(r.data);
    } finally {
      setIsChaptersLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selYear || !selSem || !selCourse) {
      setSetupError("Please select year, semester, and course."); 
      return;
    }
    setSetupError(""); setStep("generating");
    const genSteps = [
      "Analyzing course & chapter materials…",
      "Retrieving relevant content…",
      "Generating questions…",
      "Validating questions…",
    ];
    let i = 0;
    setGenStatus(genSteps[0]);
    const interval = setInterval(() => {
      i = (i + 1) % genSteps.length;
      setGenStatus(genSteps[i]);
    }, 900);
    try {
      const chId = selChapter && selChapter !== "all" ? Number(selChapter) : null;
      const qr = await quizApi.generateQuiz({ 
        academic_year_id: Number(selYear), 
        semester_id: Number(selSem), 
        course_id: Number(selCourse), 
        chapter_id: chId, 
        num_questions: Number(numQ), 
        difficulty 
      });
      clearInterval(interval);
      const ar = await quizApi.startQuiz(qr.data.id);
      setQuiz(qr.data); setAttemptId(ar.data.id);
      setCurrentQ(0); setAnswers({}); setStep("quiz");
    } catch (err: unknown) {
      clearInterval(interval);
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setSetupError(msg ?? "Unable to generate quiz. Please try again."); setStep("setup");
    }
  };

  const handleSubmit = async () => {
    if (!quiz || !attemptId) return;
    const answered = Object.keys(answers).length;
    const total = quiz.questions?.length ?? 0;
    if (answered < total) {
      setShowSubmitConfirm(true);
      return;
    }
    doSubmit();
  };

  const doSubmit = async () => {
    if (!quiz || !attemptId) return;
    setStep("submitting");
    try {
      const r = await quizApi.submitQuiz(attemptId, {
        answers: (quiz.questions ?? []).map(q => ({ question_id: q.id, selected_option_id: answers[q.id] }))
      });
      setResult(r.data); setStep("results");
    } catch {
      toast({ title: "Submission failed", description: "Please try again.", variant: "destructive" });
      setStep("quiz");
    }
  };

  const reset = () => { setStep("setup"); setQuiz(null); setResult(null); setShowReview(false); setShowIncorrectOnly(false); };

  // ── SETUP ─────────────────────────────────────────────────
  if (step === "setup") return (
    <div className="max-w-2xl mx-auto pb-24 lg:pb-8 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Brain className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">AI Quiz Generator</h1>
        </div>
        <p className="text-sm text-foreground-muted">The AI reads your chapter materials and generates grounded questions.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Configure your quiz</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {setupError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive-subtle border border-destructive/20 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />{setupError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Academic Year</Label>
              <Select value={selYear} onValueChange={onYearChange}>
                <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                <SelectContent>{years.filter(y => y.is_available).map(y => <SelectItem key={y.id} value={String(y.id)}>{y.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Semester</Label>
              <Select value={selSem} onValueChange={onSemChange} disabled={!selYear || isSemestersLoading}>
                <SelectTrigger><SelectValue placeholder={isSemestersLoading ? "Loading..." : "Select semester"} /></SelectTrigger>
                <SelectContent>{semesters.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Course</Label>
            <Select value={selCourse} onValueChange={onCourseChange} disabled={!selSem || isCoursesLoading}>
              <SelectTrigger><SelectValue placeholder={isCoursesLoading ? "Loading..." : "Select course"} /></SelectTrigger>
              <SelectContent>{courses.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Chapter / Topic</Label>
              <Select value={selChapter} onValueChange={setSelChapter} disabled={!selCourse || isChaptersLoading}>
                <SelectTrigger><SelectValue placeholder={isChaptersLoading ? "Loading..." : "Select chapter"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">✨ All Chapters / Whole Course</SelectItem>
                  {chapters.map(c => <SelectItem key={c.id} value={String(c.id)}>Ch.{c.number} – {c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Questions</Label>
              <Select value={numQ} onValueChange={setNumQ}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{[5,10,15,20,30].map(n => <SelectItem key={n} value={String(n)}>{n} questions</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Difficulty</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DIFFICULTIES.map(d => (
                <button key={d.value} onClick={() => setDifficulty(d.value)}
                  className={cn("rounded-lg border p-2.5 text-left transition-all",
                    difficulty === d.value ? "border-primary bg-primary-subtle" : "border-border hover:border-border-strong"
                  )}>
                  <p className={cn("text-xs font-semibold", difficulty === d.value ? "text-primary" : "text-foreground")}>{d.label}</p>
                  <p className="text-2xs text-foreground-subtle mt-0.5">{d.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <Button className="w-full gap-2" size="lg" onClick={handleGenerate}>
            <Brain className="h-4 w-4" />Generate Quiz with AI
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  // ── GENERATING ────────────────────────────────────────────
  if (step === "generating") return (
    <div className="flex flex-col items-center justify-center min-h-[55vh] gap-5">
      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Brain className="h-8 w-8 text-primary animate-pulse-slow" />
      </div>
      <div className="text-center">
        <p className="font-semibold text-lg">Generating your quiz</p>
        <p className="text-sm text-foreground-muted mt-1 min-h-[1.5rem] transition-all">{genStatus}</p>
      </div>
      <div className="flex gap-1.5">
        {[0,1,2].map(i => <div key={i} className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
      </div>
    </div>
  );

  // ── QUIZ ─────────────────────────────────────────────────
  if ((step === "quiz" || step === "submitting") && quiz?.questions) {
    const questions = quiz.questions;
    const q = questions[currentQ];
    const answered = Object.keys(answers).length;
    const progress = ((currentQ + 1) / questions.length) * 100;

    return (
      <div className="max-w-3xl mx-auto pb-24 lg:pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-foreground">Question {currentQ + 1} <span className="text-foreground-muted">of {questions.length}</span></p>
            <p className="text-xs text-foreground-subtle">{answered} answered</p>
          </div>
          <Badge variant="outline" className="text-xs">{getDifficultyLabel(quiz.difficulty)}</Badge>
        </div>
        <Progress value={progress} className="h-1.5 mb-6" />

        <div className="grid lg:grid-cols-[1fr_160px] gap-4 items-start">
          {/* Question card */}
          <Card>
            <CardContent className="p-6">
              <p className="font-semibold text-base leading-relaxed mb-6">{q.text}</p>
              <div className="space-y-2.5">
                {q.options?.map(opt => {
                  const selected = answers[q.id] === opt.id;
                  return (
                    <button key={opt.id} onClick={() => setAnswers(p => ({ ...p, [q.id]: opt.id }))}
                      className={cn(
                        "w-full text-left px-4 py-3.5 rounded-xl border text-sm transition-all",
                        "hover:border-primary/50 active:scale-[0.99]",
                        selected ? "border-primary bg-primary-subtle text-primary font-medium shadow-sm" : "border-border bg-background hover:bg-surface"
                      )} aria-pressed={selected}>
                      <span className={cn("font-bold mr-2.5 text-xs", selected ? "text-primary" : "text-foreground-subtle")}>{opt.label}.</span>
                      {opt.text}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Question navigator — desktop */}
          <div className="hidden lg:block">
            <div className="rounded-xl border border-border bg-card p-3 shadow-xs">
              <p className="text-xs font-semibold text-foreground-muted mb-2.5 px-0.5">Questions</p>
              <div className="grid grid-cols-4 gap-1">
                {questions.map((qi, i) => (
                  <button key={qi.id} onClick={() => setCurrentQ(i)}
                    className={cn("h-7 w-7 rounded text-xs font-semibold transition-all",
                      i === currentQ ? "bg-primary text-primary-foreground shadow-sm" :
                        answers[qi.id] ? "bg-primary/15 text-primary" : "bg-muted text-foreground-subtle hover:bg-muted/80"
                    )}>
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-5 gap-3">
          <Button variant="outline" size="sm" onClick={() => setCurrentQ(q => Math.max(0, q - 1))} disabled={currentQ === 0}>
            <ChevronLeft className="h-4 w-4 mr-1" />Previous
          </Button>

          {/* Mobile question dots */}
          <div className="flex gap-1 lg:hidden overflow-x-auto py-1">
            {questions.slice(Math.max(0, currentQ - 3), currentQ + 4).map((qi) => {
              const idx = questions.indexOf(qi);
              return (
                <button key={qi.id} onClick={() => setCurrentQ(idx)}
                  className={cn("h-6 w-6 rounded text-2xs font-semibold shrink-0",
                    idx === currentQ ? "bg-primary text-primary-foreground" :
                      answers[qi.id] ? "bg-primary/15 text-primary" : "bg-muted text-foreground-subtle"
                  )}>
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {currentQ < questions.length - 1 ? (
            <Button size="sm" onClick={() => setCurrentQ(q => q + 1)}>
              Next<ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground gap-1.5"
              onClick={handleSubmit} disabled={step === "submitting"}>
              {step === "submitting" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Submit Quiz
            </Button>
          )}
        </div>

        <ConfirmDialog 
          open={showSubmitConfirm}
          onOpenChange={setShowSubmitConfirm}
          title="Unanswered Questions"
          description={`You've answered ${answered} of ${questions.length} questions. Are you sure you want to submit?`}
          confirmLabel="Submit Anyway"
          onConfirm={() => { setShowSubmitConfirm(false); doSubmit(); }}
        />
      </div>
    );
  }

  // ── RESULTS ──────────────────────────────────────────────
  if (step === "results" && result) {
    const pct = Math.round(result.score);
    const scoreColor = getScoreColor(result.score);
    const grade = result.score >= 80 ? "Excellent" : result.score >= 60 ? "Good" : "Needs Work";

    const filteredAnswers = showIncorrectOnly 
      ? result.answers.filter(a => !a.is_correct) 
      : result.answers;

    return (
      <div className="max-w-3xl mx-auto pb-24 lg:pb-8 space-y-6">
        {/* Score hero */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 text-center shadow-sm">
          <Badge variant="muted" className="mb-4">{grade}</Badge>
          <div className={cn("text-5xl sm:text-6xl font-bold tracking-tight mb-2", scoreColor)}>{pct}%</div>
          <p className="text-foreground-muted text-sm">{result.correct_answers} correct out of {result.total_questions} questions</p>
          <div className="flex justify-center gap-6 mt-5 text-sm flex-wrap">
            <div className="flex items-center gap-2 text-success">
              <CheckCircle2 className="h-4 w-4" /><span className="font-semibold">{result.correct_answers} correct</span>
            </div>
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-4 w-4" /><span className="font-semibold">{result.incorrect_answers} incorrect</span>
            </div>
          </div>
          <Progress value={result.score} className="mt-5 h-2" />
        </div>

        {/* Recommendations */}
        {result.recommendations && result.recommendations.length > 0 && (
          <div className="rounded-xl bg-primary-subtle border border-primary/20 p-4">
            <p className="font-semibold text-sm text-primary flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4" />Recommendations
            </p>
            <div className="space-y-1">
              {result.recommendations.map((r, i) => (
                <p key={i} className="text-xs text-primary/80 flex gap-2"><span>•</span>{r}</p>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <Button
            onClick={() => setShowReview(v => !v)}
            variant={showReview ? "default" : "outline"}
            className="flex-1 font-semibold"
          >
            {showReview ? "Hide Answer Review" : "Review Answers with Explanations"}
          </Button>
          <Button onClick={reset} variant="secondary" className="flex-1 sm:flex-initial gap-1.5">
            <RotateCcw className="h-4 w-4" /> Take Another Quiz
          </Button>
        </div>

        {/* Answer review section */}
        {showReview && (
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
              <div>
                <h2 className="text-lg font-bold">Quiz Answer Review</h2>
                <p className="text-xs text-muted-foreground">Detailed breakdown of each question, your answer, and why the correct choice is right.</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button 
                  variant={!showIncorrectOnly ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setShowIncorrectOnly(false)}
                  className="text-xs h-8"
                >
                  All ({result.answers.length})
                </Button>
                <Button 
                  variant={showIncorrectOnly ? "destructive" : "outline"} 
                  size="sm" 
                  onClick={() => setShowIncorrectOnly(true)}
                  className="text-xs h-8"
                >
                  Incorrect Only ({result.incorrect_answers})
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {filteredAnswers.map((item, idx) => {
                const questionOptions = item.question?.options || [];
                const studentSelId = item.selected_option_id ?? item.student_answer?.selected_option_id ?? answers[item.question.id];
                const isCorrect = item.is_correct;

                return (
                  <Card
                    key={item.question.id || idx}
                    className={cn(
                      "overflow-hidden border-2 shadow-sm transition-all",
                      isCorrect
                        ? "border-emerald-500/40 bg-card"
                        : "border-rose-500/40 bg-card"
                    )}
                  >
                    <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/50 bg-muted/20">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span className={cn(
                            "flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold text-white shrink-0 mt-0.5",
                            isCorrect ? "bg-emerald-600" : "bg-rose-600"
                          )}>
                            {idx + 1}
                          </span>
                          <div>
                            <p className="text-sm sm:text-base font-semibold text-foreground leading-snug">
                              {item.question.text}
                            </p>
                          </div>
                        </div>

                        <Badge
                          className={cn(
                            "text-xs shrink-0 font-bold",
                            isCorrect
                              ? "bg-emerald-600 text-white"
                              : "bg-rose-600 text-white"
                          )}
                        >
                          {isCorrect ? "CORRECT" : "INCORRECT"}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 sm:p-5 space-y-3">
                      {/* All Options Breakdown */}
                      <div className="space-y-2">
                        {questionOptions.map((opt) => {
                          const isOptionCorrect = opt.is_correct || opt.id === item.correct_option_id;
                          const isOptionSelected = opt.id === studentSelId;

                          let containerClasses = "border-border bg-background text-foreground";
                          let badgeContent = null;

                          if (isOptionCorrect && isOptionSelected) {
                            containerClasses = "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-100 font-semibold shadow-xs";
                            badgeContent = (
                              <span className="text-2xs font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Your Choice (Correct)
                              </span>
                            );
                          } else if (isOptionCorrect && !isOptionSelected) {
                            containerClasses = "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-100 font-semibold";
                            badgeContent = (
                              <span className="text-2xs font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Correct Answer
                              </span>
                            );
                          } else if (!isOptionCorrect && isOptionSelected) {
                            containerClasses = "border-rose-500 bg-rose-50/80 dark:bg-rose-950/30 text-rose-950 dark:text-rose-100 font-semibold shadow-xs";
                            badgeContent = (
                              <span className="text-2xs font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                                <XCircle className="h-3 w-3" /> Your Choice (Wrong)
                              </span>
                            );
                          }

                          return (
                            <div
                              key={opt.id}
                              className={cn(
                                "flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border text-xs sm:text-sm gap-2 transition-colors",
                                containerClasses
                              )}
                            >
                              <div className="flex items-start gap-2.5 min-w-0">
                                <span className={cn(
                                  "font-mono font-bold px-1.5 py-0.5 rounded text-xs shrink-0",
                                  isOptionCorrect
                                    ? "bg-emerald-600 text-white"
                                    : isOptionSelected
                                    ? "bg-rose-600 text-white"
                                    : "bg-muted text-muted-foreground"
                                )}>
                                  {opt.label}
                                </span>
                                <span className="leading-snug">{opt.text}</span>
                              </div>
                              {badgeContent && <div className="self-end sm:self-center shrink-0">{badgeContent}</div>}
                            </div>
                          );
                        })}
                      </div>

                      {/* Clear Rationale / Explanation Box */}
                      {item.question.explanation && (
                        <div className="rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800 p-3.5 sm:p-4 text-xs sm:text-sm mt-3 space-y-1">
                          <p className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                            <span>💡 Detailed Explanation:</span>
                          </p>
                          <p className="text-amber-950/90 dark:text-amber-100/90 leading-relaxed">
                            {item.question.explanation}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {filteredAnswers.length === 0 && (
                <div className="text-center py-8 bg-muted/20 rounded-xl border border-border">
                  <p className="text-sm text-muted-foreground">No incorrect answers to review. Great job!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
