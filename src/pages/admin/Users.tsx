import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Search, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const ALL_ROLES = ["admin", "group", "hospital", "doctor"] as const;
type AppRole = (typeof ALL_ROLES)[number];

interface UserWithRoles {
  id: string;
  email: string | null;
  full_name: string | null;
  hospital_id: string | null;
  doctor_id: string | null;
  roles: AppRole[];
}

interface Hospital { id: string; name: string; }
interface Doctor { id: string; name: string; }

export default function AdminUsers() {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [saving, setSaving] = useState(false);

  // Form state
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formName, setFormName] = useState("");
  const [formHospital, setFormHospital] = useState("");
  const [formDoctor, setFormDoctor] = useState("");
  const [formRoles, setFormRoles] = useState<AppRole[]>([]);
  const [editUserId, setEditUserId] = useState<string | null>(null);

  // Delete confirm
  const [deleteUser, setDeleteUser] = useState<UserWithRoles | null>(null);
  const [deleting, setDeleting] = useState(false);

  const callManageUsers = async (body: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await supabase.functions.invoke("manage-users", {
      body,
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    if (res.error) throw new Error(res.error.message);
    if (res.data?.error) throw new Error(res.data.error);
    return res.data;
  };

  const fetchAll = async () => {
    setLoading(true);
    const [profilesRes, rolesRes, hospRes, docRes] = await Promise.all([
      supabase.from("profiles").select("id, email, full_name, hospital_id, doctor_id"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("hospitals").select("id, name").eq("is_active", true).order("name"),
      supabase.from("doctors").select("id, name").eq("is_active", true).order("name"),
    ]);

    const rolesMap = new Map<string, AppRole[]>();
    (rolesRes.data ?? []).forEach((r) => {
      const existing = rolesMap.get(r.user_id) ?? [];
      existing.push(r.role as AppRole);
      rolesMap.set(r.user_id, existing);
    });

    setUsers(
      (profilesRes.data ?? []).map((p) => ({
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        hospital_id: p.hospital_id,
        doctor_id: p.doctor_id,
        roles: rolesMap.get(p.id) ?? [],
      }))
    );
    setHospitals(hospRes.data ?? []);
    setDoctors(docRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const resetForm = () => {
    setFormEmail("");
    setFormPassword("");
    setFormName("");
    setFormHospital("");
    setFormDoctor("");
    setFormRoles([]);
    setEditUserId(null);
  };

  const openAdd = () => {
    resetForm();
    setDialogMode("add");
    setDialogOpen(true);
  };

  const openEdit = (u: UserWithRoles) => {
    setDialogMode("edit");
    setEditUserId(u.id);
    setFormEmail(u.email ?? "");
    setFormName(u.full_name ?? "");
    setFormHospital(u.hospital_id ?? "");
    setFormDoctor(u.doctor_id ?? "");
    setFormRoles([...u.roles]);
    setFormPassword("");
    setDialogOpen(true);
  };

  const toggleRole = (role: AppRole) => {
    setFormRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (dialogMode === "add") {
        if (!formEmail || !formPassword) {
          toast({ title: "Error", description: "Email and password are required", variant: "destructive" });
          setSaving(false);
          return;
        }
        await callManageUsers({
          action: "create",
          email: formEmail,
          password: formPassword,
          full_name: formName,
          hospital_id: formHospital || null,
          doctor_id: formDoctor || null,
          roles: formRoles,
        });
        toast({ title: "User created", description: `${formEmail} has been added.` });
      } else {
        // Update profile
        await callManageUsers({
          action: "update",
          user_id: editUserId,
          full_name: formName,
          hospital_id: formHospital || null,
          doctor_id: formDoctor || null,
        });

        // Sync roles
        const existingUser = users.find((u) => u.id === editUserId);
        if (existingUser) {
          const toAdd = formRoles.filter((r) => !existingUser.roles.includes(r));
          const toRemove = existingUser.roles.filter((r) => !formRoles.includes(r));
          for (const role of toRemove) {
            await supabase.from("user_roles").delete().eq("user_id", editUserId!).eq("role", role);
          }
          for (const role of toAdd) {
            await supabase.from("user_roles").insert({ user_id: editUserId!, role });
          }
        }
        toast({ title: "User updated", description: `${formEmail} has been updated.` });
      }
      setDialogOpen(false);
      fetchAll();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    setDeleting(true);
    try {
      await callManageUsers({ action: "delete", user_id: deleteUser.id });
      toast({ title: "User deleted", description: `${deleteUser.email} has been removed.` });
      setDeleteUser(null);
      fetchAll();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const hospName = (id: string | null) => (id ? hospitals.find((h) => h.id === id)?.name ?? "—" : "—");
  const docName = (id: string | null) => (id ? doctors.find((d) => d.id === id)?.name ?? "—" : "—");

  const filtered = users.filter((u) =>
    `${u.email} ${u.full_name}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold font-display text-foreground">User Management</h1>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" /> Add User
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Hospital</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No users found</TableCell></TableRow>
                ) : filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                    <TableCell className="text-sm">{u.email}</TableCell>
                    <TableCell className="text-sm">{hospName(u.hospital_id)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.roles.length === 0 ? (
                          <span className="text-muted-foreground text-sm">No roles</span>
                        ) : u.roles.map((r) => (
                          <Badge key={r} variant="secondary" className="text-xs capitalize">{r}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(u)} title="Edit user">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteUser(u)} title="Delete user" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogMode === "add" ? "Add New User" : "Edit User"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {dialogMode === "add" && (
              <>
                <div className="space-y-1.5">
                  <Label>Email *</Label>
                  <Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="user@example.com" />
                </div>
                <div className="space-y-1.5">
                  <Label>Password *</Label>
                  <Input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="Minimum 6 characters" />
                </div>
              </>
            )}
            {dialogMode === "edit" && (
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={formEmail} disabled className="bg-muted" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Full name" />
            </div>
            <div className="space-y-1.5">
              <Label>Hospital</Label>
              <Select value={formHospital || "none"} onValueChange={(v) => setFormHospital(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Select hospital" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {hospitals.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Doctor Profile</Label>
              <Select value={formDoctor || "none"} onValueChange={(v) => setFormDoctor(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {doctors.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Roles</Label>
              <div className="grid grid-cols-2 gap-2">
                {ALL_ROLES.map((role) => (
                  <label key={role} className="flex items-center gap-2.5 cursor-pointer rounded-lg border border-border p-2.5 hover:bg-muted/50 transition-colors">
                    <Checkbox checked={formRoles.includes(role)} onCheckedChange={() => toggleRole(role)} />
                    <span className="capitalize text-sm font-medium">{role}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : dialogMode === "add" ? "Create User" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <strong>{deleteUser?.email}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
