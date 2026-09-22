import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PaymentModal from "@/components/payment/PaymentModal";
import {
  GraduationCap,
  FileText,
  Clock,
  Lock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Brain,
  Zap,
  Upload,
  Layers,
  Database,
  Code,
  Network,
  Cpu,
} from "lucide-react";

interface ExitQuestion {
  id: number;
  course: string;
  yearEC: string;
  question: string;
  options: { label: string; text: string; isCorrect: boolean }[];
  explanation: string;
}

const EXIT_EXAM_SAMPLES: ExitQuestion[] = [
  {
    id: 1,
    course: "Data Structures & Algorithms",
    yearEC: "2016 E.C. Sample",
    question: "What is the worst-case number of comparisons required to search for a key in a sorted array of size 1024 using Binary Search?",
    options: [
      { label: "A", text: "10", isCorrect: false },
      { label: "B", text: "11", isCorrect: true },
      { label: "C", text: "512", isCorrect: false },
      { label: "D", text: "1024", isCorrect: false },
    ],
    explanation: "The maximum number of comparisons for binary search is ⌊log2(n)⌋ + 1. For n = 1024, ⌊log2(1024)⌋ + 1 = 10 + 1 = 11 comparisons.",
  },
  {
    id: 2,
    course: "Computer Networking",
    yearEC: "2015 E.C. Sample",
    question: "An organization is allocated the network address 192.168.10.0/24. If they need to create 6 subnets each supporting at least 25 hosts, what subnet mask should they use?",
    options: [
      { label: "A", text: "/26 (255.255.255.192)", isCorrect: false },
      { label: "B", text: "/27 (255.255.255.224)", isCorrect: true },
      { label: "C", text: "/28 (255.255.255.240)", isCorrect: false },
      { label: "D", text: "/25 (255.255.255.128)", isCorrect: false },
    ],
    explanation: "To create at least 6 subnets, we need 3 bits (2^3 = 8 subnets). The remaining host bits are 32 - (24 + 3) = 5 bits, giving 2^5 - 2 = 30 valid hosts per subnet. The subnet mask becomes /27 (255.255.255.224).",
  },
  {
    id: 3,
    course: "Operating Systems",
    yearEC: "2016 E.C. Sample",
    question: "In virtual memory management, which page replacement anomaly describes a situation where increasing the number of page frames results in an increase in page faults?",
    options: [
      { label: "A", text: "Thrashing Phenomenon", isCorrect: false },
      { label: "B", text: "Bélády's Anomaly (observed in FIFO)", isCorrect: true },
      { label: "C", text: "Dirty Page Penalty", isCorrect: false },
      { label: "D", text: "Priority Inversion", isCorrect: false },
    ],
    explanation: "Bélády's anomaly is the phenomenon in which increasing the number of page frames results in an increase in the number of page faults for certain memory access patterns, notably occurring in FIFO page replacement.",
  },
];

const PREVIOUS_EXAM_YEARS = [
  {
    year: "2017 E.C. National Exit Exam",
    status: "Coming Soon",
    statusDetail: "Curating official examination papers & verified solution keys",
    badgeColor: "bg-amber-500",
    questionsCount: "100 Questions (Full Paper)",
  },
  {
    year: "2016 E.C. National Exit Exam",
    status: "Coming Soon",
    statusDetail: "Uploading question database & AI explanation walkthroughs",
    badgeColor: "bg-amber-500",
    questionsCount: "100 Questions (Full Paper)",
  },
  {
    year: "2015 E.C. National Exit Exam",
    status: "Coming Soon",
    statusDetail: "Digitizing archives & multi-category practice sets",
    badgeColor: "bg-amber-500",
    questionsCount: "100 Questions (Full Paper)",
  },
];

const EXIT_COMPETENCY_AREAS = [
  { name: "Programming & DSA", icon: Code, desc: "C++, Java OOP, Data Structures, Algorithm Design" },
  { name: "Database Systems", icon: Database, desc: "Relational Algebra, SQL Queries, Normalization, Transactions" },
  { name: "Computer Networks", icon: Network, desc: "OSI, TCP/IP, IP Subnetting, Routing Protocols, Security" },
  { name: "Operating Systems", icon: Cpu, desc: "Processes, Memory Paging, Deadlocks, File Storage" },
  { name: "Software Engineering", icon: Layers, desc: "Agile, Requirements, UML, Testing & Quality Assurance" },
  { name: "Computer Architecture", icon: Cpu, desc: "Instruction Set, Pipelining, Cache Memory, ALU" },
];

export default function ExitExamPage() {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: number]: number }>({});
  const [showExplanation, setShowExplanation] = useState<{ [qId: number]: boolean }>({});

  const handleSelect = (qId: number, optIdx: number) => {
    if (selectedAnswers[qId] !== undefined) return;
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optIdx }));
    setShowExplanation((prev) => ({ ...prev, [qId]: true }));
  };

  return (
    <div className="max-w-5xl mx-auto pb-24 lg:pb-8 space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#800080] via-[#5c005c] to-navy-950 text-white p-6 sm:p-10 shadow-xl">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider">
              <GraduationCap className="h-3.5 w-3.5 mr-1" />
              National Exit Exam Hub
            </Badge>
            <span className="text-xs text-purple-200 font-semibold">
              Ministry of Education (MOE) Computer Science Benchmark
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Ethiopian Higher Education National Exit Exam Hub
          </h1>

          <p className="text-sm sm:text-base text-purple-100/90 leading-relaxed">
            Master the 15 core competency courses required for the Ethiopian CS National Exit Exam. Access simulated mock tests, past paper breakdowns, and high-yield topic reviews.
          </p>

          <div className="flex items-center gap-3 pt-2 flex-wrap">
            <Link to="/mock-exams">
              <Button className="bg-[#ff6633] hover:bg-[#e65526] text-white font-bold text-xs sm:text-sm">
                <Brain className="h-4 w-4 mr-1.5" />
                Take Simulated Mock Exit Exam
              </Button>
            </Link>

            <Link to="/gpe-exam">
              <Button variant="outline" className="border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm">
                <ShieldCheck className="h-4 w-4 mr-1.5" />
                Explore GPE Exam Prep
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

      {/* Official Past Papers Notice: Coming Soon */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#800080]" />
              Official Past Exit Exam Archives
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Genuine Ministry of Education national examination archives.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-dashed border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 p-4 sm:p-5 mb-3 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 shrink-0 mt-0.5">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-foreground">
              Official Past Papers are Currently Being Uploaded & Curated!
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Previous years’ national exit exams (2015, 2016, and 2017 E.C.) with full step-by-step verified solutions and AI answer explanations will be published here shortly. Stay tuned!
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PREVIOUS_EXAM_YEARS.map((paper) => (
            <Card key={paper.year} className="border-border/80 shadow-sm relative overflow-hidden bg-card/60">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold">
                    <Clock className="h-3 w-3 mr-1" />
                    {paper.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono font-semibold">
                    {paper.questionsCount}
                  </span>
                </div>
                <CardTitle className="text-base font-bold text-foreground">
                  {paper.year}
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed mt-1">
                  {paper.statusDetail}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="w-full text-xs font-semibold border-border/80 opacity-70"
                >
                  <Lock className="h-3.5 w-3.5 mr-1.5" /> Archive Uploading Soon
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Core Competency Matrix */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-600" />
            15-Course National Competency Matrix
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Key subject areas tested in the Ethiopian CS Exit Examination.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {EXIT_COMPETENCY_AREAS.map((area) => {
            const Icon = area.icon;
            return (
              <Card key={area.name} className="border-border/80 hover:border-purple-500/50 transition-colors">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-[#800080] dark:text-purple-300 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-sm text-foreground">{area.name}</h4>
                    <p className="text-xs text-muted-foreground leading-snug">{area.desc}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Sample Exit Exam Practice Drill */}
      <section className="space-y-4">
        <div className="border-b border-border/60 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Sample Exit Exam Practice Drill
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Practice sample questions aligned with previous national exam standards.
          </p>
        </div>

        <div className="space-y-4">
          {EXIT_EXAM_SAMPLES.map((q, idx) => {
            const hasAnswered = selectedAnswers[q.id] !== undefined;
            const chosenOpt = selectedAnswers[q.id];

            return (
              <Card key={q.id} className="border-border/80 shadow-sm">
                <CardHeader className="py-3 px-5 bg-muted/20 border-b border-border/40">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-primary">Question {idx + 1} · {q.course}</span>
                    <Badge variant="outline" className="text-[11px]">{q.yearEC}</Badge>
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
                    <div className="rounded-xl p-3.5 bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 text-xs text-foreground/90 space-y-1 animate-in fade-in">
                      <span className="font-bold text-[#800080] dark:text-purple-300 uppercase tracking-wider block">
                        Verified Explanation:
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

      {/* Unlock Banner */}
      <section className="rounded-2xl border border-purple-300 dark:border-purple-800 bg-gradient-to-r from-purple-50 via-indigo-50 to-amber-50 dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-amber-950/30 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-foreground">
            Get Full Access to Exit Exam & GPE Question Banks
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Early bird promotional price: <strong>50 ETB</strong> until September 30, 2026 (Regular: 100 ETB).
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
