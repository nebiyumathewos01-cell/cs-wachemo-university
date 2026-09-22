import { useState, useEffect, useCallback } from "react";
import { paymentApi } from "@/api/payments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";
import type { Payment, PaginatedPayments } from "@/types";
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Copy,
  RefreshCw,
  Loader2,
  Check,
} from "lucide-react";

export default function AdminPaymentsPage() {
  const { toast } = useToast();
  const [data, setData] = useState<PaginatedPayments | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Reject Dialog State
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await paymentApi.adminListPayments(
        page,
        20,
        statusFilter === "all" ? undefined : statusFilter,
        debouncedSearch || undefined
      );
      setData(res.data);
    } catch (err: any) {
      toast({
        title: "Error loading payments",
        description: err?.response?.data?.detail || "Could not fetch payment records.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, debouncedSearch, toast]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleApprove = async (p: Payment) => {
    setActionLoading(true);
    try {
      await paymentApi.adminApprovePayment(p.id);
      toast({
        title: "Payment Approved! 🎉",
        description: `Access granted for ${p.user_full_name || "student"}.`,
      });
      loadPayments();
    } catch (err: any) {
      toast({
        title: "Approval Failed",
        description: err?.response?.data?.detail || "Could not approve payment.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReject = (p: Payment) => {
    setSelectedPayment(p);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedPayment) return;
    setActionLoading(true);
    try {
      await paymentApi.adminRejectPayment(selectedPayment.id, rejectReason.trim() || undefined);
      toast({
        title: "Payment Rejected",
        description: `Payment ${selectedPayment.transaction_reference} was rejected.`,
      });
      setRejectDialogOpen(false);
      loadPayments();
    } catch (err: any) {
      toast({
        title: "Action Failed",
        description: err?.response?.data?.detail || "Could not reject payment.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${text} copied to clipboard.`,
    });
  };

  const pendingCount = data?.pending_count ?? 0;
  const approvedCount = data?.approved_count ?? 0;
  const rejectedCount = data?.rejected_count ?? 0;
  const totalCollected = approvedCount * 50;

  return (
    <div className="max-w-6xl mx-auto pb-20 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Payment Verification</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review CBE bank transaction references and manage student access activations (50 ETB).
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadPayments}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground font-medium">Pending Requests</span>
              <p className="text-2xl font-bold text-amber-500 mt-1">{pendingCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground font-medium">Approved (Paid)</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{approvedCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground font-medium">Total Collected</span>
              <p className="text-2xl font-bold text-foreground mt-1">{totalCollected} ETB</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-[#800080] dark:text-purple-400 flex items-center justify-center">
              <CreditCard className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground font-medium">Rejected</span>
              <p className="text-2xl font-bold text-rose-500 mt-1">{rejectedCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <XCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border-border/80 shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "all", label: "All Submissions" },
              { id: "pending", label: `Pending (${pendingCount})` },
              { id: "approved", label: "Approved" },
              { id: "rejected", label: "Rejected" },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={statusFilter === tab.id ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                className={`text-xs font-semibold rounded-lg shrink-0 ${
                  statusFilter === tab.id
                    ? "bg-[#800080] hover:bg-[#6b006b] text-white"
                    : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reference, name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card className="border-border/80 shadow-sm overflow-hidden">
        <CardHeader className="py-3.5 px-5 bg-muted/20 border-b border-border/40">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span>Payment Records ({data?.total ?? 0})</span>
            <span className="text-xs font-normal text-muted-foreground">
              CBE Account: <strong>1000503206505</strong> (Nebiyu Mathewos)
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <span className="text-xs">Loading payment records...</span>
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground space-y-2">
              <CreditCard className="h-10 w-10 mx-auto text-muted-foreground/40" />
              <p className="text-sm font-medium">No payment records found.</p>
              <p className="text-xs text-muted-foreground/80">
                {statusFilter !== "all"
                  ? `There are currently no ${statusFilter} payments.`
                  : "No students have submitted payment references yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground border-b border-border/60 uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Student Account</th>
                    <th className="py-3 px-4">CBE Reference ID</th>
                    <th className="py-3 px-4">Depositor Name & Phone</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date Submitted</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {data.items.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      {/* Student Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-foreground">
                          {p.user_full_name || "Unknown Student"}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {p.user_email}
                        </div>
                      </td>

                      {/* Transaction Reference */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-foreground bg-muted/70 px-2 py-0.5 rounded text-[11px] select-all">
                            {p.transaction_reference}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(p.transaction_reference)}
                            className="text-muted-foreground hover:text-foreground p-1"
                            title="Copy reference"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </td>

                      {/* Sender Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-foreground">{p.sender_name}</div>
                        {p.phone_number && (
                          <div className="text-[11px] text-muted-foreground font-mono">
                            {p.phone_number}
                          </div>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-foreground">
                          {p.amount} {p.currency}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {p.status === "approved" ? (
                          <Badge className="bg-emerald-600 text-white border-none text-[10px]">
                            Approved
                          </Badge>
                        ) : p.status === "rejected" ? (
                          <Badge variant="destructive" className="text-[10px]">
                            Rejected
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-none text-[10px] animate-pulse">
                            Pending
                          </Badge>
                        )}
                        {p.admin_notes && (
                          <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5 max-w-[150px] truncate" title={p.admin_notes}>
                            Note: {p.admin_notes}
                          </p>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-muted-foreground text-[11px]">
                        {new Date(p.created_at).toLocaleString([], {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {p.status !== "approved" && (
                            <Button
                              size="sm"
                              disabled={actionLoading}
                              onClick={() => handleApprove(p)}
                              className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                            >
                              <Check className="h-3.5 w-3.5 mr-1" /> Approve
                            </Button>
                          )}

                          {p.status !== "rejected" && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={actionLoading}
                              onClick={() => handleOpenReject(p)}
                              className="h-7 px-2 text-xs border-rose-200 text-rose-700 dark:text-rose-400 hover:bg-rose-50"
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {data && data.pages > 1 && (
            <div className="p-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Page {data.page} of {data.pages} ({data.total} total)
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-7 text-xs"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.page >= data.pages}
                  onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                  className="h-7 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Payment Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Payment Reference</DialogTitle>
            <DialogDescription className="text-xs">
              Rejecting payment for {selectedPayment?.user_full_name} (Reference:{" "}
              <span className="font-mono font-bold text-foreground">
                {selectedPayment?.transaction_reference}
              </span>
              ).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label htmlFor="reject-reason" className="text-xs font-semibold">
              Reason for Rejection (Optional - shown to student)
            </Label>
            <Textarea
              id="reject-reason"
              placeholder="e.g. Transaction reference not found in CBE statement, or invalid amount."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="text-xs"
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={actionLoading}
              onClick={handleConfirmReject}
            >
              {actionLoading ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
