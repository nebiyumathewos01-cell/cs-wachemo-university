import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { paymentApi } from "@/api/payments";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";
import PaymentModal from "@/components/payment/PaymentModal";
import type { Payment, PaymentStatusResponse } from "@/types";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  Copy,
  Zap,
  Building2,
  ShieldCheck,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function PaymentPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [statusData, setStatusData] = useState<PaymentStatusResponse | null>(null);
  const [history, setHistory] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const CBE_ACCOUNT = "1000503206505";
  const CBE_HOLDER = "Nebiyu Mathewos";

  const loadData = async () => {
    setLoading(true);
    try {
      const [statusRes, historyRes] = await Promise.all([
        paymentApi.getStatus(),
        paymentApi.getHistory().catch(() => ({ data: [] })),
      ]);
      setStatusData(statusRes.data);
      setHistory(historyRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(CBE_ACCOUNT);
    toast({
      title: "Account Copied!",
      description: `CBE Account ${CBE_ACCOUNT} copied to clipboard.`,
    });
  };

  const isPaid = statusData?.is_paid || user?.is_paid;
  const paymentStatus = statusData?.payment_status || user?.payment_status || "unpaid";

  return (
    <div className="max-w-4xl mx-auto pb-24 lg:pb-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Portal Access & Payment</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your account activation and Commercial Bank of Ethiopia (CBE) payment verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/demo">
            <Button variant="outline" size="sm">
              <Sparkles className="h-4 w-4 mr-1.5 text-purple-600" />
              Try Interactive Demo
            </Button>
          </Link>
          {!isPaid && (
            <Button
              size="sm"
              onClick={() => setModalOpen(true)}
              className="bg-[#800080] hover:bg-[#6b006b] text-white"
            >
              <CreditCard className="h-4 w-4 mr-1.5" /> Pay 50 ETB
            </Button>
          )}
        </div>
      </div>

      {/* Current Access Status Card */}
      <Card className="border-border/80 shadow-sm overflow-hidden">
        <div
          className={`p-6 border-b ${
            isPaid
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-950 dark:text-emerald-100"
              : paymentStatus === "pending"
              ? "bg-amber-500/10 border-amber-500/20 text-amber-950 dark:text-amber-100"
              : "bg-purple-500/10 border-purple-500/20 text-purple-950 dark:text-purple-100"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  isPaid
                    ? "bg-emerald-600 text-white"
                    : paymentStatus === "pending"
                    ? "bg-amber-500 text-white"
                    : "bg-[#800080] text-white"
                }`}
              >
                {isPaid ? (
                  <CheckCircle2 className="h-7 w-7" />
                ) : paymentStatus === "pending" ? (
                  <Clock className="h-7 w-7" />
                ) : (
                  <CreditCard className="h-7 w-7" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold">
                    {isPaid
                      ? "Full Lifetime Access Active"
                      : paymentStatus === "pending"
                      ? "Payment Verification In Progress"
                      : "Account Access Locked (50 ETB Fee)"}
                  </h3>
                  {isPaid ? (
                    <Badge className="bg-emerald-600 text-white text-xs">UNLOCKED</Badge>
                  ) : paymentStatus === "pending" ? (
                    <Badge className="bg-amber-500 text-white text-xs">PENDING</Badge>
                  ) : (
                    <Badge className="bg-[#800080] text-white text-xs">50 ETB</Badge>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  {isPaid
                    ? "You have full, unrestricted access to all lecture materials, AI quizzes, past exams, and AI study tutor."
                    : paymentStatus === "pending"
                    ? "Your CBE transaction reference was submitted. Admin is confirming the transfer in CBE system."
                    : "Transfer 50 Birr to CBE account 1000503206505 (Nebiyu Mathewos) and submit your reference code to unlock everything."}
                </p>
              </div>
            </div>

            {!isPaid && (
              <Button
                onClick={() => setModalOpen(true)}
                className="bg-[#800080] hover:bg-[#6b006b] text-white shrink-0 font-semibold"
              >
                <Zap className="h-4 w-4 mr-1.5" />
                {paymentStatus === "pending" ? "Submit Another Reference" : "Submit Payment Proof"}
              </Button>
            )}
          </div>
        </div>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CBE Account Details */}
            <div className="space-y-3 bg-muted/30 p-4 rounded-xl border border-border/60">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#800080]" /> Official Bank Details
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Bank Name:</span>
                  <span className="font-semibold text-foreground">Commercial Bank of Ethiopia (CBE)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Account Holder:</span>
                  <span className="font-semibold text-foreground">{CBE_HOLDER}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Account Number:</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-foreground">
                    <span>{CBE_ACCOUNT}</span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="text-purple-600 hover:text-purple-700 p-0.5"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Special Promo:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">50 ETB until Sept 30, 2026</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Regular Fee:</span>
                  <span className="font-semibold text-muted-foreground line-through">100 ETB</span>
                </div>
              </div>
            </div>

            {/* What is Unlocked */}
            <div className="space-y-3 bg-muted/30 p-4 rounded-xl border border-border/60">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> What You Unlock:
              </h4>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>2nd, 3rd, and 4th Year CS lecture slides & materials</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Comprehensive National Exit Exam Hub & Competency Drills</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Unlimited AI-generated practice quizzes & weakness tracking</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Midterm & Final past exam archives with solutions</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>24/7 AI Computer Science Study Assistant</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Submission History */}
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Your Payment Submissions</CardTitle>
          <CardDescription className="text-xs">
            List of transaction reference codes submitted for this account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 flex justify-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm space-y-2">
              <CreditCard className="h-8 w-8 mx-auto text-muted-foreground/50" />
              <p>No payment records submitted yet.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(true)}
                className="text-xs"
              >
                Submit Payment Reference
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {history.map((p) => (
                <div key={p.id} className="py-3.5 flex items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-foreground">
                        {p.transaction_reference}
                      </span>
                      <Badge
                        className={`text-[10px] ${
                          p.status === "approved"
                            ? "bg-emerald-600 text-white"
                            : p.status === "rejected"
                            ? "bg-rose-600 text-white"
                            : "bg-amber-500 text-white"
                        }`}
                      >
                        {p.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-0.5">
                      Sender: {p.sender_name} {p.phone_number && `· ${p.phone_number}`} · Amount: {p.amount} {p.currency}
                    </p>
                    {p.admin_notes && (
                      <p className="text-rose-600 dark:text-rose-400 mt-0.5 italic">
                        Note: {p.admin_notes}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-muted-foreground text-[11px] shrink-0">
                    {new Date(p.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PaymentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={() => {
          loadData();
        }}
      />
    </div>
  );
}
