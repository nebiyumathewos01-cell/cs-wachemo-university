import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  Send,
  Trash2,
  Sparkles,
  Lock,
  Globe,
  Filter,
  Check,
  HelpCircle,
  Lightbulb,
  Bug,
  BookOpen
} from "lucide-react";
import { commentsApi } from "@/api/comments";
import type { Comment } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/utils";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import { TableSkeleton } from "@/components/common/Skeleton";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useToast } from "@/hooks/useToast";

const CATEGORIES = [
  { id: "all", label: "All Categories", icon: Filter },
  { id: "Question", label: "Questions", icon: HelpCircle },
  { id: "Material Request", label: "Material Requests", icon: BookOpen },
  { id: "Suggestion", label: "Suggestions", icon: Lightbulb },
  { id: "Bug", label: "Bug Reports", icon: Bug },
  { id: "General", label: "General", icon: MessageSquare },
];

export default function AdminCommentsPage() {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [resolvedCount, setResolvedCount] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "replied" | "resolved">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Reply state
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  // Delete dialog
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await commentsApi.getComments({
        page,
        status_filter: statusFilter === "all" ? undefined : statusFilter,
        category: categoryFilter === "all" ? undefined : categoryFilter,
        search: search || undefined,
      });
      setComments(res.data.items);
      setTotal(res.data.total);
      setPendingCount(res.data.pending_count);
      setResolvedCount(res.data.resolved_count);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load student feedback & comments.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, categoryFilter, search, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleSendReply = async (commentId: number) => {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      const res = await commentsApi.replyComment(commentId, replyText);
      toast({
        title: "Reply Sent!",
        description: "Your answer has been delivered to the student.",
      });
      setComments(prev =>
        prev.map(c => (c.id === commentId ? { ...c, admin_reply: res.data.admin_reply, replied_at: res.data.replied_at, replied_by_name: res.data.replied_by_name } : c))
      );
      setReplyingId(null);
      setReplyText("");
      setPendingCount(prev => Math.max(0, prev - 1));
    } catch {
      toast({
        title: "Failed to send reply",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleToggleResolve = async (comment: Comment) => {
    try {
      const nextStatus = !comment.is_resolved;
      await commentsApi.updateComment(comment.id, { is_resolved: nextStatus });
      setComments(prev =>
        prev.map(c => (c.id === comment.id ? { ...c, is_resolved: nextStatus } : c))
      );
      setResolvedCount(prev => (nextStatus ? prev + 1 : Math.max(0, prev - 1)));
      toast({
        title: nextStatus ? "Marked as Resolved" : "Reopened",
        description: `Comment #${comment.id} updated.`,
      });
    } catch {
      toast({
        title: "Action failed",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await commentsApi.deleteComment(deleteId);
      setComments(prev => prev.filter(c => c.id !== deleteId));
      setTotal(prev => Math.max(0, prev - 1));
      toast({
        title: "Comment Deleted",
        description: "The feedback item was removed.",
      });
      setDeleteId(null);
    } catch {
      toast({
        title: "Failed to delete",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "Question":
        return <Badge className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30 gap-1"><HelpCircle className="h-3 w-3" /> Question</Badge>;
      case "Material Request":
        return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1"><BookOpen className="h-3 w-3" /> Material Request</Badge>;
      case "Suggestion":
        return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1"><Lightbulb className="h-3 w-3" /> Suggestion</Badge>;
      case "Bug":
        return <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 gap-1"><Bug className="h-3 w-3" /> Bug Report</Badge>;
      default:
        return <Badge variant="secondary" className="gap-1"><MessageSquare className="h-3 w-3" /> General</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Student Comments & Feedback Session"
        description="View questions, suggestions, and feedback sent by students and reply directly."
        icon={MessageSquare}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border flex items-center gap-3.5 shadow-xs">
          <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xs text-muted-foreground uppercase tracking-wider font-semibold">Total Submissions</p>
            <p className="text-2xl font-black text-foreground">{total}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border flex items-center gap-3.5 shadow-xs">
          <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xs text-muted-foreground uppercase tracking-wider font-semibold">Awaiting Reply</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{pendingCount}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border flex items-center gap-3.5 shadow-xs">
          <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xs text-muted-foreground uppercase tracking-wider font-semibold">Resolved</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{resolvedCount}</p>
          </div>
        </div>
      </div>

      {/* Controls: Search and Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="flex gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search feedback, student name, email..."
              className="pl-9"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button variant="outline" onClick={handleSearch}>Search</Button>
          {search && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearch("");
                setSearchInput("");
                setPage(1);
              }}
            >
              Reset
            </Button>
          )}
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: "all", label: "All" },
            { id: "pending", label: "Needs Reply" },
            { id: "replied", label: "Answered" },
            { id: "resolved", label: "Resolved" },
          ].map(st => (
            <button
              key={st.id}
              onClick={() => {
                setStatusFilter(st.id as any);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                statusFilter === st.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {CATEGORIES.map(c => {
          const Icon = c.icon;
          return (
            <button
              key={c.id}
              onClick={() => {
                setCategoryFilter(c.id);
                setPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
                categoryFilter === c.id
                  ? "bg-foreground text-background font-semibold"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3 w-3" />
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Comments List */}
      {loading ? (
        <TableSkeleton />
      ) : comments.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title={search ? "No matching comments found" : "No feedback or comments yet"}
          description="Student comments, questions, and feedback will show up here."
        />
      ) : (
        <div className="space-y-4">
          {comments.map(comment => {
            const isReplying = replyingId === comment.id;
            return (
              <Card
                key={comment.id}
                className={`overflow-hidden transition-all duration-200 border ${
                  comment.is_resolved
                    ? "bg-card/60 opacity-80 border-border"
                    : !comment.admin_reply
                    ? "border-amber-500/40 bg-card shadow-xs"
                    : "border-border bg-card"
                }`}
              >
                <CardContent className="p-5 space-y-4">
                  {/* Top Bar */}
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {comment.user?.full_name?.charAt(0).toUpperCase() || "S"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">
                            {comment.user?.full_name || "Anonymous Student"}
                          </span>
                          {comment.is_private ? (
                            <Badge variant="outline" className="text-2xs text-muted-foreground gap-1 border-border">
                              <Lock className="h-2.5 w-2.5" /> Private
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-2xs text-muted-foreground gap-1 border-border">
                              <Globe className="h-2.5 w-2.5" /> Public
                            </Badge>
                          )}
                        </div>
                        <p className="text-2xs text-muted-foreground mt-0.5">
                          {comment.user?.email} · {formatDate(comment.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getCategoryBadge(comment.category)}
                      {comment.is_resolved ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 text-2xs">
                          <Check className="h-3 w-3" /> Resolved
                        </Badge>
                      ) : !comment.admin_reply ? (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 text-2xs">
                          <Clock className="h-3 w-3" /> Needs Reply
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 gap-1 text-2xs">
                          <CheckCircle2 className="h-3 w-3" /> Answered
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Title & Body */}
                  <div className="space-y-1.5 pl-0 sm:pl-12">
                    {comment.title && (
                      <h4 className="font-bold text-base text-foreground leading-snug">
                        {comment.title}
                      </h4>
                    )}
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                      {comment.content}
                    </p>
                  </div>

                  {/* Admin Reply Display */}
                  {comment.admin_reply && !isReplying && (
                    <div className="sm:ml-12 p-4 rounded-xl bg-slate-100 dark:bg-[#181d24] border border-slate-200 dark:border-[#2f3744] space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-[#ff6633]" />
                          <span className="text-xs font-bold text-[#ff6633]">
                            Reply by {comment.replied_by_name || "Admin (Neba)"}
                          </span>
                        </div>
                        {comment.replied_at && (
                          <span className="text-2xs text-muted-foreground font-mono">
                            {formatDate(comment.replied_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                        {comment.admin_reply}
                      </p>
                    </div>
                  )}

                  {/* Reply Editor */}
                  {isReplying && (
                    <div className="sm:ml-12 p-4 rounded-xl bg-slate-100 dark:bg-[#181d24] border border-[#ff6633]/40 space-y-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-[#ff6633]" />
                        <span className="text-xs font-bold text-foreground">
                          {comment.admin_reply ? "Edit Reply to Student" : "Write Reply as Neba (Admin)"}
                        </span>
                      </div>
                      <Textarea
                        rows={3}
                        placeholder="Type your answer, guidance, or resolution for the student..."
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        className="bg-card text-sm"
                        autoFocus
                      />
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setReplyingId(null);
                            setReplyText("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="bg-[#ff6633] hover:bg-[#e65526] text-white gap-1.5"
                          disabled={submittingReply || !replyText.trim()}
                          onClick={() => handleSendReply(comment.id)}
                        >
                          <Send className="h-3.5 w-3.5" />
                          {submittingReply ? "Sending..." : "Send Reply"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="sm:ml-12 pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      {!isReplying && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 text-xs text-primary hover:bg-primary-subtle border-primary/30"
                          onClick={() => {
                            setReplyingId(comment.id);
                            setReplyText(comment.admin_reply || "");
                          }}
                        >
                          <Send className="h-3 w-3" />
                          {comment.admin_reply ? "Edit Reply" : "Reply to Student"}
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 gap-1.5 text-xs ${
                          comment.is_resolved
                            ? "text-amber-600 hover:text-amber-700"
                            : "text-emerald-600 hover:text-emerald-700"
                        }`}
                        onClick={() => handleToggleResolve(comment)}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {comment.is_resolved ? "Reopen" : "Mark Resolved"}
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1"
                      onClick={() => setDeleteId(comment.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open: boolean) => {
          if (!open) setDeleteId(null);
        }}
        title="Delete Comment / Feedback?"
        description="Are you sure you want to permanently delete this submission? This action cannot be undone."
        confirmLabel={isDeleting ? "Deleting..." : "Delete Permanently"}
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
