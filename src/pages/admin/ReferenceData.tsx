import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Layers, Plus, Pencil, Power } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type RefItem = { id: string; code: string; name: string; is_active: boolean; created_at: string };
type TableName = "ward_types" | "episode_types" | "payor_types";

const tabs: { value: TableName; label: string }[] = [
  { value: "ward_types", label: "Ward Types" },
  { value: "episode_types", label: "Episode Types" },
  { value: "payor_types", label: "Payor Types" },
];

function RefTable({ table }: { table: TableName }) {
  const [rows, setRows] = useState<RefItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: "", name: "" });
  const [editId, setEditId] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from(table).select("*").order("code");
    setRows((data as RefItem[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [table]);

  const openAdd = () => { setForm({ code: "", name: "" }); setEditId(null); setOpen(true); };
  const openEdit = (r: RefItem) => { setForm({ code: r.code, name: r.name }); setEditId(r.id); setOpen(true); };

  const save = async () => {
    if (!form.code || !form.name) { toast({ title: "Code and Name are required", variant: "destructive" }); return; }
    if (editId) {
      const { error } = await supabase.from(table).update({ code: form.code, name: form.name }).eq("id", editId);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Updated" });
    } else {
      const { error } = await supabase.from(table).insert({ code: form.code, name: form.name });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Created" });
    }
    setOpen(false);
    fetch();
  };

  const toggleActive = async (r: RefItem) => {
    await supabase.from(table).update({ is_active: !r.is_active }).eq("id", r.id);
    fetch();
  };

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1" />Add</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
          ) : rows.length === 0 ? (
            <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No records</TableCell></TableRow>
          ) : rows.map(r => (
            <TableRow key={r.id}>
              <TableCell className="font-mono text-sm">{r.code}</TableCell>
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell><Badge variant={r.is_active ? "default" : "secondary"}>{r.is_active ? "Active" : "Inactive"}</Badge></TableCell>
              <TableCell className="text-right space-x-1">
                <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => toggleActive(r)}><Power className="h-4 w-4" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit" : "Add"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Code *</Label>
              <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Name *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
          </div>
          <DialogFooter><Button onClick={save}>{editId ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function AdminReferenceData() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Layers className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold font-display text-foreground">Reference Data</h1>
      </div>
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="ward_types">
            <TabsList>
              {tabs.map(t => <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>)}
            </TabsList>
            {tabs.map(t => (
              <TabsContent key={t.value} value={t.value}>
                <RefTable table={t.value} />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
