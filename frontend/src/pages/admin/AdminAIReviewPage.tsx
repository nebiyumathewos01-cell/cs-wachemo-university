import { useEffect, useState, useMemo } from "react";
import { Sparkles, CheckCircle2, XCircle, AlertCircle, Clock, Zap, Activity, Timer } from "lucide-react";
import { adminApi } from "@/api/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/utils";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import EmptyState from "@/components/common/EmptyState";
import { TableSkeleton } from "@/components/common/Skeleton";

interface AILog {
  id: number;
  student_id: number | null;
  quiz_id: number | null;
  questions_requested: number;
  questions_generated: number;
  questions_validated: number;
  status: string;
  error_message: string | null;
  duration_seconds: number | null;
  created_at: string;
}

export default function AdminAIReviewPage() {
  const [logs, setLogs] = useState<AILog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const load = async (p: number) => {
    setLoading(true);
    try {
      const r = await adminApi.getAiLogs({ page: p });
      setLogs(r.data.items);
      setTotal(r.data.total);
    } catch { setError("Failed to load AI generation logs."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(page); }, [page]);

  const statusBadge = (status: string) => {
    if (status === "success") return <Badge className="bg-success-subtle text-success border-success text-xs">Success</Badge>;
    if (status === "failed") return <Badge className="bg-destructive-subtle text-destructive border-destructive text-xs">Failed</Badge>;
    return <Badge variant="secondary" className="text-xs">{status}</Badge>;
  };

  const totalPages = Math.max(1, Math.ceil(total / 20));

  // Compute stats from current page logs
  const successCount = logs.filter(l => l.status === "success").length;
  const successRate = logs.length > 0 ? Math.round((successCount / logs.length) * 100) : 0;
  
  const validDurations = logs.filter(l => l.duration_seconds != null);
  const avgDuration = validDurations.length > 0 
    ? validDurations.reduce((acc, l) => acc + (l.duration_seconds || 0), 0) / validDurations.length 
    : 0;

  const filteredLogs = useMemo(() => {
    if (filter === "all") return logs;
    return logs.filter(l => l.status === filter);
  }, [logs, filter]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader 
        title="AI Quiz Review" 
        description="Monitor AI quiz generation and review logs." 
        icon={Sparkles} 
      />

      {error && (
        <div className="callout-destructive flex items-center gap-2 p-3 rounded-md text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          label="Total Generations" 
          value={logs.length} 
          icon={Activity} 
          color="text-primary" 
          bg="bg-primary-subtle" 
        />
        <StatCard 
          label="Success Rate" 
          value={`${successRate}%`} 
          icon={Zap} 
          color="text-success" 
          bg="bg-success-subtle" 
        />
        <StatCard 
          label="Avg Duration" 
          value={`${avgDuration.toFixed(1)}s`} 
          icon={Timer} 
          color="text-warning" 
          bg="bg-warning-subtle" 
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 border-b border-border pb-2">
        <Button 
          variant={filter === "all" ? "default" : "ghost"} 
          onClick={() => setFilter("all")} 
          size="sm"
        >
          All
        </Button>
        <Button 
          variant={filter === "success" ? "default" : "ghost"} 
          onClick={() => setFilter("success")} 
          size="sm"
          className={filter === "success" ? "bg-success hover:bg-success/90" : "text-success hover:bg-success-subtle"}
        >
          Success
        </Button>
        <Button 
          variant={filter === "failed" ? "default" : "ghost"} 
          onClick={() => setFilter("failed")} 
          size="sm"
          className={filter === "failed" ? "bg-destructive hover:bg-destructive/90" : "text-destructive hover:bg-destructive-subtle"}
        >
          Failed
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3"><TableSkeleton /></div>
      ) : filteredLogs.length === 0 ? (
        <EmptyState 
          icon={Sparkles} 
          title="No AI generation logs found" 
          description={logs.length === 0 ? "Logs will appear here when students generate quizzes." : "Try changing the status filter."} 
        />
      ) : (
        <div className="space-y-3">
          {filteredLogs.map(log => (
            <Card key={log.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      {statusBadge(log.status)}
                      {log.quiz_id && <Badge variant="secondary" className="text-xs">Quiz #{log.quiz_id}</Badge>}
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                        <span>{log.questions_validated}/{log.questions_requested} validated</span>
                      </div>
                      {log.duration_seconds && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          <span>{log.duration_seconds.toFixed(1)}s</span>
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">{formatDate(log.created_at)}</div>
                    </div>
                    {log.error_message && (
                      <p className="text-xs text-destructive mt-2 flex items-start gap-1.5">
                        <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />{log.error_message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page} of {totalPages} · {total} logs</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
