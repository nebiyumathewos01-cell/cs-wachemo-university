import { useEffect, useState } from "react";
import { X, ShieldCheck, Lock, Loader2, Sparkles, BookOpen, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import PaymentModal from "@/components/payment/PaymentModal";
import { materialsApi } from "@/api/academic";
import type { Material } from "@/types";

interface MaterialViewerModalProps {
  material: Material | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MaterialViewerModal({ material, isOpen, onClose }: MaterialViewerModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const isPaidOrAdmin = user?.is_paid || user?.role === "admin";

  useEffect(() => {
    if (!isOpen || !material) {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
      setTextContent(null);
      setError(null);
      return;
    }

    if (!isPaidOrAdmin) {
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    materialsApi
      .viewMaterial(material.id)
      .then((res) => {
        if (!isMounted) return;
        const fileType = (material.file_type || "").toLowerCase();
        const headerType = (res.headers["content-type"] as string | undefined) || "application/pdf";
        const blob = new Blob([res.data as BlobPart], {
          type: headerType,
        });

        if (["txt", "md", "py", "js", "cpp", "java", "c", "h", "html", "css", "json"].includes(fileType)) {
          blob.text().then((text) => {
            if (isMounted) setTextContent(text);
          });
        }

        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Failed to fetch material view:", err);
        setError("Failed to load material. Please verify your payment status.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, material, isPaidOrAdmin]);

  if (!isOpen || !material) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
        <div
          className="relative w-full max-w-5xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] select-none"
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Top Bar Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/60 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                <BookOpen className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-foreground truncate">{material.title}</h3>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                  <span className="uppercase font-mono font-semibold text-purple-600 dark:text-purple-400">
                    {material.file_type}
                  </span>
                  <span>·</span>
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 gap-1 font-medium">
                    <ShieldCheck className="h-3 w-3" /> In-System Reader
                  </Badge>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Body Content */}
          <div className="relative flex-1 overflow-auto bg-slate-950/5 dark:bg-slate-950/40 p-4 min-h-[400px] flex items-center justify-center">
            {/* Watermark Protection Overlay */}
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center opacity-[0.04] dark:opacity-[0.06] select-none rotate-[-25deg]">
              <p className="text-4xl sm:text-6xl font-black uppercase text-foreground tracking-widest text-center">
                CS WACHEMO · PRIVATE & CONFIDENTIAL · {user?.email || "STUDENT"}
              </p>
            </div>

            {/* Paywall Gate for Unpaid Users */}
            {!isPaidOrAdmin ? (
              <div className="w-full max-w-md bg-card p-6 sm:p-8 rounded-2xl border border-purple-500/30 shadow-xl text-center space-y-4 my-auto z-20">
                <div className="h-14 w-14 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
                  <Lock className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-foreground">Course Material Locked</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    This material is private to CS Wachemo paid students. You must complete the 50 ETB fee to read course lectures and materials.
                  </p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-950/50 p-3.5 rounded-xl border border-purple-200 dark:border-purple-800/60 text-left text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-semibold text-purple-900 dark:text-purple-200">
                    <span>Payment Method:</span>
                    <span>CBE Bank</span>
                  </div>
                  <div className="text-purple-700 dark:text-purple-300 font-mono">
                    Account: <strong>1000503206505</strong>
                  </div>
                  <div className="text-purple-700 dark:text-purple-300">
                    Name: <strong>Nebiyu Mathewos</strong>
                  </div>
                  <div className="text-purple-700 dark:text-purple-300 text-[11px] pt-1 border-t border-purple-200 dark:border-purple-800/40">
                    Fee: <strong>50 ETB</strong> (Promo valid until Sept 30, 2026)
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <Button
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full bg-[#800080] hover:bg-[#6b006b] text-white font-bold text-xs"
                  >
                    <Sparkles className="h-4 w-4 mr-1.5" /> Unlock & Submit Payment Proof
                  </Button>
                  <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center p-12 space-y-3 z-20">
                <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
                <p className="text-xs font-medium text-muted-foreground">Loading protected material reader...</p>
              </div>
            ) : error ? (
              <div className="text-center p-8 space-y-3 z-20">
                <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
                <p className="text-sm font-medium text-destructive">{error}</p>
                <Button size="sm" variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            ) : textContent !== null ? (
              <div className="w-full h-full bg-card rounded-xl p-4 overflow-auto border border-border font-mono text-xs text-foreground z-20">
                <pre className="whitespace-pre-wrap break-words">{textContent}</pre>
              </div>
            ) : blobUrl ? (
              <div className="w-full h-full min-h-[550px] flex items-center justify-center z-20">
                {["jpg", "jpeg", "png", "gif"].includes((material.file_type || "").toLowerCase()) ? (
                  <img
                    src={blobUrl}
                    alt={material.title}
                    className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-md select-none pointer-events-none"
                  />
                ) : (
                  <object
                    data={`${blobUrl}#toolbar=0&navpanes=0`}
                    type="application/pdf"
                    className="w-full h-[75vh] rounded-xl shadow-inner border border-border"
                  >
                    <iframe
                      src={`${blobUrl}#toolbar=0&navpanes=0`}
                      className="w-full h-full rounded-xl"
                      title={material.title}
                    />
                  </object>
                )}
              </div>
            ) : null}
          </div>

          {/* Footer Info */}
          {isPaidOrAdmin && (
            <div className="px-5 py-2.5 bg-muted/60 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground shrink-0">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <ShieldCheck className="h-3.5 w-3.5" /> Protected In-System Reader Enabled (Sharing & External Downloading Restricted)
              </span>
              <Button variant="secondary" size="sm" onClick={onClose} className="h-7 text-xs px-3">
                Close Reader
              </Button>
            </div>
          )}
        </div>
      </div>

      <PaymentModal open={showPaymentModal} onOpenChange={setShowPaymentModal} />
    </>
  );
}
