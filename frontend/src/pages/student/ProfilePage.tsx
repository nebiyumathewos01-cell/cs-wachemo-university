import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Mail, Shield, Calendar, LogOut, TrendingUp, BookOpen, ClipboardList } from "lucide-react";
import { formatDate, getInitials, getScoreColor, formatScore } from "@/utils";
import PageHeader from "@/components/common/PageHeader";
import { progressApi } from "@/api/progress";
import { academicApi } from "@/api/academic";
import type { StudentProgress } from "@/types";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [academicYear, setAcademicYear] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const loadData = async () => {
      setLoading(true);
      try {
        const [progRes, yearRes] = await Promise.all([
          progressApi.getMyProgress().catch(() => null),
          user.selected_year_id ? academicApi.getYear(user.selected_year_id).catch(() => null) : null
        ]);
        
        if (progRes) setProgress(progRes.data);
        if (yearRes) setAcademicYear(yearRes.data.name);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user]);

  if (!user) return null;

  return (
    <div className="page-container space-y-6 max-w-3xl mx-auto">
      <PageHeader title="My Profile" icon={User} />

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-full bg-primary-subtle flex items-center justify-center text-primary font-bold text-3xl shrink-0">
              {getInitials(user.full_name)}
            </div>
            <div>
              <CardTitle className="text-2xl">{user.full_name}</CardTitle>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant={user.role === "admin" ? "destructive" : "secondary"}>
                  {user.role === "admin" ? "Administrator" : "Student"}
                </Badge>
                {user.is_active && <Badge variant="success">Active</Badge>}
                {academicYear && <Badge variant="outline">{academicYear}</Badge>}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground w-20">Email:</span>
              <span className="font-medium truncate">{user.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground w-20">Name:</span>
              <span className="font-medium truncate">{user.full_name}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground w-20">Role:</span>
              <span className="font-medium capitalize">{user.role}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground w-20">Joined:</span>
              <span className="font-medium">{formatDate(user.created_at)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Academic Stats */}
      {user.role !== "admin" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Academic Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : progress ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface border border-border rounded-lg p-4 flex flex-col items-center text-center">
                  <ClipboardList className="h-6 w-6 text-primary mb-2" />
                  <span className="text-2xl font-bold">{progress.total_quizzes}</span>
                  <span className="text-xs text-muted-foreground mt-1">Total Quizzes</span>
                </div>
                <div className="bg-surface border border-border rounded-lg p-4 flex flex-col items-center text-center">
                  <BookOpen className={`h-6 w-6 mb-2 ${getScoreColor(progress.overall_average)}`} />
                  <span className={`text-2xl font-bold ${getScoreColor(progress.overall_average)}`}>
                    {formatScore(progress.overall_average)}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">Average Score</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No statistics available yet.</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="callout-info">
        Profile editing will be available in a future update.
      </div>
      
      <div className="pt-4 flex justify-center">
        <Button variant="destructive" onClick={logout} className="gap-2 w-full sm:w-auto">
          <LogOut className="h-4 w-4" /> Log out
        </Button>
      </div>
    </div>
  );
}
