import { useEffect, useState } from "react";
import { Bookmark, Trash2, BookOpen, FileText, HelpCircle, BookMarked } from "lucide-react";
import { bookmarksApi } from "@/api/progress";
import type { Bookmark as BookmarkType } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { formatDate } from "@/utils";
import PageHeader from "@/components/common/PageHeader";
import { CardSkeleton } from "@/components/common/Skeleton";
import EmptyState from "@/components/common/EmptyState";
import { useToast } from "@/hooks/useToast";

const TYPE_ICONS: Record<string, React.ElementType> = {
  course: BookOpen,
  chapter: BookMarked,
  material: FileText,
  question: HelpCircle,
  past_exam: FileText,
};

const TYPE_PATHS: Record<string, (_id: number) => string> = {
  course: (_id) => `/courses/${_id}`,
  chapter: (_id) => `/chapters/${_id}`,
  material: (_id) => `/chapters/${_id}`,
  question: (_id) => `/quizzes`,
  past_exam: (_id) => `/past-exams`,
};

type FilterType = 'All' | 'Courses' | 'Chapters' | 'Materials' | 'Questions' | 'Past Exams';

const FILTER_TO_TYPE: Record<FilterType, string | null> = {
  'All': null,
  'Courses': 'course',
  'Chapters': 'chapter',
  'Materials': 'material',
  'Questions': 'question',
  'Past Exams': 'past_exam',
};

export default function BookmarksPage() {
  const { toast } = useToast();
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');

  useEffect(() => {
    bookmarksApi.getBookmarks()
      .then(r => setBookmarks(r.data))
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (id: number) => {
    setRemoving(id);
    try {
      await bookmarksApi.removeBookmark(id);
      setBookmarks(prev => prev.filter(b => b.id !== id));
      toast({ title: "Bookmark removed" });
    } catch { 
      toast({ title: "Error", description: "Failed to remove bookmark.", variant: "destructive" });
    }
    finally { setRemoving(null); }
  };

  const filteredBookmarks = bookmarks.filter(bm => {
    const typeFilter = FILTER_TO_TYPE[activeFilter];
    return typeFilter === null || bm.bookmark_type === typeFilter;
  });

  return (
    <div className="page-container space-y-6">
      <PageHeader 
        title="Bookmarks" 
        description="Your saved courses, chapters, materials, and questions." 
        icon={Bookmark} 
      />

      {/* Filter Tabs */}
      {!loading && bookmarks.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 border-b border-border pb-2">
          {(Object.keys(FILTER_TO_TYPE) as FilterType[]).map(filter => (
            <Button
              key={filter}
              variant={activeFilter === filter ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveFilter(filter)}
              className="rounded-full"
            >
              {filter}
            </Button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : bookmarks.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No bookmarks yet"
          description="Save courses, chapters, and materials for quick access."
        />
      ) : filteredBookmarks.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title={`No ${activeFilter.toLowerCase()} bookmarked`}
          description={`You haven't bookmarked any ${activeFilter.toLowerCase()} yet.`}
          action={{ label: "Clear Filter", onClick: () => setActiveFilter('All') }}
        />
      ) : (
        <div className="space-y-3">
          {filteredBookmarks.map(bm => {
            const Icon = TYPE_ICONS[bm.bookmark_type] ?? BookOpen;
            const path = TYPE_PATHS[bm.bookmark_type]?.(bm.reference_id) ?? "/";
            return (
              <Card key={bm.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary-subtle flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to={path} className="font-semibold text-base hover:text-primary transition-colors line-clamp-1">
                        {bm.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">{bm.bookmark_type.replace("_", " ")}</Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(bm.created_at)}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive-subtle"
                      onClick={() => handleRemove(bm.id)}
                      disabled={removing === bm.id}
                      aria-label="Remove bookmark"
                    >
                      {removing === bm.id ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-destructive border-t-transparent" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
