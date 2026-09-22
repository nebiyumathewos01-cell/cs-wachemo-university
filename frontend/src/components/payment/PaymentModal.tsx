import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/contexts/AuthContext";
import { paymentApi } from "@/api/payments";
import {
  CheckCircle2,
  Copy,
  CreditCard,
  UserCheck,
  Zap,
  Clock,
  Send,
  Loader2,
  HelpCircle,
} from "lucide-react";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function PaymentModal({ open, onOpenChange, onSuccess }: PaymentModalProps) {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const [copied, setCopied] = useState(false);
  const [transactionRef, setTransactionRef] = useState("");
  const [senderName, setSenderName] = useState(user?.full_name || "");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const CBE_ACCOUNT = "1000503206505";
  const CBE_HOLDER = "Nebiyu Mathewos";

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(CBE_ACCOUNT);
    setCopied(true);
    toast({
      title: "Account Number Copied!",
      description: `CBE Account ${CBE_ACCOUNT} copied to clipboard.`,
    });
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionRef.trim()) {
      toast({
        title: "Transaction Reference Required",
        description: "Please enter your CBE transaction ID or reference number from your transfer SMS / receipt.",
        variant: "destructive",
      });
      return;
    }

    if (!senderName.trim()) {
      toast({
        title: "Sender Name Required",
        description: "Please enter the depositor or account owner name.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await paymentApi.submitPayment({
        transaction_reference: transactionRef.trim(),
        sender_name: senderName.trim(),
        phone_number: phoneNumber.trim() || undefined,
        amount: 50,
      });

      if (user) {
        updateUser({
          ...user,
          payment_status: "pending",
        });
      }

      setSubmittedSuccess(true);
      toast({
        title: "Payment Submitted Successfully! 🎉",
        description: "Your CBE payment reference is received and pending quick admin verification.",
      });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Failed to submit payment. Please try again.";
      toast({
        title: "Submission Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg p-0 overflow-hidden border-border/80 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#800080] via-[#5c005c] to-navy-900 text-white p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-black text-xs font-black uppercase tracking-wider flex items-center gap-1">
              <Zap className="h-3 w-3" /> Special Promo · 50 ETB
            </span>
            <span className="text-white/80 text-xs font-medium">Until Sept 30, 2026 (Regular: 100 ETB)</span>
          </div>
          <DialogTitle className="text-2xl font-bold text-white tracking-tight">
            Unlock Full Wachemo CS Platform
          </DialogTitle>
          <DialogDescription className="text-white/85 text-xs sm:text-sm mt-1">
            Transfer only <strong className="text-amber-300 font-extrabold text-sm sm:text-base">50 ETB</strong> to CBE account <strong className="text-white font-mono font-bold">1000503206505 (Nebiyu Mathewos)</strong> for full lifetime access.
          </DialogDescription>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {submittedSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Payment Proof Submitted!</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                  Thank you, <span className="font-semibold text-foreground">{senderName}</span>. Your CBE reference <span className="font-mono font-bold text-primary">{transactionRef}</span> is under quick verification.
                </p>
              </div>
              <div className="bg-muted/50 p-4 rounded-xl text-left border border-border/60 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                  <span>What happens next?</span>
                </div>
                <p className="text-muted-foreground">
                  Our team (Nebiyu Mathewos) confirms the transfer in CBE system. Your account will automatically unlock with full features enabled.
                </p>
              </div>
              <Button
                onClick={() => {
                  setSubmittedSuccess(false);
                  onOpenChange(false);
                }}
                className="w-full bg-[#800080] hover:bg-[#6b006b] text-white"
              >
                Got It, Return to Portal
              </Button>
            </div>
          ) : (
            <>
              {/* CBE Bank Account Card */}
              <div className="rounded-xl border-2 border-[#800080]/30 bg-purple-50/50 dark:bg-purple-950/20 p-4 relative space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#800080] text-white flex items-center justify-center font-bold text-sm">
                      CBE
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">Commercial Bank of Ethiopia</h4>
                      <p className="text-xs text-muted-foreground">CBE Mobile Banking / CBE Birr / Counter</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-[#800080] dark:text-purple-300">
                      50 ETB
                    </span>
                    <span className="text-[10px] text-muted-foreground line-through block -mt-1">
                      100 ETB
                    </span>
                  </div>
                </div>

                <div className="bg-white dark:bg-card p-3 rounded-lg border border-border/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <CreditCard className="h-3.5 w-3.5 text-muted-foreground" /> Account Number:
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyAccount}
                      className="h-6 px-2 text-xs font-semibold text-[#800080] hover:text-[#5c005c] hover:bg-purple-50"
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-500" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" /> Copy Number
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="font-mono text-lg font-bold tracking-wider text-foreground select-all bg-muted/40 p-2 rounded text-center">
                    {CBE_ACCOUNT}
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <UserCheck className="h-3.5 w-3.5 text-muted-foreground" /> Account Holder:
                    </span>
                    <span className="font-semibold text-foreground">{CBE_HOLDER}</span>
                  </div>
                </div>

                {/* Instructions */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground flex items-center gap-1">
                    <HelpCircle className="h-3 w-3 text-[#800080]" /> Quick Steps:
                  </p>
                  <ol className="list-decimal list-inside space-y-0.5 pl-1 text-muted-foreground">
                    <li>Open CBE Mobile / CBE Birr and transfer <strong>50 Birr</strong> to <strong>{CBE_ACCOUNT}</strong>.</li>
                    <li>Copy the <strong>Transaction Reference ID</strong> (e.g. <code>FT24...</code> or transaction code).</li>
                    <li>Paste below and click <strong>Submit Verification</strong>.</li>
                  </ol>
                </div>
              </div>

              {/* Submission Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="txn-ref" className="text-xs font-bold text-foreground">
                    CBE Transaction Reference ID <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="txn-ref"
                    placeholder="e.g., FT24263XXXXX or CBE Transaction Code"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    required
                    className="font-mono text-sm uppercase"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Found in your CBE confirmation SMS or receipt.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="sender-name" className="text-xs font-bold text-foreground">
                      Sender Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="sender-name"
                      placeholder="Name on bank account"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      required
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone-num" className="text-xs font-bold text-foreground">
                      Phone Number (Optional)
                    </Label>
                    <Input
                      id="phone-num"
                      placeholder="09... / 07..."
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="w-1/3"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-2/3 bg-[#800080] hover:bg-[#6b006b] text-white font-semibold"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" /> Submit Verification
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
