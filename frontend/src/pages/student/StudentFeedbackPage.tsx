import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Send,
  Sparkles,
  HelpCircle,
  Lightbulb,
  BookOpen,
  Bug,
  Lock,
  CheckCircle2,
  Clock,
  Plus
} from "lucide-react";
import { commentsApi } from "@/api/comments";
import type { Comment } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/utils";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import { TableSkeleton } from "@/components/common/Skeleton";
import { useToast } from "@/hooks/useToast";

const CATEGORIES = [
  { id: "General", label: "General Feedback", icon: MessageSquare, desc: "General thoughts or questions" },
  { id: "Question", label: "Academic Question", icon: HelpCircle, desc: "Ask about course materials or exams" },
  { id: "Material Request", label: "Material Request", icon: BookOpen, desc: "Request slides, notes, or past papers" },
  { id: "Suggestion", label: "Suggestion / Feature", icon: Lightbulb, desc: "Suggest ideas to improve the platform" },
  { id: "Bug", label: "Bug Report", icon: Bug, desc: "Report issues or broken links" },
];

export default function StudentFeedbackPage() {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await commentsApi.getComments();
      setComments(res.data.items);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load feedback session.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      const res = await commentsApi.createComment({
        title: title.trim() || undefined,
        content: content.trim(),
        category,
        is_private: true,
      });

      toast({
        title: "Message Sent to Admin!",
        description: "Your question/feedback was sent directly to Admin. You will see the answer here.",
      });

      setComments(prev => [res.data, ...prev]);
      setTitle("");
      setContent("");
      setCategory("General");
      setShowForm(false);
    } catch (err: any) {
      console.error("Failed to send comment:", err);
      const msg = err?.response?.data?.detail || "Please check your network and try again.";
      toast({
        title: "Failed to send message",
        description: typeof msg === "string" ? msg : JSON.stringify(msg),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "Question":
        return <Badge className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30 gap-1 text-2xs"><HelpCircle className="h-3 w-3" /> Question</Badge>;
      case "Material Request":
        return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 text-2xs"><BookOpen className="h-3 w-3" /> Material Request</Badge>;
      case "Suggestion":
        return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 text-2xs"><Lightbulb className="h-3 w-3" /> Suggestion</Badge>;
      case "Bug":
        return <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 gap-1 text-2xs"><Bug className="h-3 w-3" /> Bug Report</Badge>;
      default:
        return <Badge variant="secondary" className="gap-1 text-2xs"><MessageSquare className="h-3 w-3" /> General</Badge>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Direct Feedback & Help with Admin"
          description="Send messages, questions, or material requests directly to Admin. Your submissions are private and only visible to you and Admin."
          icon={MessageSquare}
        />
        <Button
          onClick={() => setShowForm(v => !v)}
          className="bg-[#ff6633] hover:bg-[#e65526] text-white font-bold gap-2 shrink-0 shadow-md shadow-[#ff6633]/20"
        >
          <Plus className="h-4 w-4" />
          {showForm ? "Close Form" : "Send to Admin"}
        </Button>
      </div>

      {/* Info Notice Banner */}
      <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-[#161a1f] border border-slate-200 dark:border-[#222831] flex items-center gap-3 text-xs text-muted-foreground">
        <Lock className="h-4 w-4 text-[#ff6633] shrink-0" />
        <span>
          <strong>Private Communication:</strong> All questions, requests, and feedback submitted here are sent directly to <strong>Admin</strong> and are not visible to other students.
        </span>
      </div>

      {/* New Comment Form Drawer/Card */}
      {showForm && (
        <Card className="border-[#ff6633]/40 shadow-md animate-fade-up bg-card">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Sparkles className="h-4 w-4 text-[#ff6633]" />
                <h3 className="font-bold text-sm text-foreground">
                  Send Direct Message to Admin
                </h3>
              </div>

              {/* Category selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Category</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map(c => {
                    const Icon = c.icon;
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => setCategory(c.id)}
                        className={`p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition-all ${
                          category === c.id
                            ? "border-[#ff6633] bg-[#ff6633]/10 text-foreground font-semibold"
                            : "border-border bg-card/50 text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                        }`}
                      >
                        <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${category === c.id ? "text-[#ff6633]" : "text-muted-foreground"}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs leading-tight font-medium">{c.label}</p>
                          <p className="text-3xs text-muted-foreground leading-tight mt-0.5 truncate">{c.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-semibold text-foreground">
                  Subject / Topic (Optional)
                </Label>
                <Input
                  id="title"
                  placeholder="e.g. Operating Systems Chapter 4 Slides Request"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="text-sm"
                />
              </div>

              {/* Content */}
              <div className="space-y-1.5">
                <Label htmlFor="content" className="text-xs font-semibold text-foreground">
                  Your Message / Question <span className="text-[#ff6633]">*</span>
                </Label>
                <Textarea
                  id="content"
                  rows={4}
                  required
                  placeholder="Write your thoughts, request, or question here in detail..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="text-sm"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !content.trim()}
                  className="bg-[#ff6633] hover:bg-[#e65526] text-white font-bold gap-2 text-xs"
                >
                  <Send className="h-3.5 w-3.5" />
                  {submitting ? "Sending..." : "Send to Admin"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Feed */}
      {loading ? (
        <TableSkeleton />
      ) : comments.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No inquiries sent yet"
          description="Click 'Send to Admin' above to ask a question, request materials, or send feedback. Admin will reply directly to you here!"
        />
      ) : (
        <div className="space-y-4">
          {comments.map(comment => (
            <Card key={comment.id} className="border border-border bg-card shadow-xs">
              <CardContent className="p-5 space-y-3.5">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                      {comment.user?.full_name?.charAt(0).toUpperCase() || "S"}
                    </div>
                    <div>
                      <span className="font-semibold text-xs text-foreground">
                        {comment.user?.full_name || "Student"}
                      </span>
                      <p className="text-3xs text-muted-foreground font-mono">
                        {formatDate(comment.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getCategoryBadge(comment.category)}
                    {comment.is_private && (
                      <Badge variant="outline" className="text-3xs text-muted-foreground gap-1 border-border">
                        <Lock className="h-2.5 w-2.5" /> Private
                      </Badge>
                    )}
                    {comment.admin_reply ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 text-3xs">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Answered
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 text-3xs">
                        <Clock className="h-2.5 w-2.5" /> Under Review
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Question/Comment Body */}
                <div className="space-y-1">
                  {comment.title && (
                    <h4 className="font-bold text-sm text-foreground">
                      {comment.title}
                    </h4>
                  )}
                  <p className="text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {comment.content}
                  </p>
                </div>

                {/* Admin Reply Box */}
                {comment.admin_reply && (
                  <div className="mt-3 p-3.5 rounded-xl bg-slate-100 dark:bg-[#181d24] border-l-4 border-l-[#ff6633] border-slate-200 dark:border-[#2f3744] space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-[#ff6633]" />
                        <span className="text-xs font-bold text-[#ff6633]">
                          Response from {comment.replied_by_name || "Admin (Neba)"}
                        </span>
                      </div>
                      {comment.replied_at && (
                        <span className="text-3xs text-muted-foreground font-mono">
                          {formatDate(comment.replied_at)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                      {comment.admin_reply}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
