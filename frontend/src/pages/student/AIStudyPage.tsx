import { useEffect, useRef, useState } from "react";
import { Brain, Send, AlertCircle, User, Trash2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { academicApi, coursesApi, chaptersApi } from "@/api/academic";
import { aiApi } from "@/api/ai";
import type { AcademicYear, Semester, Course, Chapter } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn, formatRelativeTime } from "@/utils";
import MarkdownRenderer from "@/components/common/MarkdownRenderer";
import PageHeader from "@/components/common/PageHeader";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  "Explain this topic simply",
  "Give me an example",
  "Key exam questions",
  "Summarize the chapter"
];

export default function AIStudyPage() {
  const [params] = useSearchParams();
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  
  const [selYear, setSelYear] = useState("");
  const [selSem, setSelSem] = useState("");
  const [selCourse, setSelCourse] = useState(params.get("course") ?? "");
  const [selChapter, setSelChapter] = useState(params.get("chapter") ?? "");
  
  const [contextCollapsed, setContextCollapsed] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { academicApi.getYears().then(r => setYears(r.data)); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (selYear && selSem && selCourse && selChapter) {
      setContextCollapsed(true);
    } else {
      setContextCollapsed(false);
    }
  }, [selYear, selSem, selCourse, selChapter]);

  const onYearChange = async (v: string) => {
    setSelYear(v); setSelSem(""); setSelCourse(""); setSelChapter("");
    const [s, c] = await Promise.all([
      academicApi.getSemesters(Number(v)),
      coursesApi.getCourses({ academic_year_id: Number(v), per_page: 100 } as Parameters<typeof coursesApi.getCourses>[0]),
    ]);
    setSemesters(s.data); setCourses(c.data.items); setChapters([]);
  };

  const onSemChange = async (v: string) => {
    setSelSem(v); setSelCourse(""); setSelChapter("");
    const r = await coursesApi.getCourses({ academic_year_id: Number(selYear), semester_id: Number(v), per_page: 100 } as Parameters<typeof coursesApi.getCourses>[0]);
    setCourses(r.data.items); setChapters([]);
  };

  const onCourseChange = async (v: string) => {
    setSelCourse(v); setSelChapter("");
    const r = await chaptersApi.getChapters(Number(v));
    setChapters(r.data);
  };

  const isReady = selYear && selCourse && selChapter;

  const handleSend = async (overrideInput?: string) => {
    const q = (overrideInput ?? input).trim();
    if (!q || !isReady || loading) return;

    if (!overrideInput) setInput("");
    setError("");
    const userMsg: Message = { role: "user", content: q, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await aiApi.askStudyAssistant({
        academic_year_id: Number(selYear),
        course_id: Number(selCourse),
        chapter_id: Number(selChapter),
        question: q,
      });
      const aiMsg: Message = { role: "assistant", content: res.data.answer, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setError("Unable to get a response right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleClearChat = () => {
    setMessages([]);
    setError("");
  };

  const selectedYearName = years.find(y => y.id === Number(selYear))?.name;
  const selectedCourseName = courses.find(c => c.id === Number(selCourse))?.name;
  const selectedChapterName = chapters.find(c => c.id === Number(selChapter))?.title;

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)] pb-20 lg:pb-0">
      {/* Header */}
      <div className="mb-4 shrink-0 flex items-center justify-between">
        <PageHeader 
          title="AI Study Assistant" 
          description="Ask questions about your Computer Science courses." 
          icon={Brain} 
        />
        {messages.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleClearChat} className="gap-2">
            <Trash2 className="h-4 w-4" /> Clear Chat
          </Button>
        )}
      </div>

      {/* Context selectors */}
      <Card className="mb-4 shrink-0">
        <CardContent className="p-4">
          {contextCollapsed ? (
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <span>{selectedYearName}</span> <span className="text-xs">&gt;</span> 
                <span>{selectedCourseName}</span> <span className="text-xs">&gt;</span> 
                <span className="text-foreground">{selectedChapterName}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setContextCollapsed(false)}>Change</Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Year</Label>
                <Select value={selYear} onValueChange={onYearChange}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Year" /></SelectTrigger>
                  <SelectContent>
                    {years.filter(y => y.is_available).map(y => (
                      <SelectItem key={y.id} value={String(y.id)}>{y.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Semester</Label>
                <Select value={selSem} onValueChange={onSemChange} disabled={!selYear}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Semester" /></SelectTrigger>
                  <SelectContent>
                    {semesters.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Course</Label>
                <Select value={selCourse} onValueChange={onCourseChange} disabled={!selSem}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Course" /></SelectTrigger>
                  <SelectContent>
                    {courses.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Chapter</Label>
                <Select value={selChapter} onValueChange={setSelChapter} disabled={!selCourse}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Chapter" /></SelectTrigger>
                  <SelectContent>
                    {chapters.map(c => <SelectItem key={c.id} value={String(c.id)}>Ch.{c.number} {c.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Brain className="h-12 w-12 mb-3 opacity-20" />
            <p className="font-medium">Start a conversation</p>
            <p className="text-sm mt-1 max-w-xs mb-6">
              {isReady
                ? 'Ask anything about this chapter — "What is recursion?", "Explain this concept simply."'
                : "Select a year, course, and chapter above first."}
            </p>
            {isReady && (
              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                {SUGGESTED_PROMPTS.map(prompt => (
                  <Button 
                    key={prompt} 
                    variant="outline" 
                    size="sm" 
                    className="rounded-full text-xs"
                    onClick={() => handleSend(prompt)}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-1",
              msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-primary-subtle text-primary"
            )}>
              {msg.role === "user" ? <User className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
            </div>
            <div className={cn(
              "max-w-[85%] flex flex-col gap-1",
              msg.role === "user" ? "items-end" : "items-start"
            )}>
              <div className={cn(
                "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-none"
                  : "bg-surface border border-border text-foreground rounded-tl-none"
              )}>
                {msg.role === "assistant" ? (
                  <MarkdownRenderer content={msg.content} className="text-sm" />
                ) : (
                  msg.content
                )}
              </div>
              <span className="text-[10px] text-muted-foreground px-1">
                {formatRelativeTime(msg.timestamp.toISOString())}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-primary-subtle text-primary flex items-center justify-center shrink-0 mt-1">
              <Brain className="h-4 w-4" />
            </div>
            <div className="bg-surface border border-border rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm text-muted-foreground">Thinking…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-destructive-subtle text-destructive text-xs mb-2 shrink-0">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />{error}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 shrink-0">
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isReady ? "Ask a question… (Enter to send, Shift+Enter for new line)" : "Select a chapter first…"}
          disabled={!isReady || loading}
          rows={2}
          className="resize-none text-sm bg-surface"
        />
        <Button
          size="icon"
          className="h-auto w-12 shrink-0"
          onClick={() => handleSend()}
          disabled={!isReady || !input.trim() || loading}
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
