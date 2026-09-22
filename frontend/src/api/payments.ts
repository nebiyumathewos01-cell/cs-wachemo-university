import apiClient from "./client";
import type {
  Payment,
  PaymentSubmitRequest,
  PaymentStatusResponse,
  PaginatedPayments,
  DemoContentResponse,
} from "@/types";

export const paymentApi = {
  // Student
  getStatus: () =>
    apiClient.get<PaymentStatusResponse>("/payments/status"),

  submitPayment: (data: PaymentSubmitRequest) =>
    apiClient.post<Payment>("/payments/submit", data),

  getHistory: () =>
    apiClient.get<Payment[]>("/payments/history"),

  // Public / Demo
  getDemoContent: () =>
    apiClient.get<DemoContentResponse>("/payments/demo-content"),

  // Admin
  adminListPayments: (page = 1, perPage = 20, status?: string, search?: string) =>
    apiClient.get<PaginatedPayments>("/payments/admin/list", {
      params: { page, per_page: perPage, status_filter: status, search },
    }),

  adminApprovePayment: (paymentId: number) =>
    apiClient.post<Payment>(`/payments/admin/${paymentId}/approve`),

  adminRejectPayment: (paymentId: number, adminNotes?: string) =>
    apiClient.post<Payment>(`/payments/admin/${paymentId}/reject`, {
      status: "rejected",
      admin_notes: adminNotes,
    }),

  adminToggleStudentPayment: (userId: number) =>
    apiClient.patch<{ user_id: number; is_paid: boolean; payment_status: string; message: string }>(
      `/payments/admin/student/${userId}/toggle`
    ),
};
