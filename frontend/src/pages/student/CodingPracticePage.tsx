import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Code2, Search, CheckCircle2, Flame, Zap, Award,
  Filter, Layers, Terminal, ArrowUpRight
} from "lucide-react";
import { codingApi, type CodingProblem, type UserCodingStats } from "@/api/coding";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import PageHeader from "@/components/common/PageHeader";
import { StatsSkeleton } from "@/components/common/Skeleton";

const CATEGORIES = [
  "All Categories",
  "Programming Fundamentals",
  "Arrays",
  "Strings",
  "Functions",
  "Recursion",
  "OOP",
  "Linked Lists",
  "Stacks & Queues",
  "Searching & Sorting",
  "Trees",
  "Graphs",
  "Dynamic Programming",
  "SQL",
];

export default function CodingPracticePage() {
  const [problems, setProblems] = useState<CodingProblem[]>([]);
  const [stats, setStats] = useState<UserCodingStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
  }, [selectedCategory, selectedDifficulty, selectedStatus]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [probsRes, statsRes] = await Promise.all([
        codingApi.getProblems({
          category: selectedCategory === "All Categories" ? undefined : selectedCategory,
          difficulty: selectedDifficulty === "All" ? undefined : selectedDifficulty,
          status_filter: selectedStatus === "All" ? undefined : selectedStatus.toLowerCase(),
        }),
        codingApi.getUserStats(),
      ]);
      setProblems(probsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to load coding problems:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProblems = problems.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">Easy</Badge>;
      case "Medium":
        return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">Medium</Badge>;
      case "Hard":
        return <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20">Hard</Badge>;
      default:
        return <Badge variant="outline">{difficulty}</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-24 lg:pb-8 space-y-6">
      <PageHeader
        title="Coding Practice Platform"
        description="Master Computer Science problem-solving with hands-on coding challenges and real-time AI feedback."
      />

      {/* Progress & Stats Bar */}
      {stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-4 flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Code2 className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Solved Challenges</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <h3 className="text-xl font-bold text-foreground">{stats.solved_count}</h3>
                  <span className="text-xs text-muted-foreground">/ {stats.total_count}</span>
                </div>
                <Progress value={stats.completion_percentage} className="h-1.5 mt-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-4 flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Flame className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Daily Coding Streak</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">{stats.streak} Days 🔥</h3>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">Keep coding daily!</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-4 flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Coding XP Points</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">{stats.total_xp} XP</h3>
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1">Earned from solutions</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-4 flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Award className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-medium">Difficulty Breakdown</p>
                <div className="flex items-center gap-2 text-xs font-semibold mt-1">
                  <span className="text-emerald-600">{stats.easy_solved} E</span>
                  <span>·</span>
                  <span className="text-amber-600">{stats.medium_solved} M</span>
                  <span>·</span>
                  <span className="text-rose-600">{stats.hard_solved} H</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <StatsSkeleton />
      )}

      {/* Categories Filter Pills */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-purple-600" /> Topic Categories
          </h3>
          <span className="text-xs text-muted-foreground">{filteredProblems.length} Problems</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-purple-600 text-white shadow-sm"
                  : "bg-card border border-border text-foreground hover:bg-muted"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3.5 rounded-xl border border-border">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search problems by title or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs h-9 bg-muted/40"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Difficulty Dropdown */}
          <div className="flex items-center gap-1 text-xs">
            <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="bg-muted/50 border border-border rounded-lg text-xs py-1.5 px-2.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="All">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-muted/50 border border-border rounded-lg text-xs py-1.5 px-2.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="All">All Status</option>
            <option value="Solved">Solved</option>
            <option value="Unsolved">Unsolved</option>
          </select>
        </div>
      </div>

      {/* Problem Grid */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredProblems.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border p-6 space-y-3">
          <Terminal className="h-10 w-10 text-muted-foreground mx-auto" />
          <h4 className="text-base font-bold text-foreground">No coding challenges found</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Try adjusting your search keywords or switching category filters.
          </p>
          <Button variant="outline" size="sm" onClick={() => { setSelectedCategory("All Categories"); setSelectedDifficulty("All"); setSelectedStatus("All"); setSearchQuery(""); }}>
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredProblems.map((prob) => (
            <Card
              key={prob.id}
              className="hover:border-purple-500/40 transition-all hover:shadow-sm bg-card border border-border group"
            >
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 font-mono font-bold text-xs">
                    #{prob.id}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={`/coding/${prob.id}`}
                        className="font-bold text-sm text-foreground hover:text-purple-600 dark:hover:text-purple-400 truncate flex items-center gap-1.5"
                      >
                        {prob.title}
                        <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                      {prob.is_solved && (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] py-0 px-1.5 gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Solved
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="font-mono text-purple-600 dark:text-purple-400">{prob.category}</span>
                      <span>·</span>
                      {getDifficultyBadge(prob.difficulty)}
                      <span>·</span>
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">{prob.points} XP</span>
                    </div>
                  </div>
                </div>

                <Button asChild size="sm" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shrink-0 gap-1.5 shadow-sm">
                  <Link to={`/coding/${prob.id}`}>
                    <Code2 className="h-3.5 w-3.5" /> Solve Challenge
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
