import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Plus, Pencil, Search, Power } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Doctor = Tables<"doctors">;
type Hospital = Tables<"hospitals">;

const empty = { code: "", name: "", specialty: "", hospital_id: "" as string | null, is_active: true };

export default function AdminDoctors() {
  const [rows, setRows] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    const [d, h] = await Promise.all([
      supabase.from("doctors").select("*").order("name"),
      supabase.from("hospitals").select("*").eq("is_active", true).order("name"),
    ]);
    setRows(d.data ?? []);
    setHospitals(h.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const hospitalName = (id: string | null) => hospitals.find(h => h.id === id)?.name ?? "—";

  const openAdd = () => { setForm(empty); setEditId(null); setOpen(true); };
  const openEdit = (d: Doctor) => { setForm({ code: d.code, name: d.name, specialty: d.specialty ?? "", hospital_id: d.hospital_id, is_active: d.is_active }); setEditId(d.id); setOpen(true); };

  const save = async () => {
    if (!form.code || !form.name) { toast({ title: "Code and Name are required", variant: "destructive" }); return; }
    const payload = { code: form.code, name: form.name, specialty: form.specialty || null, hospital_id: form.hospital_id || null, updated_at: new Date().toISOString() };
    if (editId) {
      const { error } = await supabase.from("doctors").update(payload).eq("id", editId);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Doctor updated" });
    } else {
      const { error } = await supabase.from("doctors").insert(payload);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Doctor created" });
    }
    setOpen(false);
    fetch();
  };

  const toggleActive = async (d: Doctor) => {
    await supabase.from("doctors").update({ is_active: !d.is_active, updated_at: new Date().toISOString() }).eq("id", d.id);
    fetch();
  };

  const filtered = rows.filter(r => `${r.code} ${r.name} ${r.specialty}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Stethoscope className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold font-display text-foreground">Manage Doctors</h1>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-1" />Add Doctor</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search doctors..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>Hospital</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No doctors found</TableCell></TableRow>
              ) : filtered.map(d => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono text-sm">{d.code}</TableCell>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell>{d.specialty ?? "—"}</TableCell>
                  <TableCell>{hospitalName(d.hospital_id)}</TableCell>
                  <TableCell><Badge variant={d.is_active ? "default" : "secondary"}>{d.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(d)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => toggleActive(d)}><Power className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit Doctor" : "Add Doctor"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Code *</Label>
              <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g. DR001" />
            </div>
            <div className="grid gap-1.5">
              <Label>Name *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Doctor name" />
            </div>
            <div className="grid gap-1.5">
              <Label>Specialty</Label>
              <Input value={form.specialty ?? ""} onChange={e => setForm({ ...form, specialty: e.target.value })} placeholder="e.g. Orthopaedics" />
            </div>
            <div className="grid gap-1.5">
              <Label>Hospital</Label>
              <Select value={form.hospital_id ?? ""} onValueChange={v => setForm({ ...form, hospital_id: v || null })}>
                <SelectTrigger><SelectValue placeholder="Select hospital" /></SelectTrigger>
                <SelectContent>
                  {hospitals.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={save}>{editId ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
