import { useEffect, useState, useCallback } from "react";
import {
  Users,
  Search,
  Mail,
  Calendar,
  UserCheck,
  UserX,
  Edit2,
  Trash2,
  BookOpen,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";
import { adminApi } from "@/api/admin";
import type { User } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { formatDate } from "@/utils";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import { TableSkeleton } from "@/components/common/Skeleton";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useToast } from "@/hooks/useToast";

export default function AdminStudentsPage() {
  const { toast } = useToast();
  const [students, setStudents] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [loading, setLoading] = useState(true);

  // Edit dialog state
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("student");
  const [editIsActive, setEditIsActive] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete dialog state
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const PER_PAGE = 20;

  const load = useCallback(async (p: number, s: string) => {
    setLoading(true);
    try {
      const r = await adminApi.getStudents({
        page: p,
        search: s || undefined,
      });
      setStudents(r.data.items);
      setTotal(r.data.total);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load student directory.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load(page, search);
  }, [page, search, load]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleToggleStatus = async (student: User) => {
    try {
      const res = await adminApi.toggleStudentStatus(student.id);
      setStudents(prev =>
        prev.map(s => (s.id === student.id ? { ...s, is_active: res.data.is_active } : s))
      );
      toast({
        title: res.data.is_active ? "Student Activated" : "Student Deactivated",
        description: `${student.full_name}'s account status has been updated.`,
      });
    } catch {
      toast({
        title: "Action failed",
        description: "Could not update student status.",
        variant: "destructive",
      });
    }
  };

  const openEditModal = (student: User) => {
    setEditingStudent(student);
    setEditFullName(student.full_name);
    setEditEmail(student.email);
    setEditRole(student.role);
    setEditIsActive(student.is_active);
  };

  const handleSaveEdit = async () => {
    if (!editingStudent) return;
    setSavingEdit(true);
    try {
      await adminApi.updateStudent(editingStudent.id, {
        full_name: editFullName.trim(),
        email: editEmail.trim(),
        role: editRole,
        is_active: editIsActive,
      });

      setStudents(prev =>
        prev.map(s =>
          s.id === editingStudent.id
            ? {
                ...s,
                full_name: editFullName.trim(),
                email: editEmail.trim(),
                role: editRole as any,
                is_active: editIsActive,
              }
            : s
        )
      );

      toast({
        title: "Student Updated",
        description: "Profile changes have been saved.",
      });
      setEditingStudent(null);
    } catch {
      toast({
        title: "Update failed",
        description: "Please ensure email is not already in use.",
        variant: "destructive",
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await adminApi.deleteStudent(deleteId);
      setStudents(prev => prev.filter(s => s.id !== deleteId));
      setTotal(prev => Math.max(0, prev - 1));
      toast({
        title: "Account Deleted",
        description: "The user account was removed successfully.",
      });
      setDeleteId(null);
    } catch {
      toast({
        title: "Delete failed",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredStudents = students.filter(s => {
    if (statusFilter === "active") return s.is_active;
    if (statusFilter === "inactive") return !s.is_active;
    return true;
  });

  const activeCount = students.filter(s => s.is_active).length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Student Directory & Registration Hub"
        description="See who joined Wachemo CS, manage user accounts, check academic years, and toggle permissions."
        icon={Users}
      />

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border flex items-center gap-3.5 shadow-xs">
          <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xs text-muted-foreground uppercase tracking-wider font-semibold">Total Students Joined</p>
            <p className="text-2xl font-black text-foreground">{total}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border flex items-center gap-3.5 shadow-xs">
          <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xs text-muted-foreground uppercase tracking-wider font-semibold">Active Accounts</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{activeCount}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border flex items-center gap-3.5 shadow-xs">
          <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xs text-muted-foreground uppercase tracking-wider font-semibold">Recent Registrations</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{Math.min(total, 5)} this week</p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by student name or email…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button variant="outline" onClick={handleSearch}>Search</Button>
          {search && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearch("");
                setSearchInput("");
                setPage(1);
              }}
            >
              Clear
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {(["all", "active", "inactive"] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                statusFilter === st
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Students list */}
      {loading ? (
        <TableSkeleton />
      ) : filteredStudents.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? "No students match your search" : "No students yet"}
          description={search ? "Try adjusting your search query." : "Students will appear here once they register."}
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
            <table className="data-table w-full text-sm text-left">
              <thead className="bg-muted/60 text-muted-foreground text-xs uppercase font-mono">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Student Name</th>
                  <th className="py-3.5 px-4 font-semibold">Email Address</th>
                  <th className="py-3.5 px-4 font-semibold">Academic Year</th>
                  <th className="py-3.5 px-4 font-semibold">Joined At</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {student.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-foreground leading-tight">{student.full_name}</p>
                          <p className="text-2xs text-muted-foreground font-mono mt-0.5">
                            ID: #{student.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground/70" />
                        <span>{student.email}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {student.selected_year_name ? (
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/25 text-2xs gap-1">
                          <BookOpen className="h-2.5 w-2.5" />
                          {student.selected_year_name}
                        </Badge>
                      ) : (
                        <span className="text-2xs text-muted-foreground italic">Not chosen yet</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground text-xs font-mono">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(student.created_at)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {student.is_active ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-2xs gap-1 font-semibold">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 text-2xs gap-1 font-semibold">
                          <XCircle className="h-3 w-3" /> Inactive
                        </Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2.5 text-xs"
                          onClick={() => handleToggleStatus(student)}
                          title={student.is_active ? "Deactivate student" : "Activate student"}
                        >
                          {student.is_active ? (
                            <UserX className="h-3.5 w-3.5 text-amber-600" />
                          ) : (
                            <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2.5 text-xs text-primary"
                          onClick={() => openEditModal(student)}
                          title="Edit student details"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive-subtle"
                          onClick={() => setDeleteId(student.id)}
                          title="Delete account"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredStudents.map(student => (
              <Card key={student.id} className="border border-border">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                        {student.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-foreground">{student.full_name}</p>
                        <p className="text-2xs text-muted-foreground font-mono">
                          ID: #{student.id}
                        </p>
                      </div>
                    </div>
                    {student.is_active ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-2xs">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 text-2xs">Inactive</Badge>
                    )}
                  </div>

                  <div className="text-xs space-y-1 text-muted-foreground pt-1 border-t border-border">
                    <p className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {student.email}</p>
                    <p className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Joined {formatDate(student.created_at)}</p>
                    {student.selected_year_name && (
                      <p className="flex items-center gap-1.5 text-primary"><BookOpen className="h-3.5 w-3.5" /> {student.selected_year_name}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8"
                      onClick={() => handleToggleStatus(student)}
                    >
                      {student.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 text-primary"
                      onClick={() => openEditModal(student)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-8 text-destructive"
                      onClick={() => setDeleteId(student.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground font-mono">
            Page {page} of {totalPages} · {total} students total
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      <Dialog open={editingStudent !== null} onOpenChange={open => !open && setEditingStudent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Sparkles className="h-4 w-4 text-primary" />
              Edit Student Details
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Full Name</Label>
              <Input
                value={editFullName}
                onChange={e => setEditFullName(e.target.value)}
                placeholder="Nebiyu Mathewos"
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Email Address</Label>
              <Input
                type="email"
                value={editEmail}
                onChange={e => setEditEmail(e.target.value)}
                placeholder="neba@gmail.com"
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Role</Label>
              <select
                value={editRole}
                onChange={e => setEditRole(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-card border border-border text-sm text-foreground"
              >
                <option value="student">Student</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="edit_is_active"
                checked={editIsActive}
                onChange={e => setEditIsActive(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary"
              />
              <Label htmlFor="edit_is_active" className="text-xs cursor-pointer">
                Account is Active (Allow student to log in)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setEditingStudent(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={savingEdit || !editFullName.trim() || !editEmail.trim()}
              onClick={handleSaveEdit}
              className="bg-primary text-primary-foreground font-bold"
            >
              {savingEdit ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open: boolean) => {
          if (!open) setDeleteId(null);
        }}
        title="Delete Student Account?"
        description="Are you sure you want to permanently delete this account and all associated quiz attempts? This action cannot be undone."
        confirmLabel={isDeleting ? "Deleting..." : "Delete Permanently"}
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
