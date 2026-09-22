import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, AlertCircle, FileText, ClipboardList, Brain, Lightbulb, BookOpen } from "lucide-react";
import { chaptersApi, materialsApi } from "@/api/academic";
import type { Chapter, Material } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EmptyState from "@/components/common/EmptyState";
import PageHeader from "@/components/common/PageHeader";
import { ChapterSkeleton } from "@/components/common/Skeleton";
import { formatFileSize, formatDate } from "@/utils";
import MaterialViewerModal from "@/components/materials/MaterialViewerModal";

export default function ChapterDetailPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    if (!chapterId) return;
    const id = Number(chapterId);
    Promise.all([chaptersApi.getChapter(id), materialsApi.getMaterialsByChapter(id)])
      .then(([cr, mr]) => { setChapter(cr.data); setMaterials(mr.data); })
      .catch(() => setError("Failed to load chapter."))
      .finally(() => setLoading(false));
  }, [chapterId]);

  const handleOpenViewer = (m: Material) => {
    setSelectedMaterial(m);
    setViewerOpen(true);
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto space-y-4 pb-24 lg:pb-8">
      <ChapterSkeleton /><ChapterSkeleton />
    </div>
  );

  if (error || !chapter) return (
    <div className="max-w-3xl mx-auto py-16 text-center">
      <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-3" />
      <p className="font-medium text-sm">{error || "Chapter not found."}</p>
      <Button asChild variant="outline" size="sm" className="mt-4">
        <Link to="/courses"><ArrowLeft className="h-3.5 w-3.5 mr-1.5" />Back</Link>
      </Button>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto pb-24 lg:pb-8 space-y-6">
      <PageHeader 
        title={`Chapter ${chapter.number}: ${chapter.title}`}
        backTo={{ label: 'Back to Course', path: `/courses/${chapter.course_id}` }}
      />

      {/* Chapter header */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 font-bold text-primary text-base">
            {chapter.number}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground">{chapter.title}</h1>
            {chapter.description && (
              <p className="text-sm text-foreground-muted mt-1.5">{chapter.description}</p>
            )}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <Button asChild size="sm" className="gap-1.5">
                <Link to={`/quizzes?chapter=${chapter.id}&course=${chapter.course_id}`}>
                  <ClipboardList className="h-3.5 w-3.5" />Generate Quiz
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                <Link to={`/ai-study?chapter=${chapter.id}&course=${chapter.course_id}`}>
                  <Brain className="h-3.5 w-3.5" />Ask AI
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Materials */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-foreground-subtle">
            Study Materials
          </h2>
          <Badge variant="muted">{materials.length}</Badge>
        </div>

        {materials.length === 0 ? (
          <EmptyState icon={FileText} title="No materials yet"
            description="Study materials will appear here once uploaded by your instructor." />
        ) : (
          <div className="space-y-2">
            {materials.map(m => (
              <Card key={m.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-destructive-subtle border border-destructive/20 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-destructive" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{m.title}</p>
                      {m.description && <p className="text-xs text-foreground-muted mt-0.5 line-clamp-1">{m.description}</p>}
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-foreground-subtle flex-wrap">
                        <span className="font-medium uppercase">{m.file_type}</span>
                        <span>·</span><span>{formatFileSize(m.file_size)}</span>
                        <span>·</span><span>{formatDate(m.created_at)}</span>
                        {m.has_extracted_text && (
                          <Badge variant="success" className="text-2xs">AI-ready</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      className="shrink-0 gap-1.5 bg-purple-600 hover:bg-purple-700 text-white font-medium"
                      onClick={() => handleOpenViewer(m)}
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      View Material
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {materials.length > 0 && (
        <div className="callout-info">
          <div className="flex gap-2">
            <Lightbulb className="h-4 w-4 shrink-0 text-info mt-0.5" />
            <div>
              <p className="text-sm font-medium text-info mb-1">Study tip</p>
              <p className="text-xs text-info/80">
                Read the materials first, then use Generate Quiz to test your knowledge.
                The AI creates questions directly from this chapter's content.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Material In-System Reader Modal */}
      <MaterialViewerModal
        material={selectedMaterial}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </div>
  );
}
