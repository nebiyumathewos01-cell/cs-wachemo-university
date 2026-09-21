/**
 * YearSelectPrompt
 *
 * Shown as an overlay when a student has not yet selected their academic year.
 * Calls PATCH /auth/me/year and updates the user in AuthContext.
 */
import { useEffect, useState } from "react";
import { GraduationCap, Loader2, Clock } from "lucide-react";
import { academicApi } from "@/api/academic";
import { authApi } from "@/api/auth";
import { useAuth } from "@/contexts/AuthContext";
import type { AcademicYear } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";

export default function YearSelectPrompt() {
  const { updateUser } = useAuth();
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    academicApi.getYears().then((r) => setYears(r.data)).catch(() => {});
  }, []);

  const handleConfirm = async () => {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      const res = await authApi.selectYear(selected);
      updateUser(res.data);
    } catch {
      setError("Failed to save your selection. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="year-select-title"
    >
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <GraduationCap className="h-7 w-7 text-primary" />
          </div>
          <h2 id="year-select-title" className="text-xl font-bold">
            Select Your Academic Year
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            This helps us show you the right courses and materials.
          </p>
        </div>

        {/* Year options */}
        <div className="space-y-2 mb-5">
          {years.length === 0 ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            years.map((year) => {
              const isSelected = selected === year.id;
              const unavailable = !year.is_available;
              return (
                <button
                  key={year.id}
                  disabled={unavailable}
                  onClick={() => !unavailable && setSelected(year.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left",
                    unavailable
                      ? "opacity-50 cursor-not-allowed border-border bg-muted/40"
                      : isSelected
                      ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                      : "border-border bg-background hover:border-primary/60 hover:bg-accent"
                  )}
                  aria-pressed={isSelected}
                >
                  <span>{year.name}</span>
                  {unavailable && (
                    <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5">
                      <Clock className="h-3 w-3" />
                      Coming Soon
                    </span>
                  )}
                  {isSelected && !unavailable && (
                    <span className="text-xs text-primary font-semibold">✓ Selected</span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive mb-3 text-center">
            {error}
          </p>
        )}

        <Button
          className="w-full"
          disabled={!selected || saving}
          onClick={handleConfirm}
          aria-busy={saving}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden />
              Saving…
            </>
          ) : (
            "Continue"
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground mt-4">
          You can change this later from your profile.
        </p>
      </div>
    </div>
  );
}
