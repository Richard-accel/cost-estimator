import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Database, Search, TrendingUp } from "lucide-react";

interface Average {
  id: string;
  hospital_id: string;
  doctor_id: string | null;
  procedure_code: string;
  episode_type: string | null;
  ward_type: string | null;
  diagnosis_code: string | null;
  comorbidity: string | null;
  age_group: string | null;
  gender: string | null;
  p50_total: number | null;
  p75_total: number | null;
  p50_breakdown: Record<string, number> | null;
  p75_breakdown: Record<string, number> | null;
  sample_size: number | null;
  data_years: string[] | null;
  calculated_at: string;
}

interface Hospital { id: string; name: string; }
interface Doctor { id: string; name: string; }
interface Proc { code: string; name: string; }

const fmt = (v: number | null) =>
  v != null ? `RM ${v.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";

const breakdownLabels: Record<string, string> = {
  consultant: "Consultant Fees",
  surgery: "Surgery & Procedure",
  radiology: "Radiology",
  lab: "Laboratory",
  pharmacy: "Pharmacy",
  room: "Room & Board",
};

export default function AdminAverages() {
  const [rows, setRows] = useState<Average[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [procedures, setProcedures] = useState<Proc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [hospitalFilter, setHospitalFilter] = useState("all");
  const [selected, setSelected] = useState<Average | null>(null);

  useEffect(() => {
    Promise.all([
      supabase.from("calculated_averages").select("*").order("procedure_code"),
      supabase.from("hospitals").select("id, name").eq("is_active", true).order("name"),
      supabase.from("doctors").select("id, name").eq("is_active", true).order("name"),
      supabase.from("procedures").select("code, name").eq("is_active", true).order("code"),
    ]).then(([a, h, d, p]) => {
      setRows((a.data ?? []) as Average[]);
      setHospitals(h.data ?? []);
      setDoctors(d.data ?? []);
      setProcedures(p.data ?? []);
      setLoading(false);
    });
  }, []);

  const hospName = (id: string) => hospitals.find((h) => h.id === id)?.name ?? id.slice(0, 8);
  const docName = (id: string | null) => (id ? doctors.find((d) => d.id === id)?.name ?? "—" : "Hospital-wide");
  const procName = (code: string) => procedures.find((p) => p.code === code)?.name ?? code;

  const filtered = rows.filter((r) => {
    if (hospitalFilter !== "all" && r.hospital_id !== hospitalFilter) return false;
    const s = `${procName(r.procedure_code)} ${r.procedure_code} ${docName(r.doctor_id)} ${r.episode_type ?? ""} ${r.ward_type ?? ""}`.toLowerCase();
    return s.includes(search.toLowerCase());
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Database className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold font-display text-foreground">Calculated Averages</h1>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search procedure, doctor, episode..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={hospitalFilter} onValueChange={setHospitalFilter}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="Filter by hospital" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Hospitals</SelectItem>
                {hospitals.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hospital</TableHead>
                  <TableHead>Procedure</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Episode</TableHead>
                  <TableHead>Ward</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead className="text-right">P50 (Median)</TableHead>
                  <TableHead className="text-right">P75</TableHead>
                  <TableHead className="text-right">Sample</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No averages found.</TableCell></TableRow>
                ) : filtered.map((r) => (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelected(r)}
                  >
                    <TableCell className="text-sm max-w-[140px] truncate" title={hospName(r.hospital_id)}>{hospName(r.hospital_id)}</TableCell>
                    <TableCell className="text-sm font-medium max-w-[200px] truncate" title={procName(r.procedure_code)}>{procName(r.procedure_code)}</TableCell>
                    <TableCell className="text-sm">{docName(r.doctor_id)}</TableCell>
                    <TableCell>{r.episode_type ?? "—"}</TableCell>
                    <TableCell>{r.ward_type ?? "—"}</TableCell>
                    <TableCell>{r.gender ?? "—"}</TableCell>
                    <TableCell className="text-right font-medium">{fmt(r.p50_total)}</TableCell>
                    <TableCell className="text-right font-medium">{fmt(r.p75_total)}</TableCell>
                    <TableCell className="text-right">{r.sample_size ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {!loading && filtered.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3">Showing {filtered.length} of {rows.length} records — click a row for details</p>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-lg">
                  {procName(selected.procedure_code)}
                  <span className="ml-2 text-xs font-mono text-muted-foreground">{selected.procedure_code}</span>
                </DialogTitle>
              </DialogHeader>

              {/* P50 / P75 summary cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
                  <div className="text-xs text-muted-foreground font-medium">P50 (Median)</div>
                  <div className="text-xl font-bold font-display text-foreground">{fmt(selected.p50_total)}</div>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground font-medium">P75 (Upper Quartile)</div>
                  <div className="text-xl font-bold font-display text-foreground">{fmt(selected.p75_total)}</div>
                </div>
              </div>

              {/* Metadata grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                {[
                  ["Hospital", hospName(selected.hospital_id)],
                  ["Doctor", docName(selected.doctor_id)],
                  ["Episode Type", selected.episode_type ?? "—"],
                  ["Ward Type", selected.ward_type ?? "—"],
                  ["Diagnosis", selected.diagnosis_code ?? "—"],
                  ["Comorbidity", selected.comorbidity ?? "—"],
                  ["Age Group", selected.age_group ?? "—"],
                  ["Gender", selected.gender ?? "—"],
                  ["Sample Size", `${selected.sample_size ?? 0} cases`],
                  ["Data Years", (selected.data_years ?? []).join(", ") || "—"],
                  ["Calculated", new Date(selected.calculated_at).toLocaleDateString()],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-border bg-card p-2.5">
                    <div className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</div>
                    <div className="font-medium text-foreground truncate" title={String(value)}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Fee Breakdown table */}
              {selected.p50_breakdown && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-primary" /> Fee Breakdown
                  </h4>
                  <div className="rounded-lg border border-border divide-y divide-border text-sm">
                    <div className="grid grid-cols-3 px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/30">
                      <span>Category</span>
                      <span className="text-right">P50</span>
                      <span className="text-right">P75</span>
                    </div>
                    {Object.entries(selected.p50_breakdown).map(([key, val]) => (
                      <div key={key} className="grid grid-cols-3 px-3 py-1.5">
                        <span className="text-foreground">{breakdownLabels[key] ?? key}</span>
                        <span className="text-right font-medium">{fmt(val)}</span>
                        <span className="text-right font-medium">{fmt((selected.p75_breakdown as any)?.[key] ?? null)}</span>
                      </div>
                    ))}
                    <div className="grid grid-cols-3 px-3 py-2 font-bold bg-muted/20">
                      <span>Total</span>
                      <span className="text-right">{fmt(selected.p50_total)}</span>
                      <span className="text-right">{fmt(selected.p75_total)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Calculation methodology */}
              <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs text-muted-foreground space-y-1.5">
                <h5 className="font-semibold text-foreground text-sm">How P50 & P75 Are Calculated</h5>
                <p><strong>P50 (50th Percentile / Median):</strong> The middle value when all historical bills are sorted from lowest to highest. Half of past cases cost less, half cost more. This is the "typical" bill amount.</p>
                <p><strong>P75 (75th Percentile):</strong> The value below which 75% of historical bills fall. Only 25% of past cases exceeded this amount. This represents a higher-end but realistic estimate.</p>
                <p><strong>Data source:</strong> Calculated from the 2 most recent years of historical billing data, grouped by hospital, doctor, procedure, episode type, ward type, age group, and gender. The system uses a progressive fallback—if no exact match exists, it broadens the search (e.g. drops doctor specificity, then ward type) until data is found.</p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
