import { BookOpen, Sparkles, ArrowLeft, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function FourthYearPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12 lg:pb-0">
      <div className="text-center max-w-5xl mx-auto">
        <div className="relative inline-flex h-24 w-24 items-center justify-center rounded-full bg-primary-subtle mb-6">
          <BookOpen className="h-12 w-12 text-primary" />
          <div className="absolute -bottom-2 -right-2 bg-card rounded-full p-1.5 shadow-sm border border-border/50">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
        </div>

        <div className="mb-4">
          <Badge variant="coming-soon">Coming Soon</Badge>
        </div>

        <h1 className="text-3xl font-bold mb-3">4th Year</h1>

        <p className="text-muted-foreground mb-2 text-lg">
          4th Year Computer Science courses and learning materials will be available soon.
        </p>

        <p className="text-sm text-muted-foreground mb-12 max-w-xl mx-auto">
          We are working on 4th Year course content for Computer Science students at Wachemo University.
          Check back later for updates.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12 text-left">
          {/* Card 1 */}
          <div className="relative rounded-xl border border-primary/20 bg-card/50 opacity-60 p-5 flex flex-col items-start overflow-hidden">
            <div className="absolute top-4 right-4 text-muted-foreground">
              <Lock className="h-4 w-4 opacity-50" />
            </div>
            <div className="text-xs font-semibold text-primary/80 mb-2 bg-primary-subtle px-2 py-0.5 rounded">CoSc 4011</div>
            <h3 className="font-semibold text-foreground mb-1">Compiler Design</h3>
            <p className="text-xs text-muted-foreground">Theory and implementation of programming language compilers</p>
          </div>

          {/* Card 2 */}
          <div className="relative rounded-xl border border-primary/20 bg-card/50 opacity-60 p-5 flex flex-col items-start overflow-hidden">
            <div className="absolute top-4 right-4 text-muted-foreground">
              <Lock className="h-4 w-4 opacity-50" />
            </div>
            <div className="text-xs font-semibold text-primary/80 mb-2 bg-primary-subtle px-2 py-0.5 rounded">CoSc 4021</div>
            <h3 className="font-semibold text-foreground mb-1">Machine Learning</h3>
            <p className="text-xs text-muted-foreground">Fundamentals of ML algorithms and applications</p>
          </div>

          {/* Card 3 */}
          <div className="relative rounded-xl border border-primary/20 bg-card/50 opacity-60 p-5 flex flex-col items-start overflow-hidden">
            <div className="absolute top-4 right-4 text-muted-foreground">
              <Lock className="h-4 w-4 opacity-50" />
            </div>
            <div className="text-xs font-semibold text-primary/80 mb-2 bg-primary-subtle px-2 py-0.5 rounded">CoSc 4031</div>
            <h3 className="font-semibold text-foreground mb-1">Distributed Systems</h3>
            <p className="text-xs text-muted-foreground">Architecture and design of distributed computing systems</p>
          </div>

          {/* Card 4 */}
          <div className="relative rounded-xl border border-primary/20 bg-card/50 opacity-60 p-5 flex flex-col items-start overflow-hidden">
            <div className="absolute top-4 right-4 text-muted-foreground">
              <Lock className="h-4 w-4 opacity-50" />
            </div>
            <div className="text-xs font-semibold text-primary/80 mb-2 bg-primary-subtle px-2 py-0.5 rounded">CoSc 4042</div>
            <h3 className="font-semibold text-foreground mb-1">Final Year Project</h3>
            <p className="text-xs text-muted-foreground">Capstone research and development project</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild variant="default">
            <Link to="/courses">
              <BookOpen className="h-4 w-4 mr-2" />
              Browse Available Courses
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
