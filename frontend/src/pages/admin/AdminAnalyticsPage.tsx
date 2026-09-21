import { useEffect, useState } from "react";
import { BarChart2, Users, BookOpen, FileUp, FileText, ClipboardList, TrendingUp, AlertCircle } from "lucide-react";
import { adminApi } from "@/api/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import { StatsSkeleton } from "@/components/common/Skeleton";
import { Button } from "@/components/ui/button";

interface Analytics {
  total_students: number;
  total_courses: number;
  total_materials: number;
  total_past_exams: number;
  total_quiz_attempts: number;
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = () => {
    setLoading(true);
    setError("");
    adminApi.getAnalytics()
      .then(r => setData(r.data))
      .catch(() => setError("Failed to load analytics"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = data ? [
    { label: "Total Students", value: data.total_students, icon: Users, color: "text-primary", bg: "bg-primary-subtle", group: "engagement" },
    { label: "Total Courses", value: data.total_courses, icon: BookOpen, color: "text-success", bg: "bg-success-subtle", group: "content" },
    { label: "Study Materials", value: data.total_materials, icon: FileUp, color: "text-warning", bg: "bg-warning-subtle", group: "content" },
    { label: "Past Exams", value: data.total_past_exams, icon: FileText, color: "text-[hsl(var(--info))]", bg: "bg-info-subtle", group: "content" },
    { label: "Quiz Attempts", value: data.total_quiz_attempts, icon: ClipboardList, color: "text-destructive", bg: "bg-destructive-subtle", group: "engagement" },
  ] : [];

  const contentMax = data ? Math.max(data.total_courses, data.total_materials, data.total_past_exams, 1) : 1;
  const engagementMax = data ? Math.max(data.total_students, data.total_quiz_attempts, 1) : 1;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader 
        title="Analytics" 
        description="Platform metrics and usage statistics." 
        icon={BarChart2} 
      />

      {error && (
        <div className="callout-destructive flex items-center justify-between p-4 rounded-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadData}>Retry</Button>
        </div>
      )}

      {/* Stat cards */}
      {loading ? (
        <StatsSkeleton count={5} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map(({ label, value, icon, color, bg }) => (
            <StatCard 
               key={label} 
               label={label} 
               value={value} 
               icon={icon} 
               bg={bg} 
               color={color} 
             />
          ))}
        </div>
      )}

      {/* Bar chart (visual) */}
      {!loading && data && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" />Platform Activity</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-3 text-muted-foreground">Content Metrics</h3>
              <div className="space-y-4">
                {stats.filter(s => s.group === "content").map(({ label, value, color, icon: Icon }) => (
                  <div key={label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Icon className={`h-4 w-4 ${color}`} />{label}
                      </span>
                      <span className="font-semibold">{value.toLocaleString()}</span>
                    </div>
                    <Progress value={(value / contentMax) * 100} className="h-2" />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-3 text-muted-foreground">Engagement Metrics</h3>
              <div className="space-y-4">
                {stats.filter(s => s.group === "engagement").map(({ label, value, color, icon: Icon }) => (
                  <div key={label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Icon className={`h-4 w-4 ${color}`} />{label}
                      </span>
                      <span className="font-semibold">{value.toLocaleString()}</span>
                    </div>
                    <Progress value={(value / engagementMax) * 100} className="h-2" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <div className="callout-info">
        <p className="font-medium mb-1">About Analytics</p>
        <p className="text-xs">
          These statistics reflect the current state of the platform database.
          Detailed per-student analytics and time-series charts will be available in a future update.
        </p>
      </div>
    </div>
  );
}
