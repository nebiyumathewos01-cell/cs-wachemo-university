import { useEffect, useRef, useState } from "react";
import { GraduationCap, Loader2, AlertCircle, ChevronRight, ChevronLeft,
  Clock, CheckCircle2, XCircle, TrendingUp,
} from "lucide-react";
import { academicApi, coursesApi, chaptersApi } from "@/api/academic";
import { quizApi } from "@/api/quiz";
import type { AcademicYear, Semester, Course, Chapter, Quiz, Difficulty, QuizResult } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn, getScoreColor, getDifficultyLabel } from "@/utils";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useToast } from "@/hooks/useToast";

type Step = "setup" | "generating" | "exam" | "submitting" | "results";

export default function MockExamsPage() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selYear, setSelYear] = useState("");
  const [selSem, setSelSem] = useState("");
  const [selCourse, setSelCourse] = useState("");
  const [selChapters, setSelChapters] = useState<number[]>([]);
  const [numQ, setNumQ] = useState("20");
  const [difficulty, setDifficulty] = useState<Difficulty>("exam_practice");
  const [timeLimit, setTimeLimit] = useState("60");
  const [setupError, setSetupError] = useState("");

  const [step, setStep] = useState<Step>("setup");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const { toast } = useToast();

  useEffect(() => { academicApi.getYears().then(r => setYears(r.data)); }, []);

  // Timer
  useEffect(() => {
    if (step === "exam" && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(timerRef.current!); autoSubmit(); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [step]);

  const autoSubmit = async () => {
    if (!quiz || !attemptId) return;
    await submitQuiz();
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const onYearChange = async (v: string) => {
    setSelYear(v); setSelSem(""); setSelCourse(""); setSelChapters([]);
    const [s, c] = await Promise.all([
      academicApi.getSemesters(Number(v)),
      coursesApi.getCourses({ academic_year_id: Number(v), per_page: 100 } as Parameters<typeof coursesApi.getCourses>[0]),
    ]);
    setSemesters(s.data); setCourses(c.data.items); setChapters([]);
  };

  const onSemChange = async (v: string) => {
    setSelSem(v); setSelCourse(""); setSelChapters([]);
    const r = await coursesApi.getCourses({ academic_year_id: Number(selYear), semester_id: Number(v), per_page: 100 } as Parameters<typeof coursesApi.getCourses>[0]);
    setCourses(r.data.items); setChapters([]);
  };

  const onCourseChange = async (v: string) => {
    setSelCourse(v); setSelChapters([]);
    const r = await chaptersApi.getChapters(Number(v));
    setChapters(r.data);
  };

  const toggleChapter = (id: number) => {
    setSelChapters(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleStart = async () => {
    if (!selYear || !selSem || !selCourse || selChapters.length === 0) {
      setSetupError("Select year, semester, course, and at least one chapter."); return;
    }
    setSetupError(""); setStep("generating");
    try {
      const quizRes = await quizApi.generateMockExam({
        academic_year_id: Number(selYear),
        semester_id: Number(selSem),
        course_id: Number(selCourse),
        chapter_ids: selChapters,
        num_questions: Number(numQ),
        difficulty,
        time_limit_minutes: Number(timeLimit),
      });
      const q = quizRes.data;
      setQuiz(q);
      const attemptRes = await quizApi.startQuiz(q.id);
      setAttemptId(attemptRes.data.id);
      setCurrentQ(0); setAnswers({});
      setTimeLeft(Number(timeLimit) * 60);
      setStep("exam");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setSetupError(msg ?? "Failed to generate mock exam. Please try again.");
      setStep("setup");
    }
  };

  const submitQuiz = async () => {
    if (!quiz || !attemptId) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setStep("submitting");
    try {
      const res = await quizApi.submitQuiz(attemptId, {
        answers: (quiz.questions ?? []).map(q => ({
          question_id: q.id,
          selected_option_id: answers[q.id],
        })),
      });
      setResult(res.data); setStep("results");
    } catch { 
      toast({ title: "Submit failed", description: "Please try again.", variant: "destructive" }); 
      setStep("exam"); 
    }
  };

  const handleManualSubmit = () => {
    const answered = Object.keys(answers).length;
    const total = quiz?.questions?.length ?? 0;
    if (answered < total) {
      setShowSubmitConfirm(true);
      return;
    }
    submitQuiz();
  };

  // ─── SETUP ───────────────────────────────────────────────
  if (step === "setup") {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-20 lg:pb-0">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" /> Mock Exam
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Simulate exam conditions with a timed test across multiple chapters.
          </p>
        </div>
        <Card>
          <CardHeader><CardTitle className="text-base">Configure Mock Exam</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {setupError && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />{setupError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Academic Year</Label>
                <Select value={selYear} onValueChange={onYearChange}>
                  <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                  <SelectContent>
                    {years.filter(y => y.is_available).map(y => (
                      <SelectItem key={y.id} value={String(y.id)}>{y.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Semester</Label>
                <Select value={selSem} onValueChange={onSemChange} disabled={!selYear}>
                  <SelectTrigger><SelectValue placeholder="Select semester" /></SelectTrigger>
                  <SelectContent>
                    {semesters.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Course</Label>
              <Select value={selCourse} onValueChange={onCourseChange} disabled={!selSem}>
                <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>
                  {courses.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {chapters.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-end justify-between">
                  <Label>Chapters</Label>
                  <div className="flex gap-2">
                    <Button variant="link" size="xs" className="h-auto p-0" onClick={() => setSelChapters(chapters.map(c => c.id))}>Select All</Button>
                    <span className="text-muted-foreground text-xs">|</span>
                    <Button variant="link" size="xs" className="h-auto p-0" onClick={() => setSelChapters([])}>Deselect All</Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {chapters.map(ch => (
                    <button
                      key={ch.id}
                      onClick={() => toggleChapter(ch.id)}
                      className={cn(
                        "text-left px-3 py-2 rounded-lg border text-sm transition-all",
                        selChapters.includes(ch.id)
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <span className="font-medium">Ch.{ch.number}</span> {ch.title}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{selChapters.length} chapter{selChapters.length !== 1 ? "s" : ""} selected</p>
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Questions</Label>
                <Select value={numQ} onValueChange={setNumQ}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[10, 20, 30, 40, 50].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Difficulty</Label>
                <Select value={difficulty} onValueChange={v => setDifficulty(v as Difficulty)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                    <SelectItem value="exam_practice">Exam Practice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Time (min)</Label>
                <Select value={timeLimit} onValueChange={setTimeLimit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[30, 45, 60, 90, 120].map(n => <SelectItem key={n} value={String(n)}>{n} min</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full gap-2" onClick={handleStart} disabled={selChapters.length === 0}>
              <GraduationCap className="h-4 w-4" /> Start Mock Exam
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── GENERATING ──────────────────────────────────────────
  if (step === "generating") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <GraduationCap className="h-16 w-16 text-primary animate-pulse" />
        <p className="font-semibold text-lg">Preparing your mock exam…</p>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ─── EXAM ────────────────────────────────────────────────
  if ((step === "exam" || step === "submitting") && quiz?.questions) {
    const questions = quiz.questions;
    const q = questions[currentQ];
    const timerPct = (timeLeft / (Number(timeLimit) * 60)) * 100;
    const timerColor = timeLeft < 300 ? "text-destructive" : timeLeft < 600 ? "text-warning" : "text-foreground";

    return (
      <div className="max-w-2xl mx-auto space-y-4 pb-20 lg:pb-0">
        {/* Timer bar */}
        <div className="flex items-center justify-between bg-card border rounded-lg px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Question {currentQ + 1}/{questions.length}</span>
            <Badge variant="outline" className="text-xs">{getDifficultyLabel(quiz.difficulty)}</Badge>
          </div>
          <span className={cn("flex items-center gap-1.5 font-mono font-bold", timerColor)}>
            <Clock className="h-4 w-4" />{formatTime(timeLeft)}
          </span>
          <span className="text-xs text-muted-foreground">{Object.keys(answers).length} answered</span>
        </div>
        <Progress value={timerPct} className={cn("h-1.5", timeLeft < 300 ? "[&>div]:bg-destructive" : "")} />

        <Card>
          <CardContent className="p-6">
            <p className="font-semibold text-base leading-relaxed mb-6">{q.text}</p>
            <div className="space-y-2">
              {q.options?.map(opt => {
                const selected = answers[q.id] === opt.id;
                return (
                  <button key={opt.id} onClick={() => setAnswers(p => ({ ...p, [q.id]: opt.id }))}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-lg border text-sm transition-all",
                      selected ? "border-primary bg-primary/5 text-primary font-medium" : "border-border hover:border-primary/50 hover:bg-accent"
                    )}>
                    <span className="font-bold mr-2">{opt.label}.</span>{opt.text}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setCurrentQ(q => Math.max(0, q - 1))} disabled={currentQ === 0}>
            <ChevronLeft className="h-4 w-4 mr-1" />Prev
          </Button>
          <div className="flex gap-2">
            {currentQ < questions.length - 1 ? (
              <Button onClick={() => setCurrentQ(q => q + 1)}>
                Next<ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button className="bg-success hover:bg-success/90" onClick={handleManualSubmit} disabled={step === "submitting"}>
                {step === "submitting" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Submit Exam
              </Button>
            )}
          </div>
        </div>

        {/* Question dots */}
        <div className="flex flex-wrap gap-1 justify-center">
          {questions.map((qItem, i) => (
            <button key={qItem.id} onClick={() => setCurrentQ(i)}
              className={cn("h-6 w-6 rounded text-xs font-medium",
                i === currentQ ? "bg-primary text-primary-foreground" :
                  answers[qItem.id] ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}>
              {i + 1}
            </button>
          ))}
        </div>

        <ConfirmDialog 
          open={showSubmitConfirm}
          onOpenChange={setShowSubmitConfirm}
          title="Unanswered Questions"
          description={`You've answered ${Object.keys(answers).length} of ${questions.length} questions. Are you sure you want to submit?`}
          confirmLabel="Submit Anyway"
          onConfirm={() => { setShowSubmitConfirm(false); submitQuiz(); }}
        />
      </div>
    );
  }

  // ─── RESULTS ─────────────────────────────────────────────
  if (step === "results" && result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-20 lg:pb-0">
        <h1 className="text-2xl font-bold">Mock Exam Results</h1>
        <Card className="text-center">
          <CardContent className="py-8">
            <div className={cn("text-5xl font-bold mb-2", getScoreColor(result.score))}>
              {Math.round(result.score)}%
            </div>
            <p className="text-muted-foreground">{result.correct_answers} / {result.total_questions} correct</p>
            <div className="flex justify-center gap-4 mt-4 text-sm">
              <span className="flex items-center gap-1 text-success"><CheckCircle2 className="h-4 w-4" />{result.correct_answers}</span>
              <span className="flex items-center gap-1 text-destructive"><XCircle className="h-4 w-4" />{result.incorrect_answers}</span>
            </div>
          </CardContent>
        </Card>
        {result.recommendations.length > 0 && (
          <Card className="border-primary/20 bg-primary-subtle">
            <CardContent className="p-4">
              <p className="font-medium text-primary mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />Recommendations
              </p>
              {result.recommendations.map((r, i) => (
                <p key={i} className="text-sm text-primary/80">• {r}</p>
              ))}
            </CardContent>
          </Card>
        )}
        
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setShowReview(v => !v)} variant="outline" className="flex-1">
            {showReview ? "Hide" : "Review"} Answers
          </Button>
          <Button onClick={() => { setStep("setup"); setResult(null); setQuiz(null); setShowReview(false); }} className="flex-1">
            Take Another Exam
          </Button>
        </div>

        {/* Answer review */}
        {showReview && (
          <div className="space-y-3 mt-6">
            <h2 className="text-lg font-semibold">Answer Review</h2>
            {result.answers.map((item, idx) => {
              const correctOpt = item.question.options?.find(o => o.is_correct);
              const selectedOpt = item.question.options?.find(o => o.id === item.student_answer.selected_option_id);
              return (
                <Card key={idx} className={cn("border-l-4", item.is_correct ? "border-l-success" : "border-l-destructive")}>
                  <CardContent className="p-4">
                    <div className="flex gap-2 mb-3">
                      {item.is_correct
                        ? <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                        : <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />}
                      <p className="text-sm font-medium leading-snug">{item.question.text}</p>
                    </div>
                    {!item.is_correct && selectedOpt && (
                      <p className="text-xs text-destructive mb-1.5">Your answer: <strong>{selectedOpt.label}. {selectedOpt.text}</strong></p>
                    )}
                    {correctOpt && (
                      <p className="text-xs text-success mb-2">Correct: <strong>{correctOpt.label}. {correctOpt.text}</strong></p>
                    )}
                    {item.question.explanation && (
                      <div className="text-xs text-muted-foreground bg-surface border border-border rounded-lg p-2.5 mt-2">
                        <strong className="text-foreground">Explanation: </strong>{item.question.explanation}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return null;
}
