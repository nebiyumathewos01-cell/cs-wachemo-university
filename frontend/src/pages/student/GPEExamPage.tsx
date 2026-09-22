import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import PaymentModal from "@/components/payment/PaymentModal";
import {
  GraduationCap,
  Brain,
  CheckCircle2,
  XCircle,
  Zap,
  Target,
  ShieldCheck,
  Calculator,
  Binary,
  Layers,
  FileCode,
} from "lucide-react";

interface GPEQuestion {
  id: number;
  domain: string;
  question: string;
  options: { label: string; text: string; isCorrect: boolean }[];
  explanation: string;
}

const GPE_SAMPLE_QUESTIONS: GPEQuestion[] = [
  {
    id: 1,
    domain: "Algorithms & Problem Solving",
    question: "Given a recurrence relation T(n) = 2T(n/2) + O(n), what is the tight asymptotic time complexity according to the Master Theorem?",
    options: [
      { label: "A", text: "O(n)", isCorrect: false },
      { label: "B", text: "O(n log n)", isCorrect: true },
      { label: "C", text: "O(n^2)", isCorrect: false },
      { label: "D", text: "O(log n)", isCorrect: false },
    ],
    explanation: "Here a = 2, b = 2, and f(n) = O(n). Since log_b(a) = log_2(2) = 1, f(n) = Θ(n^{log_b a}) = Θ(n). This falls under Master Theorem Case 2, giving T(n) = Θ(n log n). This is the standard recurrence for MergeSort.",
  },
  {
    id: 2,
    domain: "Operating Systems & Concurrency",
    question: "Which CPU scheduling algorithm is non-preemptive and minimizes the average waiting time for a given set of stationary processes?",
    options: [
      { label: "A", text: "First-Come, First-Served (FCFS)", isCorrect: false },
      { label: "B", text: "Shortest Job First (SJF)", isCorrect: true },
      { label: "C", text: "Round Robin (RR)", isCorrect: false },
      { label: "D", text: "Priority Scheduling (Preemptive)", isCorrect: false },
    ],
    explanation: "Shortest Job First (SJF) is provably optimal in terms of minimizing average waiting time because scheduling shorter jobs first reduces the waiting time experienced by all subsequent jobs in the queue.",
  },
  {
    id: 3,
    domain: "Database Systems & Architecture",
    question: "A relation R(A, B, C, D) has candidate key {A, B} and functional dependency C -> D. If no key attributes depend on non-key attributes, in which normal form is R?",
    options: [
      { label: "A", text: "Not in 1NF", isCorrect: false },
      { label: "B", text: "1NF only", isCorrect: false },
      { label: "C", text: "2NF only", isCorrect: true },
      { label: "D", text: "3NF and BCNF", isCorrect: false },
    ],
    explanation: "Since all non-prime attributes {C, D} depend fully on the candidate key {A, B}, R is in 2NF. However, the transitive dependency C -> D (where C is not a superkey) violates 3NF. Therefore, R is in 2NF only.",
  },
  {
    id: 4,
    domain: "Software Engineering & Architecture",
    question: "Which Gang of Four (GoF) design pattern ensures a class has only one instance while providing a global point of access to it?",
    options: [
      { label: "A", text: "Factory Method Pattern", isCorrect: false },
      { label: "B", text: "Observer Pattern", isCorrect: false },
      { label: "C", text: "Singleton Pattern", isCorrect: true },
      { label: "D", text: "Adapter Pattern", isCorrect: false },
    ],
    explanation: "The Singleton Pattern restricts the instantiation of a class to one single object by making the constructor private and providing a static getInstance() method.",
  },
];

const GPE_CORE_DOMAINS = [
  {
    title: "1. Core Programming & DSA",
    weight: "25%",
    icon: Binary,
    topics: "C++, Java OOP, Recursion, Trees, Graphs, Sorting, Hashing, Dynamic Programming, Complexity Analysis",
  },
  {
    title: "2. Systems, OS & Architecture",
    weight: "20%",
    icon: Layers,
    topics: "CPU Scheduling, Memory Paging, Deadlocks, File Systems, Digital Logic, Assembly & Microprocessing",
  },
  {
    title: "3. Database & Information Systems",
    weight: "20%",
    icon: FileCode,
    topics: "Relational Algebra, SQL DDL/DML, Normalization (1NF-BCNF), Indexing, Concurrency (2PL, ACID)",
  },
  {
    title: "4. Computer Networks & Security",
    weight: "15%",
    icon: ShieldCheck,
    topics: "OSI/TCP-IP, IPv4/IPv6 Subnetting, Routing (OSPF/BGP), TCP Flow Control, Cryptography Basics",
  },
  {
    title: "5. Software Engineering & Math",
    weight: "20%",
    icon: Calculator,
    topics: "SDLC & Agile Scrum, UML Modeling, Testing, Discrete Math, Propositional Logic, Probability",
  },
];

export default function GPEExamPage() {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: number]: number }>({});
  const [showExplanation, setShowExplanation] = useState<{ [qId: number]: boolean }>({});

  const handleSelect = (qId: number, optIdx: number) => {
    if (selectedAnswers[qId] !== undefined) return;
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optIdx }));
    setShowExplanation((prev) => ({ ...prev, [qId]: true }));
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const correctCount = GPE_SAMPLE_QUESTIONS.filter(
    (q) => selectedAnswers[q.id] !== undefined && q.options[selectedAnswers[q.id]].isCorrect
  ).length;

  return (
    <div className="max-w-5xl mx-auto pb-24 lg:pb-8 space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-navy-950 text-white p-6 sm:p-10 shadow-xl">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider">
              <GraduationCap className="h-3.5 w-3.5 mr-1" />
              Graduate Profile Exam (GPE)
            </Badge>
            <span className="text-xs text-purple-200 font-semibold">
              Essential Assessment for CS University Graduates
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            GPE Exam Preparation & Competency Mastery
          </h1>

          <p className="text-sm sm:text-base text-purple-100/80 leading-relaxed">
            Prepare for the Graduate Profile Exam (GPE) with curated practice questions, analytical problem-solving drills, and subject-wise reviews mapped to Ethiopian Higher Education CS standards.
          </p>

          <div className="flex items-center gap-3 pt-2 flex-wrap">
            <Link to="/quizzes">
              <Button className="bg-[#ff6633] hover:bg-[#e65526] text-white font-bold text-xs sm:text-sm">
                <Brain className="h-4 w-4 mr-1.5" />
                Launch Full GPE AI Quiz
              </Button>
            </Link>

            <Link to="/exit-exam">
              <Button variant="outline" className="border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm">
                <Target className="h-4 w-4 mr-1.5" />
                View National Exit Exam Hub
              </Button>
            </Link>

            {!user?.is_paid && (
              <Button
                variant="outline"
                onClick={() => setModalOpen(true)}
                className="border-amber-400/40 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 text-xs sm:text-sm font-semibold"
              >
                <Zap className="h-4 w-4 mr-1.5" />
                Unlock Everything · 50 ETB
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* GPE Competency Blueprint Breakdown */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Target className="h-5 w-5 text-indigo-600" />
            GPE Exam Blueprint & Topic Weightage
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Key areas evaluated to assess graduate readiness in Computer Science.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {GPE_CORE_DOMAINS.map((domain) => {
            const Icon = domain.icon;
            return (
              <Card key={domain.title} className="border-border/80 shadow-sm hover:border-indigo-500/50 transition-colors">
                <CardHeader className="pb-2.5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="text-xs font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-50/50">
                      {domain.weight}
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-bold text-foreground">{domain.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground leading-relaxed">
                  {domain.topics}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Interactive GPE Practice Quiz */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Interactive GPE Competency Drill
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Test your foundational knowledge across key graduate profile domains.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-muted-foreground">
              Score: <strong className="text-purple-600">{correctCount}</strong> / {GPE_SAMPLE_QUESTIONS.length}
            </span>
            <div className="w-20">
              <Progress value={(answeredCount / GPE_SAMPLE_QUESTIONS.length) * 100} className="h-2" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {GPE_SAMPLE_QUESTIONS.map((q, idx) => {
            const hasAnswered = selectedAnswers[q.id] !== undefined;
            const chosenOpt = selectedAnswers[q.id];

            return (
              <Card key={q.id} className="border-border/80 shadow-sm">
                <CardHeader className="py-3.5 px-5 bg-muted/20 border-b border-border/40">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-primary">Question {idx + 1}</span>
                    <Badge variant="outline" className="text-[11px]">{q.domain}</Badge>
                  </div>
                  <CardTitle className="text-sm sm:text-base font-semibold text-foreground">
                    {q.question}
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-5 space-y-3">
                  <div className="grid grid-cols-1 gap-2">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = chosenOpt === optIdx;
                      const isCorrect = opt.isCorrect;

                      let style = "border-border/70 hover:bg-muted/50 text-foreground";
                      if (hasAnswered) {
                        if (isCorrect) {
                          style = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold";
                        } else if (isSelected && !isCorrect) {
                          style = "border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200";
                        } else {
                          style = "opacity-50 border-border/40 text-muted-foreground";
                        }
                      }

                      return (
                        <button
                          key={opt.label}
                          type="button"
                          disabled={hasAnswered}
                          onClick={() => handleSelect(q.id, optIdx)}
                          className={`w-full p-3 rounded-xl border text-xs sm:text-sm text-left transition-all flex items-start gap-3 ${style}`}
                        >
                          <span className="w-5 h-5 rounded bg-muted flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            {opt.label}
                          </span>
                          <span className="flex-1">{opt.text}</span>
                          {hasAnswered && isCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
                          {hasAnswered && isSelected && !isCorrect && <XCircle className="h-4 w-4 text-rose-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {showExplanation[q.id] && (
                    <div className="rounded-xl p-3.5 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 text-xs text-foreground/90 space-y-1 animate-in fade-in">
                      <span className="font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider block">
                        Detailed Explanation:
                      </span>
                      <p className="leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Action CTA */}
      <section className="rounded-2xl border border-purple-300 dark:border-purple-800 bg-gradient-to-r from-purple-50 via-indigo-50 to-amber-50 dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-amber-950/30 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-foreground">
            Want Full GPE & Exit Exam Question Bank Access?
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Unlock 500+ past exam questions, mock tests, and 24/7 AI tutor for only <strong>50 ETB</strong> via CBE.
          </p>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          className="bg-[#800080] hover:bg-[#6b006b] text-white font-bold shrink-0 shadow-sm"
        >
          <Zap className="h-4 w-4 mr-1.5" /> Pay 50 ETB with CBE
        </Button>
      </section>

      <PaymentModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
