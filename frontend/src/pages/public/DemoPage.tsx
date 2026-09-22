import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import MarkdownRenderer from "@/components/common/MarkdownRenderer";
import PaymentModal from "@/components/payment/PaymentModal";
import {
  Brain,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  BookOpen,
  GraduationCap,
  FileText,
  CreditCard,
  Copy,
  Zap,
  Award,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";

interface DemoQuestion {
  id: number;
  course: string;
  topic: string;
  question: string;
  options: { label: string; text: string; isCorrect: boolean }[];
  explanation: string;
}

const DEMO_QUESTIONS: DemoQuestion[] = [
  {
    id: 1,
    course: "Data Structures & Algorithms",
    topic: "Binary Search Trees",
    question: "What is the worst-case time complexity of searching for an element in an unbalanced Binary Search Tree (BST) with n nodes?",
    options: [
      { label: "A", text: "O(1)", isCorrect: false },
      { label: "B", text: "O(log n)", isCorrect: false },
      { label: "C", text: "O(n)", isCorrect: true },
      { label: "D", text: "O(n log n)", isCorrect: false },
    ],
    explanation: "In the worst case (such as inserting keys in ascending sorted order), an unbalanced BST degrades into a linear single-branch chain (identical to a linked list) of depth n. Searching thus requires traversing all n nodes: O(n). To guarantee O(log n), balanced trees like AVL or Red-Black trees are required.",
  },
  {
    id: 2,
    course: "Object Oriented Programming",
    topic: "Polymorphism & Dynamic Binding",
    question: "Which mechanism allows a Java or C++ application to invoke a derived class's method implementation at runtime through a base class reference?",
    options: [
      { label: "A", text: "Method Overloading", isCorrect: false },
      { label: "B", text: "Method Overriding with Dynamic Dispatch", isCorrect: true },
      { label: "C", text: "Data Encapsulation using Private Variables", isCorrect: false },
      { label: "D", text: "Static Early Binding at Compile Time", isCorrect: false },
    ],
    explanation: "Dynamic (runtime) polymorphism is accomplished through Method Overriding. When a method is called on a superclass reference holding a subclass object, dynamic dispatch inspects the actual object instance (via virtual method tables / vtables) and executes the subclass override.",
  },
  {
    id: 3,
    course: "Advanced Database Systems",
    topic: "Transaction ACID Properties",
    question: "Which ACID property guarantees that the intermediate state changes of a transaction are completely hidden from concurrent transactions?",
    options: [
      { label: "A", text: "Atomicity (All or Nothing)", isCorrect: false },
      { label: "B", text: "Consistency (Constraint Preservation)", isCorrect: false },
      { label: "C", text: "Isolation (Independent Execution)", isCorrect: true },
      { label: "D", text: "Durability (Persistence to Disk)", isCorrect: false },
    ],
    explanation: "Isolation ensures that concurrent transactions execute independently without interfering with one another or observing half-finished data states. It prevents anomalies such as dirty reads, non-repeatable reads, and phantom reads using locking or multiversion concurrency control (MVCC).",
  },
];

const DEMO_AI_SAMPLES = [
  {
    id: "dijkstra",
    title: "Dijkstra's Algorithm",
    course: "Design & Analysis of Algorithms",
    prompt: "Explain Dijkstra's shortest path algorithm with C++ code and complexity",
    content: `### Dijkstra's Shortest Path Algorithm
**Core Principle**: Finds the shortest path from a single source vertex to all vertices in a directed/undirected graph with **non-negative edge weights** using a Greedy Priority Queue.

\`\`\`cpp
#include <iostream>
#include <vector>
#include <queue>
using namespace std;

typedef pair<int, int> pii; // {distance, vertex}

void dijkstra(int src, int V, const vector<vector<pii>>& adj) {
    vector<int> dist(V, 1e9);
    priority_queue<pii, vector<pii>, greater<pii>> pq; // Min-heap

    dist[src] = 0;
    pq.push({0, src});

    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();

        if (d > dist[u]) continue;

        for (auto [w, v] : adj[u]) {
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.push({dist[v], v});
            }
        }
    }
}
\`\`\`

**Key Takeaways**:
- **Time Complexity**: \`O((V + E) log V)\` using a Binary Min-Heap.
- **Limitation**: Does **not** support negative edge weights (use Bellman-Ford for negative weights).
`,
  },
  {
    id: "normalization",
    title: "Database Normalization (1NF to 3NF)",
    course: "Database Systems",
    prompt: "How do I normalize a table from 1NF to 3NF step-by-step?",
    content: `### 3-Step Normalization Rulebook

1. **First Normal Form (1NF)**:
   - Eliminate duplicate columns and ensure all attributes are **atomic** (single, indivisible values).
   - Define a primary key.

2. **Second Normal Form (2NF)**:
   - Must satisfy **1NF**.
   - Eliminate **Partial Functional Dependencies**: Every non-key attribute must depend on the **entire** composite primary key, not just a portion of it.

3. **Third Normal Form (3NF)**:
   - Must satisfy **2NF**.
   - Eliminate **Transitive Dependencies**: If \\(A \\rightarrow B\\) and \\(B \\rightarrow C\\), separate \\(C\\) into its own relation so non-key attributes only depend directly on the primary key.

> 💡 **The Golden Rule of 3NF**: Every attribute must depend on **the key, the whole key, and nothing but the key**!
`,
  },
  {
    id: "deadlock",
    title: "OS Deadlock & Banker's Algorithm",
    course: "Operating Systems",
    prompt: "What are the 4 Coffman conditions for Deadlock and how does Banker's algorithm work?",
    content: `### Operating Systems: Deadlock Fundamentals

A deadlock occurs when processes are unable to proceed because each holds resources while waiting for others.

#### The 4 Coffman Conditions (Must occur simultaneously):
1. **Mutual Exclusion**: At least one non-shareable resource.
2. **Hold and Wait**: A process holds resources while requesting new ones.
3. **No Preemption**: Resources cannot be forcefully confiscated.
4. **Circular Wait**: A closed chain of processes waiting on each other \\(P_0 \\rightarrow P_1 \\dots \\rightarrow P_0\\).

#### Banker's Algorithm (Deadlock Avoidance):
Before allocating resources, the OS simulates whether granting the request will leave the system in a **Safe State** where at least one valid execution sequence exists for all processes.
`,
  },
];

export default function DemoPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);

  // Quiz Demo State
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<{ [qId: number]: number }>({});
  const [showExplanation, setShowExplanation] = useState<{ [qId: number]: boolean }>({});
  const [score, setScore] = useState(0);

  // AI Demo State
  const [activeAISample, setActiveAISample] = useState(DEMO_AI_SAMPLES[0]);

  const CBE_ACCOUNT = "1000503206505";
  const CBE_HOLDER = "Nebiyu Mathewos";

  const handleOptionSelect = (qId: number, optIndex: number, isCorrect: boolean) => {
    if (selectedOptions[qId] !== undefined) return; // already answered

    setSelectedOptions((prev) => ({ ...prev, [qId]: optIndex }));
    setShowExplanation((prev) => ({ ...prev, [qId]: true }));

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(CBE_ACCOUNT);
    toast({
      title: "Account Copied!",
      description: `CBE Account ${CBE_ACCOUNT} copied to clipboard.`,
    });
  };

  const currentQuestion = DEMO_QUESTIONS[currentQIndex];
  const answeredCount = Object.keys(selectedOptions).length;
  const isQuizComplete = answeredCount === DEMO_QUESTIONS.length;

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Top Navigation Bar */}
      <header className="border-b border-border/60 bg-card/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-white p-0.5 border border-[#ff6633]/40 shadow-sm overflow-hidden flex items-center justify-center">
                <img src="/wachemo-logo.png" alt="Wachemo" className="h-full w-full object-contain" />
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-foreground">Wachemo CS</span>
                <span className="text-[10px] block text-muted-foreground uppercase font-semibold">Interactive Demo</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2.5">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button variant="outline" size="sm">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button variant="outline" size="sm">
                  Log In
                </Button>
              </Link>
            )}
            <Button
              size="sm"
              onClick={() => setModalOpen(true)}
              className="bg-[#800080] hover:bg-[#6b006b] text-white font-semibold shadow-sm"
            >
              <CreditCard className="h-4 w-4 mr-1.5" />
              Unlock Everything · 50 ETB
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-purple-950 via-navy-950 to-background text-white pt-12 pb-16 px-4">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#800080_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            Live Interactive Platform Demo
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight">
            Computer Science Learning &amp; <span className="bg-gradient-to-r from-purple-400 to-amber-300 bg-clip-text text-transparent">Examination Platform</span>
          </h1>

          <p className="text-sm sm:text-base text-purple-100/80 max-w-2xl mx-auto">
            Test drive our live AI quiz engine, interactive concept explainer, and course curriculum below. Pay only <strong>50 ETB</strong> via CBE to unlock 100% full lifetime access.
          </p>

          <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
            <Button
              size="lg"
              onClick={() => setModalOpen(true)}
              className="bg-[#ff6633] hover:bg-[#e05522] text-white font-bold px-6 shadow-lg shadow-orange-500/20"
            >
              <Zap className="h-4 w-4 mr-2" />
              Pay 50 ETB with CBE & Unlock
            </Button>
            <a href="#interactive-quiz">
              <Button
                variant="outline"
                size="lg"
                className="border-white/20 bg-white/10 hover:bg-white/20 text-white font-semibold"
              >
                Try Interactive Quiz Below <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-12">
        {/* Section 1: Interactive CS AI Quiz Challenge */}
        <section id="interactive-quiz" className="scroll-mt-20 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-600 text-white text-xs">Feature 1</Badge>
                <h2 className="text-2xl font-bold tracking-tight">Interactive AI Quiz Simulator</h2>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Experience instant feedback and AI-generated step-by-step answer explanations.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs text-muted-foreground">Score</span>
                <p className="text-lg font-extrabold text-[#800080] dark:text-purple-400">
                  {score} / {DEMO_QUESTIONS.length}
                </p>
              </div>
              <div className="w-24">
                <Progress value={(answeredCount / DEMO_QUESTIONS.length) * 100} className="h-2" />
              </div>
            </div>
          </div>

          {/* Question Card */}
          <Card className="border-border/80 shadow-md">
            <CardHeader className="bg-muted/30 border-b border-border/40 pb-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-primary" />
                  {currentQuestion.course}
                </span>
                <Badge variant="outline" className="text-xs">
                  {currentQuestion.topic}
                </Badge>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                  {currentQIndex + 1}
                </span>
                <CardTitle className="text-base sm:text-lg font-semibold leading-snug">
                  {currentQuestion.question}
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              {/* Options */}
              <div className="grid grid-cols-1 gap-2.5">
                {currentQuestion.options.map((opt, optIdx) => {
                  const hasAnswered = selectedOptions[currentQuestion.id] !== undefined;
                  const isSelected = selectedOptions[currentQuestion.id] === optIdx;
                  const isCorrect = opt.isCorrect;

                  let btnStyle = "border-border/80 hover:bg-muted/60 text-left justify-start";
                  if (hasAnswered) {
                    if (isCorrect) {
                      btnStyle = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-semibold";
                    } else if (isSelected && !isCorrect) {
                      btnStyle = "border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200";
                    } else {
                      btnStyle = "opacity-60 border-border/40 text-muted-foreground";
                    }
                  }

                  return (
                    <button
                      key={opt.label}
                      type="button"
                      disabled={hasAnswered}
                      onClick={() => handleOptionSelect(currentQuestion.id, optIdx, opt.isCorrect)}
                      className={`w-full p-3.5 rounded-xl border text-sm transition-all flex items-start gap-3 text-left ${btnStyle}`}
                    >
                      <span className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {opt.label}
                      </span>
                      <span className="flex-1">{opt.text}</span>
                      {hasAnswered && isCorrect && (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                      {hasAnswered && isSelected && !isCorrect && (
                        <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* AI Explanation Box */}
              {showExplanation[currentQuestion.id] && (
                <div className="rounded-xl p-4 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 space-y-2 animate-in fade-in duration-300">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#800080] dark:text-purple-300 uppercase tracking-wide">
                    <Brain className="h-4 w-4" /> AI Explanation & Rationale:
                  </div>
                  <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                    {currentQuestion.explanation}
                  </p>
                </div>
              )}

              {/* Question Navigation */}
              <div className="flex items-center justify-between pt-3 border-t border-border/40">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentQIndex === 0}
                  onClick={() => setCurrentQIndex((p) => Math.max(0, p - 1))}
                >
                  Previous
                </Button>

                <div className="flex gap-1.5">
                  {DEMO_QUESTIONS.map((q, idx) => (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQIndex(idx)}
                      className={`w-7 h-7 rounded-full text-xs font-bold transition-all ${
                        currentQIndex === idx
                          ? "bg-[#800080] text-white"
                          : selectedOptions[q.id] !== undefined
                          ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>

                {currentQIndex < DEMO_QUESTIONS.length - 1 ? (
                  <Button
                    size="sm"
                    onClick={() => setCurrentQIndex((p) => Math.min(DEMO_QUESTIONS.length - 1, p + 1))}
                    className="bg-[#800080] hover:bg-[#6b006b] text-white"
                  >
                    Next Question <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setModalOpen(true)}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                  >
                    Unlock Full Quiz Bank · 50 ETB
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quiz Completion Banner */}
          {isQuizComplete && (
            <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/20 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <Award className="h-7 w-7" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">Demo Challenge Complete!</h4>
                  <p className="text-xs text-muted-foreground">
                    You scored <strong>{score} / {DEMO_QUESTIONS.length}</strong>. Unlock 500+ past questions, midterm & final practice quizzes for only 50 ETB.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setModalOpen(true)}
                className="bg-[#800080] hover:bg-[#6b006b] text-white font-bold shrink-0"
              >
                <Zap className="h-4 w-4 mr-1.5" /> Unlock All Quizzes (50 ETB)
              </Button>
            </div>
          )}
        </section>

        {/* Section 2: Interactive AI CS Study Assistant Demo */}
        <section className="space-y-6">
          <div className="border-b border-border/60 pb-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-indigo-600 text-white text-xs">Feature 2</Badge>
              <h2 className="text-2xl font-bold tracking-tight">AI CS Study Assistant & Code Explainer</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Click any computer science topic below to see real-time AI explanations with formatted code and exam notes.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Topic Selectors */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Sample Questions to Ask:
              </span>
              {DEMO_AI_SAMPLES.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => setActiveAISample(sample)}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all space-y-1 ${
                    activeAISample.id === sample.id
                      ? "border-[#800080] bg-purple-50 dark:bg-purple-950/40 shadow-sm"
                      : "border-border/60 bg-card hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">{sample.title}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {sample.course}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">"{sample.prompt}"</p>
                </button>
              ))}

              <div className="p-4 rounded-xl border border-dashed border-border/80 bg-muted/20 text-center space-y-2">
                <Sparkles className="h-5 w-5 text-amber-500 mx-auto" />
                <p className="text-xs font-semibold text-foreground">Ask Unlimited Custom Questions</p>
                <p className="text-[11px] text-muted-foreground">
                  Subscribed students can chat with the AI Study Coach on any slide, assignment, or exam question.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setModalOpen(true)}
                  className="w-full text-xs font-semibold"
                >
                  Unlock AI Study Tutor · 50 ETB
                </Button>
              </div>
            </div>

            {/* AI Response Display */}
            <div className="lg:col-span-2">
              <Card className="border-border/80 shadow-md h-full flex flex-col">
                <CardHeader className="bg-muted/30 border-b border-border/40 py-3.5 px-5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#800080] text-white flex items-center justify-center">
                      <Brain className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-foreground">
                        {activeAISample.title}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {activeAISample.prompt}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5 flex-1 overflow-y-auto max-h-[480px]">
                  <MarkdownRenderer content={activeAISample.content} />
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 3: Curriculum & Materials Showcase */}
        <section className="space-y-6">
          <div className="border-b border-border/60 pb-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-600 text-white text-xs">Feature 3</Badge>
              <h2 className="text-2xl font-bold tracking-tight">Full Wachemo CS Curriculum Bank</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Everything included in the single 50 ETB lifetime activation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
                  <BookOpen className="h-5 w-5" />
                </div>
                <CardTitle className="text-base font-bold">2nd & 3rd Year Courses</CardTitle>
                <CardDescription className="text-xs">
                  All 20+ courses across Semesters I & II with chapter lecture slides, code examples, and structured notes.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
                  <FileText className="h-5 w-5" />
                </div>
                <CardTitle className="text-base font-bold">Past Midterms & Finals</CardTitle>
                <CardDescription className="text-xs">
                  Genuine Wachemo University department examination archives with step-by-step solution breakdowns.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-2">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <CardTitle className="text-base font-bold">Mock Exams & Exit Prep</CardTitle>
                <CardDescription className="text-xs">
                  Timed simulation exams modeling the Ethiopian Higher Education National Exit Exam with weak area analysis.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* Section 4: CBE Payment Box */}
        <section className="rounded-3xl border-2 border-[#800080] bg-gradient-to-br from-purple-900 via-[#5c005c] to-navy-950 text-white p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-3xl mx-auto space-y-6 text-center">
            <Badge className="bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider mx-auto">
              Simple 50 Birr Activation
            </Badge>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ready to Access Everything?
            </h2>

            <p className="text-purple-100/90 text-sm sm:text-base max-w-xl mx-auto">
              Transfer <strong>50 ETB</strong> via CBE Mobile Banking, CBE Birr, or Branch to the official account below:
            </p>

            {/* Bank details card */}
            <div className="max-w-md mx-auto bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5 text-left space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-purple-200">Bank</span>
                <span className="font-bold text-sm text-white">Commercial Bank of Ethiopia (CBE)</span>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-2">
                <span className="text-xs text-purple-200">Account Holder</span>
                <span className="font-bold text-sm text-amber-300">{CBE_HOLDER}</span>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-2">
                <span className="text-xs text-purple-200">Account Number</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-base text-white tracking-wider">
                    {CBE_ACCOUNT}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyAccount}
                    className="h-7 px-2 text-xs bg-white/10 hover:bg-white/20 text-white"
                  >
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-2">
                <span className="text-xs text-purple-200">Fee Amount</span>
                <span className="font-extrabold text-lg text-amber-300">50 ETB</span>
              </div>
            </div>

            <div className="pt-2 flex justify-center gap-3 flex-wrap">
              <Button
                size="lg"
                onClick={() => setModalOpen(true)}
                className="bg-amber-400 hover:bg-amber-500 text-black font-extrabold px-8 shadow-xl shadow-amber-400/20"
              >
                <Zap className="h-5 w-5 mr-2" />
                Submit My CBE Payment Proof
              </Button>
            </div>
          </div>
        </section>
      </main>

      <PaymentModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
