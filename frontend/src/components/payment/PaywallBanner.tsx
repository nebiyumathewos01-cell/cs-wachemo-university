import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PaymentModal from "./PaymentModal";
import {
  Lock,
  Clock,
  PlayCircle,
  CreditCard,
} from "lucide-react";

export default function PaywallBanner() {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  // If user is admin or already paid, do not show paywall banner
  if (!user || user.role === "admin" || user.is_paid) {
    return null;
  }

  const isPending = user.payment_status === "pending";
  const isRejected = user.payment_status === "rejected";

  return (
    <>
      <div className="rounded-2xl border border-purple-200 dark:border-purple-900/50 bg-gradient-to-r from-purple-50 via-indigo-50/40 to-amber-50/50 dark:from-purple-950/30 dark:via-indigo-950/20 dark:to-amber-950/20 p-4 sm:p-5 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {isPending ? (
                <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-none text-xs flex items-center gap-1">
                  <Clock className="h-3 w-3 animate-spin" /> Payment Verification Pending
                </Badge>
              ) : isRejected ? (
                <Badge variant="destructive" className="text-xs">
                  Payment Verification Rejected
                </Badge>
              ) : (
                <Badge className="bg-[#800080] hover:bg-[#6b006b] text-white border-none text-xs flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Full Access Locked · 50 ETB
                </Badge>
              )}
              <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                Commercial Bank of Ethiopia (CBE) · Nebiyu Mathewos
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-foreground">
              {isPending
                ? "Your 50 ETB payment proof is being verified"
                : "Unlock Complete Wachemo CS Study Materials & Exit Exam"}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
              {isPending
                ? "Our administrator is confirming your CBE transaction reference. You will receive full access right after approval!"
                : "Get unlimited access to all courses, lecture slides, AI quiz generator, & Exit Exam prep for a promotional fee of only 50 Birr (valid until Sept 30, 2026 · Regular: 100 ETB)."}
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 flex-wrap sm:flex-nowrap">
            <Link to="/demo" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300 hover:bg-purple-100/50"
              >
                <PlayCircle className="h-4 w-4 mr-1.5 text-purple-600 dark:text-purple-400" />
                Try Interactive Demo
              </Button>
            </Link>

            <Button
              size="sm"
              onClick={() => setModalOpen(true)}
              className="w-full sm:w-auto bg-[#800080] hover:bg-[#6b006b] text-white shadow-sm font-semibold"
            >
              <CreditCard className="h-4 w-4 mr-1.5" />
              {isPending ? "View Payment Info" : "Pay 50 ETB with CBE"}
            </Button>
          </div>
        </div>
      </div>

      <PaymentModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
