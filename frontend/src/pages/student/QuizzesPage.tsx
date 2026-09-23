import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Brain, Loader2, AlertCircle, ChevronLeft, ChevronRight, CheckCircle2, XCircle, RotateCcw, Sparkles, BookOpen, FileText, Target } from "lucide-react";
import { academicApi, coursesApi, chaptersApi, materialsApi } from "@/api/academic";
import { quizApi } from "@/api/quiz";
import type { AcademicYear, Semester, Course, Chapter, Material, Quiz, Difficulty, QuizResult } from "@/types";
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
  { value: "easy",          label: "Easy",         desc: "Definitions & basics" },
  { value: "medium",        label: "Medium",       desc: "Application & logic" },
  { value: "hard",          label: "Hard",         desc: "Deep analysis & cases" },
  { value: "exam_practice", label: "Exam Practice",desc: "University exam level" },
];

export default function QuizzesPage() {
  const [params] = useSearchParams();
  const urlMaterialId = params.get("material");
  const urlCourseId = params.get("course");
  const urlChapterId = params.get("chapter");

  const [years, setYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);

  const [selYear, setSelYear] = useState("");
  const [selSem, setSelSem] = useState("");
  const [selCourse, setSelCourse] = useState(urlCourseId ?? "");
  const [selChapter, setSelChapter] = useState(urlChapterId ?? "");
  const [selMaterial, setSelMaterial] = useState(urlMaterialId ?? "all");

  const [numQ, setNumQ] = useState("10");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [questionType, setQuestionType] = useState<string>("all");

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
  const [isMaterialsLoading, setIsMaterialsLoading] = useState(false);

  useEffect(() => { 
    academicApi.getYears().then(r => setYears(r.data)); 
  }, []);

  // Handle URL pre-fill
  useEffect(() => {
    if (urlChapterId) {
      loadChapterMaterials(Number(urlChapterId));
    }
  }, [urlChapterId]);

  const loadChapterMaterials = async (chId: number) => {
    setIsMaterialsLoading(true);
    try {
      const res = await materialsApi.getMaterialsByChapter(chId);
      setMaterials(res.data);
      if (urlMaterialId) {
        setSelMaterial(urlMaterialId);
      }
    } catch {
      // Ignore
    } finally {
      setIsMaterialsLoading(false);
    }
  };

  const onYearChange = async (v: string) => {
    setSelYear(v); setSelSem(""); setSelCourse(""); setSelChapter(""); setSelMaterial("all"); setMaterials([]);
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
    setSelSem(v); setSelCourse(""); setSelChapter(""); setSelMaterial("all"); setMaterials([]);
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
    setSelMaterial("all");
    setMaterials([]);
    setIsChaptersLoading(true);
    try {
      const r = await chaptersApi.getChapters(Number(v));
      setChapters(r.data);
    } finally {
      setIsChaptersLoading(false);
    }
  };

  const onChapterChange = async (v: string) => {
    setSelChapter(v);
    setSelMaterial("all");
    if (v !== "all") {
      loadChapterMaterials(Number(v));
    } else {
      setMaterials([]);
    }
  };

  const handleGenerate = async () => {
    if (!selMaterial || selMaterial === "all") {
      if (!selYear || !selSem || !selCourse) {
        setSetupError("Please select an academic year, semester, and course."); 
        return;
      }
    }
    setSetupError(""); setStep("generating");
    const genSteps = [
      "Reading selected study material…",
      "Analyzing core principles, definitions & algorithms…",
      "Generating grounded questions strictly from content…",
      "Validating answer correctness & explanations…",
    ];
    let i = 0;
    setGenStatus(genSteps[0]);
    const interval = setInterval(() => {
      i = (i + 1) % genSteps.length;
      setGenStatus(genSteps[i]);
    }, 900);
    try {
      let qr;
      if (selMaterial && selMaterial !== "all") {
        // Material-grounded Quiz Generation
        qr = await quizApi.generateMaterialQuiz({
          material_id: Number(selMaterial),
          num_questions: Number(numQ),
          difficulty,
          question_type: questionType,
        });
      } else {
        // Course/Chapter Level Quiz Generation
        const chId = selChapter && selChapter !== "all" ? Number(selChapter) : null;
        qr = await quizApi.generateQuiz({ 
          academic_year_id: Number(selYear || 1), 
          semester_id: Number(selSem || 1), 
          course_id: Number(selCourse), 
          chapter_id: chId, 
          num_questions: Number(numQ), 
          difficulty 
        });
      }

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Chapter / Topic</Label>
              <Select value={selChapter} onValueChange={onChapterChange} disabled={!selCourse || isChaptersLoading}>
                <SelectTrigger><SelectValue placeholder={isChaptersLoading ? "Loading..." : "Select chapter"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">✨ All Chapters / Whole Course</SelectItem>
                  {chapters.map(c => <SelectItem key={c.id} value={String(c.id)}>Ch.{c.number} – {c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Study Material Selector (Strict Grounding) */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-[#ff6633]" />
                <span>Target Study Material</span>
              </Label>
              <Select value={selMaterial} onValueChange={setSelMaterial} disabled={selChapter === "all" || isMaterialsLoading}>
                <SelectTrigger className="truncate"><SelectValue placeholder={isMaterialsLoading ? "Loading materials..." : "All Chapter Content"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">📚 All Materials in Chapter</SelectItem>
                  {materials.map(m => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      📄 {m.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Number of Questions</Label>
              <Select value={numQ} onValueChange={setNumQ}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">⚡ 5 Questions (Quick Check)</SelectItem>
                  <SelectItem value="10">🎯 10 Questions (Standard Quiz)</SelectItem>
                  <SelectItem value="15">📝 15 Questions (Deep Practice)</SelectItem>
                  <SelectItem value="20">🏆 20 Questions (Mastery Exam)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Question Format</Label>
              <Select value={questionType} onValueChange={setQuestionType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">✨ Multiple Choice &amp; True/False (Mixed)</SelectItem>
                  <SelectItem value="mcq">🔘 Multiple Choice Only (4 Choices)</SelectItem>
                  <SelectItem value="true_false">⚖️ True / False Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Difficulty Level</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DIFFICULTIES.map(d => (
                <button key={d.value} onClick={() => setDifficulty(d.value)}
                  className={cn("rounded-lg border p-2.5 text-left transition-all",
                    difficulty === d.value ? "border-[#ff6633] bg-[#ff6633]/10 dark:bg-[#ff6633]/15 shadow-xs" : "border-border hover:border-border-strong"
                  )}>
                  <p className={cn("text-xs font-bold", difficulty === d.value ? "text-[#ff6633]" : "text-foreground")}>{d.label}</p>
                  <p className="text-2xs text-muted-foreground mt-0.5">{d.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {selMaterial && selMaterial !== "all" && (
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-700 dark:text-purple-300 flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-purple-600 dark:text-purple-400" />
              <span><strong>Strict Material Grounding:</strong> AI will generate questions strictly and solely from the selected document.</span>
            </div>
          )}

          <Button 
            className="w-full gap-2 bg-gradient-to-r from-[#ff6633] to-[#e65526] hover:from-[#e65526] hover:to-[#d0451a] text-white font-bold shadow-md shadow-[#ff6633]/20" 
            size="lg" 
            onClick={handleGenerate}
          >
            <Sparkles className="h-4 w-4" />Generate Material Quiz with AI
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

        {/* ══════════════════════════════════════════════════════════════
            AGENTIC AI LEARNING FEEDBACK & STUDY RECOMMENDATIONS
            ══════════════════════════════════════════════════════════════ */}
        <div className="rounded-2xl border border-purple-500/30 bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Agentic AI Performance Diagnosis</h3>
              <p className="text-2xs text-muted-foreground">Personalized evaluation grounded in your quiz responses</p>
            </div>
          </div>

          {/* AI Summary Quote */}
          <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 text-xs text-purple-950 dark:text-purple-100 leading-relaxed font-medium">
            🧠 {result.ai_feedback?.performance_summary || "Good effort! Review the weak topics below to solidify your understanding of this material."}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* Strengths */}
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Concepts Mastered</span>
              </p>
              <ul className="space-y-1 text-2xs text-foreground/90">
                {(result.ai_feedback?.strengths && result.ai_feedback.strengths.length > 0
                  ? result.ai_feedback.strengths
                  : ["Core principles tested in this quiz"]
                ).map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weak Areas */}
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-2">
              <p className="text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                <span>Concepts Needing Practice</span>
              </p>
              <ul className="space-y-1 text-2xs text-foreground/90">
                {(result.ai_feedback?.weak_topics && result.ai_feedback.weak_topics.length > 0
                  ? result.ai_feedback.weak_topics
                  : (result.weak_topics && result.weak_topics.length > 0 ? result.weak_topics : ["No significant weaknesses found!"])
                ).map((w, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-rose-600 dark:text-rose-400 font-bold">!</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Targeted Material Review Sections */}
          {result.ai_feedback?.review_sections && result.ai_feedback.review_sections.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
              <p className="text-xs font-bold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span>Recommended Material Sections to Re-read</span>
              </p>
              <div className="space-y-1 text-2xs text-amber-950 dark:text-amber-100">
                {result.ai_feedback.review_sections.map((sec, i) => (
                  <p key={i} className="flex items-start gap-1.5">
                    <span>📖</span>
                    <span>{sec}</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Actionable Next Steps */}
          <div className="p-3.5 rounded-xl bg-muted/60 border border-border space-y-1.5">
            <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-[#ff6633]" />
              <span>Next Steps &amp; Recommendations</span>
            </p>
            <div className="space-y-1 text-2xs text-muted-foreground">
              {(result.ai_feedback?.recommendations || result.recommendations || []).map((r, i) => (
                <p key={i} className="flex items-start gap-1.5">
                  <span className="text-[#ff6633] font-bold">→</span>
                  <span>{r}</span>
                </p>
              ))}
            </div>
          </div>
        </div>

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
