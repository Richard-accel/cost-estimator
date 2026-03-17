import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, Pencil, Search, Power } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Hospital = Tables<"hospitals">;

const empty: Partial<Hospital> = { code: "", name: "", address: "", state: "", is_active: true };

export default function AdminHospitals() {
  const [rows, setRows] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from("hospitals").select("*").order("name");
    setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const openAdd = () => { setForm(empty); setEditId(null); setOpen(true); };
  const openEdit = (h: Hospital) => { setForm(h); setEditId(h.id); setOpen(true); };

  const save = async () => {
    if (!form.code || !form.name) { toast({ title: "Code and Name are required", variant: "destructive" }); return; }
    if (editId) {
      const { error } = await supabase.from("hospitals").update({ code: form.code!, name: form.name!, address: form.address, state: form.state, is_active: form.is_active, updated_at: new Date().toISOString() }).eq("id", editId);
      if (error) { toast({ title: "Error updating", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Hospital updated" });
    } else {
      const { error } = await supabase.from("hospitals").insert({ code: form.code!, name: form.name!, address: form.address ?? null, state: form.state ?? null });
      if (error) { toast({ title: "Error creating", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Hospital created" });
    }
    setOpen(false);
    fetch();
  };

  const toggleActive = async (h: Hospital) => {
    await supabase.from("hospitals").update({ is_active: !h.is_active, updated_at: new Date().toISOString() }).eq("id", h.id);
    fetch();
  };

  const filtered = rows.filter(r => `${r.code} ${r.name} ${r.state}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold font-display text-foreground">Manage Hospitals</h1>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-1" />Add Hospital</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search hospitals..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No hospitals found</TableCell></TableRow>
              ) : filtered.map(h => (
                <TableRow key={h.id}>
                  <TableCell className="font-mono text-sm">{h.code}</TableCell>
                  <TableCell className="font-medium">{h.name}</TableCell>
                  <TableCell>{h.state ?? "—"}</TableCell>
                  <TableCell><Badge variant={h.is_active ? "default" : "secondary"}>{h.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(h)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => toggleActive(h)}><Power className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit Hospital" : "Add Hospital"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Code *</Label>
              <Input value={form.code ?? ""} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g. KPJ-AMP" />
            </div>
            <div className="grid gap-1.5">
              <Label>Name *</Label>
              <Input value={form.name ?? ""} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Hospital name" />
            </div>
            <div className="grid gap-1.5">
              <Label>Address</Label>
              <Input value={form.address ?? ""} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>State</Label>
              <Input value={form.state ?? ""} onChange={e => setForm({ ...form, state: e.target.value })} placeholder="e.g. Selangor" />
            </div>
          </div>
          <DialogFooter><Button onClick={save}>{editId ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
