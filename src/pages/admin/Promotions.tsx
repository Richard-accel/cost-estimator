import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tag, Plus, Pencil, Search, Eye, EyeOff, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Promotion {
  id: string;
  title: string;
  description: string | null;
  hospital_id: string | null;
  procedure_code: string | null;
  package_price: number;
  original_price: number | null;
  includes: string[];
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  badge_text: string | null;
  sort_order: number;
  created_at: string;
}

interface Hospital { id: string; name: string; }
interface Procedure { code: string; name: string; }

const emptyForm = {
  title: "",
  description: "",
  hospital_id: "" as string | null,
  procedure_code: "",
  package_price: "",
  original_price: "",
  includes_text: "",
  valid_from: "",
  valid_until: "",
  is_active: true,
  badge_text: "",
};

export default function AdminPromotions() {
  const [rows, setRows] = useState<Promotion[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null);
  const [reordering, setReordering] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [p, h, pr] = await Promise.all([
      supabase.from("promotions").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: false }),
      supabase.from("hospitals").select("id, name").eq("is_active", true).order("name"),
      supabase.from("procedures").select("code, name").eq("is_active", true).order("code"),
    ]);
    setRows((p.data ?? []) as Promotion[]);
    setHospitals(h.data ?? []);
    setProcedures(pr.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const hospName = (id: string | null) => (id ? hospitals.find((h) => h.id === id)?.name ?? "—" : "All");

  const openAdd = () => { setForm(emptyForm); setEditId(null); setOpen(true); };
  const openEdit = (p: Promotion) => {
    setForm({
      title: p.title,
      description: p.description ?? "",
      hospital_id: p.hospital_id,
      procedure_code: p.procedure_code ?? "",
      package_price: String(p.package_price),
      original_price: p.original_price ? String(p.original_price) : "",
      includes_text: p.includes.join("\n"),
      valid_from: p.valid_from ?? "",
      valid_until: p.valid_until ?? "",
      is_active: p.is_active,
      badge_text: p.badge_text ?? "",
    });
    setEditId(p.id);
    setOpen(true);
  };

  const save = async () => {
    if (!form.title || !form.package_price) {
      toast({ title: "Title and Package Price are required", variant: "destructive" });
      return;
    }
    const maxOrder = rows.length > 0 ? Math.max(...rows.map((r) => r.sort_order)) : 0;
    const payload: Record<string, unknown> = {
      title: form.title,
      description: form.description || null,
      hospital_id: form.hospital_id || null,
      procedure_code: form.procedure_code || null,
      package_price: parseFloat(form.package_price),
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      includes: form.includes_text.split("\n").map((s) => s.trim()).filter(Boolean),
      valid_from: form.valid_from || null,
      valid_until: form.valid_until || null,
      is_active: form.is_active,
      badge_text: form.badge_text || null,
      updated_at: new Date().toISOString(),
    };

    if (editId) {
      const { error } = await supabase.from("promotions").update(payload).eq("id", editId);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Promotion updated" });
    } else {
      payload.sort_order = maxOrder + 1;
      const { error } = await supabase.from("promotions").insert(payload as any);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Promotion created" });
    }
    setOpen(false);
    fetchData();
  };

  const toggleActive = async (p: Promotion) => {
    const newStatus = !p.is_active;
    await supabase.from("promotions").update({ is_active: newStatus, updated_at: new Date().toISOString() }).eq("id", p.id);
    toast({ title: newStatus ? "Promotion activated" : "Promotion deactivated", description: `"${p.title}" is now ${newStatus ? "visible" : "hidden"} on the dashboard.` });
    fetchData();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from("promotions").delete().eq("id", deleteTarget.id);
    toast({ title: "Promotion deleted", description: `"${deleteTarget.title}" has been permanently removed.` });
    setDeleteTarget(null);
    fetchData();
  };

  const moveRow = async (index: number, direction: "up" | "down") => {
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= rows.length) return;

    setReordering(true);
    const current = rows[index];
    const swap = rows[swapIndex];

    // Ensure distinct sort_order values before swapping
    const currentOrder = current.sort_order;
    const swapOrder = swap.sort_order;

    // If sort_orders are the same, assign distinct values first
    if (currentOrder === swapOrder) {
      // Reassign all sort_orders sequentially based on current array order
      const updates = rows.map((r, i) => 
        supabase.from("promotions").update({ sort_order: i + 1 }).eq("id", r.id)
      );
      await Promise.all(updates);
      // Now swap the two target positions
      await Promise.all([
        supabase.from("promotions").update({ sort_order: swapIndex + 1 }).eq("id", current.id),
        supabase.from("promotions").update({ sort_order: index + 1 }).eq("id", swap.id),
      ]);
    } else {
      // Normal swap
      await Promise.all([
        supabase.from("promotions").update({ sort_order: swapOrder }).eq("id", current.id),
        supabase.from("promotions").update({ sort_order: currentOrder }).eq("id", swap.id),
      ]);
    }

    await fetchData();
    setReordering(false);
  };

  const filtered = rows.filter((r) =>
    `${r.title} ${hospName(r.hospital_id)} ${r.procedure_code ?? ""}`.toLowerCase().includes(search.toLowerCase())
  );

  const isSearching = search.trim().length > 0;
  const formatRM = (n: number) => `RM ${n.toLocaleString("en-MY")}`;

  return (
    <TooltipProvider>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Tag className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold font-display text-foreground">Promotion Packages</h1>
          </div>
          <Button onClick={openAdd} className="gap-2"><Plus className="h-4 w-4" /> Add Promotion</Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search promotions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Order</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Hospital</TableHead>
                    <TableHead>Procedure</TableHead>
                    <TableHead className="text-right">Package Price</TableHead>
                    <TableHead className="text-right">Original Price</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No promotions found</TableCell></TableRow>
                  ) : filtered.map((p, idx) => (
                    <TableRow key={p.id} className={!p.is_active ? "opacity-50" : ""}>
                      <TableCell>
                        <div className="flex flex-col items-center gap-0.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            disabled={idx === 0 || isSearching || reordering}
                            onClick={() => moveRow(idx, "up")}
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            disabled={idx === filtered.length - 1 || isSearching || reordering}
                            onClick={() => moveRow(idx, "down")}
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {p.title}
                        {p.badge_text && <Badge variant="secondary" className="ml-2 text-xs">{p.badge_text}</Badge>}
                      </TableCell>
                      <TableCell className="text-sm">{hospName(p.hospital_id)}</TableCell>
                      <TableCell className="font-mono text-sm">{p.procedure_code ?? "—"}</TableCell>
                      <TableCell className="text-right font-medium">{formatRM(p.package_price)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{p.original_price ? formatRM(p.original_price) : "—"}</TableCell>
                      <TableCell className="text-sm">{p.valid_until ? new Date(p.valid_until).toLocaleDateString() : "—"}</TableCell>
                      <TableCell><Badge variant={p.is_active ? "default" : "secondary"}>{p.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost" onClick={() => openEdit(p)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit promotion</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost" onClick={() => toggleActive(p)}>
                                {p.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{p.is_active ? "Deactivate (hide from dashboard)" : "Activate (show on dashboard)"}</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(p)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Permanently delete</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {!loading && filtered.length > 0 && (
              <p className="text-xs text-muted-foreground mt-3">
                {isSearching ? "Reordering disabled while searching. " : ""}
                Use ↑↓ arrows to reorder — Dashboard will reflect this order.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editId ? "Edit Promotion" : "Add Promotion"}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5">
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Total Knee Replacement Package" />
              </div>
              <div className="grid gap-1.5">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description of the package..." rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>Hospital</Label>
                  <Select value={form.hospital_id ?? ""} onValueChange={(v) => setForm({ ...form, hospital_id: v || null })}>
                    <SelectTrigger><SelectValue placeholder="All hospitals" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Hospitals</SelectItem>
                      {hospitals.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Procedure Code</Label>
                  <Select value={form.procedure_code} onValueChange={(v) => setForm({ ...form, procedure_code: v })}>
                    <SelectTrigger><SelectValue placeholder="Select procedure" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {procedures.map((p) => <SelectItem key={p.code} value={p.code}>{p.code} — {p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>Package Price (RM) *</Label>
                  <Input type="number" value={form.package_price} onChange={(e) => setForm({ ...form, package_price: e.target.value })} placeholder="e.g. 25000" />
                </div>
                <div className="grid gap-1.5">
                  <Label>Original Price (RM)</Label>
                  <Input type="number" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} placeholder="e.g. 35000" />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>Package Includes (one per line)</Label>
                <Textarea value={form.includes_text} onChange={(e) => setForm({ ...form, includes_text: e.target.value })} placeholder={"Surgery & anaesthesia fees\nImplant cost\n3 nights single room"} rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>Valid From</Label>
                  <Input type="date" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Valid Until</Label>
                  <Input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>Badge Text</Label>
                  <Input value={form.badge_text} onChange={(e) => setForm({ ...form, badge_text: e.target.value })} placeholder="e.g. Best Seller, New, Save 30%" />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                  <Label>Active</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save}>{editId ? "Update" : "Create"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Promotion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete <strong>"{deleteTarget?.title}"</strong>? This action cannot be undone. If you just want to hide it from the dashboard, use the deactivate button instead.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete Permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
