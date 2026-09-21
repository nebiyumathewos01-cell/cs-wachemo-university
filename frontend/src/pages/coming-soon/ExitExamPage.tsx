import { GraduationCap, BookOpen, ArrowLeft, FileText, ClipboardList, Clock, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ExitExamPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12 lg:pb-0">
      <div className="text-center max-w-4xl mx-auto">
        <div className="relative inline-flex h-24 w-24 items-center justify-center rounded-full bg-warning-subtle mb-6">
          <GraduationCap className="h-12 w-12 text-warning" />
          <div className="absolute -bottom-2 -right-2 bg-card rounded-full p-1.5 shadow-sm border border-border/50">
            <BookOpen className="h-5 w-5 text-warning" />
          </div>
        </div>

        <div className="mb-4">
          <Badge variant="coming-soon">Coming Soon</Badge>
        </div>

        <h1 className="text-3xl font-bold mb-3">Exit Exam</h1>

        <p className="text-muted-foreground mb-2 text-lg">
          Exit Exam preparation materials, practice questions, and mock exams will be available soon.
        </p>

        <p className="text-sm text-muted-foreground mb-12 max-w-xl mx-auto">
          We are working on comprehensive exit exam preparation resources for Computer Science
          students at Wachemo University.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 text-left">
          {/* Card 1 */}
          <div className="relative rounded-xl border border-warning/20 bg-card/50 opacity-60 p-6 flex flex-col items-start overflow-hidden">
            <div className="absolute top-4 right-4 text-muted-foreground">
              <Lock className="h-5 w-5 opacity-50" />
            </div>
            <div className="h-10 w-10 rounded-lg bg-warning-subtle flex items-center justify-center mb-4">
              <FileText className="h-5 w-5 text-warning" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">MOE Exam Library</h3>
            <p className="text-sm text-muted-foreground">Access past Ministry of Education exit examination papers</p>
          </div>

          {/* Card 2 */}
          <div className="relative rounded-xl border border-warning/20 bg-card/50 opacity-60 p-6 flex flex-col items-start overflow-hidden">
            <div className="absolute top-4 right-4 text-muted-foreground">
              <Lock className="h-5 w-5 opacity-50" />
            </div>
            <div className="h-10 w-10 rounded-lg bg-warning-subtle flex items-center justify-center mb-4">
              <ClipboardList className="h-5 w-5 text-warning" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Topic Practice</h3>
            <p className="text-sm text-muted-foreground">Practice by topic with AI-generated questions</p>
          </div>

          {/* Card 3 */}
          <div className="relative rounded-xl border border-warning/20 bg-card/50 opacity-60 p-6 flex flex-col items-start overflow-hidden">
            <div className="absolute top-4 right-4 text-muted-foreground">
              <Lock className="h-5 w-5 opacity-50" />
            </div>
            <div className="h-10 w-10 rounded-lg bg-warning-subtle flex items-center justify-center mb-4">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Mock Simulation</h3>
            <p className="text-sm text-muted-foreground">Timed mock exit exams with scoring and analysis</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild variant="default">
            <Link to="/courses">
              <BookOpen className="h-4 w-4 mr-2" />
              Browse Courses
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
