import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileUp, AlertCircle, CheckCircle2, Loader2, Calculator, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";

type Batch = Tables<"ingestion_batches">;

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

const CSV_TEMPLATE_HEADERS = [
  "hospital_code", "doctor_code", "procedure_code", "diagnosis_code", "comorbidity",
  "episode_type", "ward_type", "age", "gender", "total_bill", "bill_date",
  "consultant_fee", "surgery_fee", "radiology_fee", "lab_fee", "pharmacy_fee", "room_fee",
];

const CSV_SAMPLE_ROW = [
  "KPJ-AMP", "DR001", "S13-005", "M17.1", "Diabetes", 
  "IP", "SR", "65", "M", "25000.00", "2025-06-15",
  "5000.00", "8000.00", "2000.00", "1500.00", "3000.00", "5500.00",
];

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/\s+/g, "_"));
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const vals = line.split(",").map(v => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = vals[i] ?? ""; });
    return row;
  });
}

function downloadTemplate() {
  const header = CSV_TEMPLATE_HEADERS.join(",");
  const sample = CSV_SAMPLE_ROW.join(",");
  const csv = `${header}\n${sample}\n`;
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "historical_bills_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminIngestion() {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(String(currentYear));
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [calculating, setCalculating] = useState(false);

  const fetchBatches = async () => {
    setLoading(true);
    const { data } = await supabase.from("ingestion_batches").select("*").order("upload_date", { ascending: false });
    setBatches(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchBatches(); }, []);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { toast({ title: "Please select a CSV file", variant: "destructive" }); return; }
    if (!file.name.endsWith(".csv")) { toast({ title: "Only CSV files are supported", variant: "destructive" }); return; }

    setUploading(true);
    setProgress(10);

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length === 0) throw new Error("CSV file is empty or has no data rows");

      const headers = Object.keys(rows[0]);
      const missing = ["hospital_code", "procedure_code", "total_bill"].filter(h => !headers.includes(h));
      if (missing.length > 0) throw new Error(`Missing required columns: ${missing.join(", ")}`);

      setProgress(20);

      const [hospRes, docRes] = await Promise.all([
        supabase.from("hospitals").select("id, code"),
        supabase.from("doctors").select("id, code"),
      ]);
      const hospMap = new Map((hospRes.data ?? []).map(h => [h.code, h.id]));
      const docMap = new Map((docRes.data ?? []).map(d => [d.code, d.id]));

      setProgress(30);

      const { data: batch, error: batchErr } = await supabase.from("ingestion_batches").insert({
        file_name: file.name,
        year: parseInt(year),
        uploaded_by: user?.id ?? null,
        status: "processing",
        record_count: rows.length,
      }).select().single();
      if (batchErr || !batch) throw new Error(batchErr?.message ?? "Failed to create batch");

      setProgress(40);

      const chunkSize = 100;
      let inserted = 0;
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const records = chunk.map((row, idx) => {
          const hospId = hospMap.get(row.hospital_code);
          if (!hospId) {
            errors.push(`Row ${i + idx + 2}: Unknown hospital_code "${row.hospital_code}"`);
            return null;
          }
          const docId = row.doctor_code ? docMap.get(row.doctor_code) ?? null : null;
          const totalBill = parseFloat(row.total_bill);
          if (isNaN(totalBill)) {
            errors.push(`Row ${i + idx + 2}: Invalid total_bill "${row.total_bill}"`);
            return null;
          }

          return {
            hospital_id: hospId,
            doctor_id: docId,
            procedure_code: row.procedure_code,
            diagnosis_code: row.diagnosis_code || null,
            comorbidity: row.comorbidity || null,
            episode_type: row.episode_type || null,
            ward_type: row.ward_type || null,
            age: row.age ? parseInt(row.age) : null,
            gender: row.gender || null,
            total_bill: totalBill,
            bill_date: row.bill_date || null,
            year: parseInt(year),
            batch_id: batch.id,
            breakdown: {
              consultant: parseFloat(row.consultant_fee) || 0,
              surgery: parseFloat(row.surgery_fee) || 0,
              radiology: parseFloat(row.radiology_fee) || 0,
              lab: parseFloat(row.lab_fee) || 0,
              pharmacy: parseFloat(row.pharmacy_fee) || 0,
              room: parseFloat(row.room_fee) || 0,
            },
          };
        }).filter(Boolean);

        if (records.length > 0) {
          const { error } = await supabase.from("historical_bills").insert(records as any);
          if (error) errors.push(`Chunk ${Math.floor(i / chunkSize) + 1}: ${error.message}`);
          else inserted += records.length;
        }

        setProgress(40 + Math.round((i / rows.length) * 50));
      }

      await supabase.from("ingestion_batches").update({
        status: errors.length > 0 ? "completed_with_errors" : "completed",
        record_count: inserted,
      }).eq("id", batch.id);

      setProgress(100);

      if (errors.length > 0) {
        toast({
          title: `Uploaded with ${errors.length} warnings`,
          description: `${inserted} records inserted. First issue: ${errors[0]}`,
          variant: "destructive",
        });
      } else {
        toast({ title: "Upload successful", description: `${inserted} records ingested for year ${year}` });
      }

      fetchBatches();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const triggerCalculation = async () => {
    setCalculating(true);
    try {
      const { data, error } = await supabase.functions.invoke("calculate-averages");
      if (error) throw error;
      toast({ title: "Calculation complete", description: data?.message ?? "Averages have been recalculated." });
    } catch (err: any) {
      toast({ title: "Calculation failed", description: err.message, variant: "destructive" });
    } finally {
      setCalculating(false);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, "default" | "secondary" | "destructive"> = {
      completed: "default", processing: "secondary", pending: "secondary",
      failed: "destructive", completed_with_errors: "destructive",
    };
    return <Badge variant={map[status] ?? "secondary"}>{status}</Badge>;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Upload className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold font-display text-foreground">Historical Data Ingestion</h1>
      </div>

      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upload Historical Bills</CardTitle>
          <CardDescription>
            Upload a CSV file with historical bill data. Download the template below for the correct format.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-1" /> Download CSV Template
          </Button>

          <div className="rounded-md border border-border p-3 bg-muted/30 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground text-sm">CSV Column Reference</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-0.5">
              <span><strong>hospital_code</strong> — required</span>
              <span><strong>procedure_code</strong> — required</span>
              <span><strong>total_bill</strong> — required</span>
              <span>doctor_code</span>
              <span>diagnosis_code (ICD-10)</span>
              <span>comorbidity</span>
              <span>episode_type (IP/OP/DS/ER)</span>
              <span>ward_type (SR/TS/4B/6B/SU/ICU)</span>
              <span>age</span>
              <span>gender (M/F)</span>
              <span>bill_date (YYYY-MM-DD)</span>
              <span>consultant_fee</span>
              <span>surgery_fee</span>
              <span>radiology_fee</span>
              <span>lab_fee</span>
              <span>pharmacy_fee</span>
              <span>room_fee</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="grid gap-1.5">
              <Label>Data Year</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {yearOptions.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>CSV File</Label>
              <Input ref={fileRef} type="file" accept=".csv" disabled={uploading} />
            </div>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileUp className="h-4 w-4 mr-1" />}
              {uploading ? "Uploading..." : "Upload & Process"}
            </Button>
          </div>
          {uploading && <Progress value={progress} className="h-2" />}
        </CardContent>
      </Card>

      {/* Recalculate Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recalculate Averages</CardTitle>
          <CardDescription>
            Recompute P50 (median) and P75 averages from the most recent 2 years of historical data.
            Averages are grouped by: Hospital, Doctor, Procedure, Diagnosis, Comorbidity, Age Group, and Gender.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={triggerCalculation} disabled={calculating} variant="secondary">
            {calculating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Calculator className="h-4 w-4 mr-1" />}
            {calculating ? "Calculating..." : "Recalculate P50/P75 Averages"}
          </Button>
        </CardContent>
      </Card>

      {/* Batch History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ingestion History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uploaded</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : batches.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No ingestion batches yet</TableCell></TableRow>
              ) : batches.map(b => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.file_name}</TableCell>
                  <TableCell>{b.year}</TableCell>
                  <TableCell>{b.record_count ?? 0}</TableCell>
                  <TableCell>{statusBadge(b.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(b.upload_date).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
