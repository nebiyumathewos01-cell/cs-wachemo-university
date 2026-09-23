import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Code2, ArrowLeft, Play, Send, RotateCcw, Sparkles,
  CheckCircle2, XCircle, Clock, Cpu, BookOpen, Terminal, Check, Loader2
} from "lucide-react";
import { codingApi, type CodingProblem, type CodingRunResponse, type CodingSubmitResponse } from "@/api/coding";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";
import MarkdownRenderer from "@/components/common/MarkdownRenderer";

const LANGUAGES = [
  { id: "python", name: "Python 3" },
  { id: "javascript", name: "JavaScript (ES6)" },
  { id: "cpp", name: "C++ (GCC 11)" },
  { id: "java", name: "Java 17" },
];

export default function CodingProblemDetailPage() {
  const { problemId } = useParams<{ problemId: string }>();
  const [problem, setProblem] = useState<CodingProblem | null>(null);
  const [loading, setLoading] = useState(true);

  // Editor State
  const [language, setLanguage] = useState<string>("python");
  const [code, setCode] = useState<string>("");

  // Execution & Submission State
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult, setRunResult] = useState<CodingRunResponse | null>(null);
  const [submitResult, setSubmitResult] = useState<CodingSubmitResponse | null>(null);

  // AI Assistant State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [activeLeftTab, setActiveLeftTab] = useState<"problem" | "ai-assistant">("problem");

  const { toast } = useToast();

  useEffect(() => {
    if (!problemId) return;
    const id = Number(problemId);
    setLoading(true);
    codingApi
      .getProblem(id)
      .then((res) => {
        setProblem(res.data);
        const starter = res.data.starter_code[language] || res.data.starter_code["python"] || "";
        setCode(starter);
      })
      .catch((err) => {
        console.error("Failed to load problem:", err);
      })
      .finally(() => setLoading(false));
  }, [problemId]);

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    if (problem && problem.starter_code[newLang]) {
      setCode(problem.starter_code[newLang]);
    }
  };

  const handleResetCode = () => {
    if (problem && problem.starter_code[language]) {
      setCode(problem.starter_code[language]);
      toast({ title: "Code Reset", description: "Restored starter code template." });
    }
  };

  const handleRunCode = async () => {
    if (!problemId || !code.trim()) return;
    setRunning(true);
    try {
      const res = await codingApi.runCode(Number(problemId), { language, code });
      setRunResult(res.data);
      if (res.data.passed) {
        toast({ title: "All Test Cases Passed! 🎉", description: `Ran ${res.data.passed_count}/${res.data.total_count} tests in ${res.data.runtime_ms}ms` });
      } else {
        toast({ title: "Tests Failed", description: res.data.error || "Some test cases failed.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Execution Error", description: "Failed to run code.", variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!problemId || !code.trim()) return;
    setSubmitting(true);
    try {
      const res = await codingApi.submitCode(Number(problemId), { language, code });
      setSubmitResult(res.data);
      if (res.data.status === "Accepted") {
        toast({ title: "Solution Accepted! 🚀", description: `Earned +${res.data.xp_awarded} XP! All tests passed.` });
        if (problem) setProblem({ ...problem, is_solved: true });
      } else {
        toast({ title: "Submission Failed", description: res.data.error_message || "Wrong Answer", variant: "destructive" });
      }
    } catch {
      toast({ title: "Submission Error", description: "Failed to submit code.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExplainWithAI = async (mode: string = "solution") => {
    if (!problemId) return;
    setAiLoading(true);
    setActiveLeftTab("ai-assistant");
    try {
      const res = await codingApi.explainWithAI(Number(problemId), { language: "cpp", code, mode });
      setAiExplanation(res.data.explanation);
    } catch {
      toast({ title: "AI Error", description: "Failed to generate AI explanation.", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  if (loading || !problem) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <p className="text-xs font-medium text-muted-foreground">Loading coding workspace...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto pb-12 space-y-4">
      {/* Top Header Nav */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1.5">
            <Link to="/coding">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Problems
            </Link>
          </Button>
          <div className="h-4 w-px bg-border" />
          <h2 className="text-base font-bold text-foreground truncate flex items-center gap-2">
            #{problem.id}. {problem.title}
            {problem.is_solved && (
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] py-0 px-1.5 gap-1">
                <CheckCircle2 className="h-3 w-3" /> Solved
              </Badge>
            )}
          </h2>
        </div>

        <Button
          onClick={() => handleExplainWithAI("solution")}
          disabled={aiLoading}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs h-8 gap-1.5 shadow-sm"
        >
          {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          Explain with AI
        </Button>
      </div>

      {/* Main 3-Panel Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[720px]">
        {/* LEFT PANEL: Problem Details & AI Assistant (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col bg-card border border-border rounded-2xl shadow-sm overflow-hidden h-[740px]">
          <div className="px-4 pt-3 pb-2 border-b border-border bg-muted/30 shrink-0 flex items-center gap-2">
            <button
              onClick={() => setActiveLeftTab("problem")}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeLeftTab === "problem"
                  ? "bg-card shadow-sm text-foreground border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5 text-purple-600" /> Description
            </button>
            <button
              onClick={() => setActiveLeftTab("ai-assistant")}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeLeftTab === "ai-assistant"
                  ? "bg-card shadow-sm text-foreground border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-600" /> AI Guide
            </button>
          </div>

          {/* Problem Description Content */}
          {activeLeftTab === "problem" && (
            <div className="flex-1 overflow-auto p-5 space-y-5 m-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                  {problem.category}
                </Badge>
                <Badge
                  className={`text-xs ${
                    problem.difficulty === "Easy"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : problem.difficulty === "Medium"
                      ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                  }`}
                >
                  {problem.difficulty}
                </Badge>
                <Badge variant="secondary" className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  +{problem.points} XP
                </Badge>
              </div>

              <div className="prose dark:prose-invert prose-sm text-xs leading-relaxed max-w-none">
                <MarkdownRenderer content={problem.description} />
              </div>

              {/* Examples */}
              {problem.examples && problem.examples.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Examples</h4>
                  {problem.examples.map((ex, idx) => (
                    <div key={idx} className="bg-muted/40 rounded-xl p-3.5 border border-border text-xs space-y-1.5 font-mono">
                      <div>
                        <span className="text-muted-foreground font-semibold">Input: </span>
                        <code className="text-purple-600 dark:text-purple-300">{ex.input}</code>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-semibold">Output: </span>
                        <code className="text-emerald-600 dark:text-emerald-300">{ex.output}</code>
                      </div>
                      {ex.explanation && (
                        <div className="text-[11px] text-muted-foreground font-sans pt-1 border-t border-border/50">
                          <strong>Explanation: </strong>{ex.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Constraints */}
              {problem.constraints && (
                <div className="space-y-1.5 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Constraints</h4>
                  <div className="bg-muted/30 rounded-xl p-3 border border-border text-xs font-mono whitespace-pre-wrap text-muted-foreground">
                    {problem.constraints}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Assistant Explanation Content */}
          {activeLeftTab === "ai-assistant" && (
            <div className="flex-1 overflow-auto p-4 m-0 space-y-4">
              {/* Learning Modes Bar */}
              <div className="space-y-1.5 bg-muted/40 p-3 rounded-xl border border-border">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-purple-600" /> Choose AI Learning Mode
                </p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExplainWithAI("hint")}
                    disabled={aiLoading}
                    className="text-[11px] h-7 px-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
                  >
                    💡 Hint
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExplainWithAI("concept")}
                    disabled={aiLoading}
                    className="text-[11px] h-7 px-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/30 hover:bg-blue-500/20"
                  >
                    📖 Concept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExplainWithAI("approach")}
                    disabled={aiLoading}
                    className="text-[11px] h-7 px-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20"
                  >
                    🚀 Approach
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExplainWithAI("solution")}
                    disabled={aiLoading}
                    className="text-[11px] h-7 px-2.5 bg-purple-600 text-white hover:bg-purple-700"
                  >
                    📝 Solution
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExplainWithAI("explain-code")}
                    disabled={aiLoading}
                    className="text-[11px] h-7 px-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                  >
                    🔍 Explain My Code
                  </Button>
                </div>
              </div>

              {aiLoading ? (
                <div className="flex flex-col items-center justify-center p-12 space-y-3">
                  <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
                  <p className="text-xs font-medium text-muted-foreground">Generating step-by-step C++ AI explanation...</p>
                </div>
              ) : aiExplanation ? (
                <div className="prose dark:prose-invert prose-sm text-xs max-w-none leading-relaxed">
                  <MarkdownRenderer content={aiExplanation} />
                </div>
              ) : (
                <div className="text-center py-12 space-y-3">
                  <Sparkles className="h-10 w-10 text-purple-600 mx-auto" />
                  <h4 className="text-sm font-bold">Deep C++ AI Solution Guide</h4>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Select a mode above or click "Explain with AI" to receive a beginner-friendly C++ walkthrough, complexity analysis, and line-by-line explanation.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* CENTER & BOTTOM PANEL: Code Editor + Test Case Results (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4 h-[740px]">
          {/* Top Code Editor Area */}
          <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
            {/* Editor Toolbar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-purple-400" />
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs py-1 px-2.5 font-medium focus:outline-none"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetCode}
                  className="h-7 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 gap-1.5"
                >
                  <RotateCcw className="h-3 w-3" /> Reset
                </Button>
              </div>
            </div>

            {/* Code Input Textarea */}
            <div className="relative flex-1 p-3 font-mono text-xs text-slate-200 bg-slate-950 overflow-auto">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                className="w-full h-full bg-transparent resize-none focus:outline-none font-mono text-xs text-slate-100 leading-relaxed"
                placeholder="Write your code solution here..."
              />
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-t border-slate-800 shrink-0">
              <div className="text-[11px] text-slate-400 font-mono">
                {code.split("\n").length} Lines · {code.length} Characters
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  onClick={handleRunCode}
                  disabled={running || submitting}
                  variant="secondary"
                  size="sm"
                  className="h-8 text-xs font-semibold bg-indigo-600/90 hover:bg-indigo-600 text-white gap-1.5"
                >
                  {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} Run Code
                </Button>

                <Button
                  onClick={handleSubmitCode}
                  disabled={running || submitting}
                  size="sm"
                  className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                >
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Submit
                </Button>
              </div>
            </div>
          </div>

          {/* Bottom Execution Results Panel */}
          <div className="h-56 bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col shrink-0">
            <div className="px-4 py-2 bg-muted/40 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-purple-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Test Case Results & Console</h4>
              </div>

              {(runResult || submitResult) && (
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" /> {(runResult || submitResult)?.runtime_ms} ms
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Cpu className="h-3 w-3" /> {(runResult || submitResult)?.memory_mb} MB
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 p-4 overflow-auto font-mono text-xs">
              {running || submitting ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-purple-600" /> Running code against test suite...
                </div>
              ) : submitResult ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {submitResult.status === "Accepted" ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs py-1 px-2.5 gap-1.5">
                        <CheckCircle2 className="h-4 w-4" /> Accepted (+{submitResult.xp_awarded} XP)
                      </Badge>
                    ) : (
                      <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/30 text-xs py-1 px-2.5 gap-1.5">
                        <XCircle className="h-4 w-4" /> {submitResult.status}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Passed {submitResult.passed_count} / {submitResult.total_count} test cases
                    </span>
                  </div>

                  {submitResult.error_message && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl whitespace-pre-wrap">
                      {submitResult.error_message}
                    </div>
                  )}
                </div>
              ) : runResult ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {runResult.passed ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs py-1 px-2.5 gap-1.5">
                        <CheckCircle2 className="h-4 w-4" /> All Tests Passed ({runResult.passed_count}/{runResult.total_count})
                      </Badge>
                    ) : (
                      <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/30 text-xs py-1 px-2.5 gap-1.5">
                        <XCircle className="h-4 w-4" /> Tests Failed ({runResult.passed_count}/{runResult.total_count} Passed)
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    {runResult.test_results.map((tr) => (
                      <div key={tr.test_case} className="p-2.5 rounded-lg border border-border bg-muted/30 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-foreground">Test Case #{tr.test_case}</span>
                          {tr.passed ? (
                            <span className="text-emerald-600 font-bold flex items-center gap-1">
                              <Check className="h-3 w-3" /> Passed
                            </span>
                          ) : (
                            <span className="text-rose-600 font-bold flex items-center gap-1">
                              <XCircle className="h-3 w-3" /> Failed
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Expected: <code className="text-foreground">{tr.expected_output}</code> | Actual: <code className="text-purple-600">{tr.actual_output || "None"}</code>
                        </div>
                        {tr.error && <div className="text-[11px] text-rose-500">{tr.error}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground text-center py-6">
                  Click <strong>Run Code</strong> or <strong>Submit</strong> to evaluate your solution against test cases.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
