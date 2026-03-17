import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function percentileBreakdown(
  bills: { breakdown: Record<string, number> }[],
  p: number
): Record<string, number> {
  const keys = ["consultant", "surgery", "radiology", "lab", "pharmacy", "room"];
  const result: Record<string, number> = {};
  for (const key of keys) {
    const vals = bills
      .map((b) => (b.breakdown?.[key] as number) ?? 0)
      .sort((a, b) => a - b);
    result[key] = Math.round(percentile(vals, p) * 100) / 100;
  }
  return result;
}

function ageToGroup(age: number | null): string {
  if (age === null || age === undefined) return "";
  if (age <= 12) return "0-12";
  if (age <= 17) return "13-17";
  if (age <= 30) return "18-30";
  if (age <= 45) return "31-45";
  if (age <= 60) return "46-60";
  if (age <= 75) return "61-75";
  return "76+";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Determine the 2 most recent years with data
    const { data: yearRows } = await supabase
      .from("historical_bills")
      .select("year")
      .order("year", { ascending: false });

    const uniqueYears = [...new Set((yearRows ?? []).map((r: any) => r.year))].slice(0, 2);
    if (uniqueYears.length === 0) {
      return new Response(JSON.stringify({ message: "No historical data found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all bills for the 2 most recent years
    const { data: bills, error: billsErr } = await supabase
      .from("historical_bills")
      .select("hospital_id, doctor_id, procedure_code, diagnosis_code, comorbidity, episode_type, ward_type, age, gender, total_bill, breakdown, year")
      .in("year", uniqueYears);

    if (billsErr) throw billsErr;
    if (!bills || bills.length === 0) {
      return new Response(JSON.stringify({ message: "No bills found for recent years" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Group bills by multiple dimensions:
    // (hospital_id, doctor_id, procedure_code, diagnosis_code, comorbidity, episode_type, ward_type, age_group, gender)
    // We create:
    // 1. Hospital-level (no doctor)
    // 2. Doctor-specific
    const groups = new Map<string, any[]>();

    function addToGroup(bill: any, doctorId: string) {
      const ag = ageToGroup(bill.age);
      const key = [
        bill.hospital_id,
        doctorId,
        bill.procedure_code,
        bill.diagnosis_code ?? "",
        bill.comorbidity ?? "",
        bill.episode_type ?? "",
        bill.ward_type ?? "",
        ag,
        bill.gender ?? "",
      ].join("|");
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(bill);
    }

    for (const bill of bills) {
      // Hospital-level (doctor = empty)
      addToGroup(bill, "");
      // Doctor-specific
      if (bill.doctor_id) {
        addToGroup(bill, bill.doctor_id);
      }
    }

    // Clear old averages
    await supabase.from("calculated_averages").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // Build new averages
    const averages: any[] = [];
    const yearStrings = uniqueYears.map(String);

    for (const [key, groupBills] of groups) {
      const parts = key.split("|");
      const [hospital_id, doctor_id, procedure_code, diagnosis_code, comorbidity, episode_type, ward_type, age_group, gender] = parts;
      
      const totals = groupBills.map((b: any) => Number(b.total_bill)).sort((a: number, b: number) => a - b);
      const p50Total = Math.round(percentile(totals, 50) * 100) / 100;
      const p75Total = Math.round(percentile(totals, 75) * 100) / 100;
      const p50Brkdn = percentileBreakdown(groupBills as any, 50);
      const p75Brkdn = percentileBreakdown(groupBills as any, 75);

      averages.push({
        hospital_id,
        doctor_id: doctor_id || null,
        procedure_code,
        diagnosis_code: diagnosis_code || null,
        comorbidity: comorbidity || null,
        episode_type: episode_type || null,
        ward_type: ward_type || null,
        age_group: age_group || null,
        gender: gender || null,
        p50_total: p50Total,
        p75_total: p75Total,
        p50_breakdown: p50Brkdn,
        p75_breakdown: p75Brkdn,
        sample_size: groupBills.length,
        data_years: yearStrings,
      });
    }

    // Insert in chunks
    const chunkSize = 200;
    let totalInserted = 0;
    for (let i = 0; i < averages.length; i += chunkSize) {
      const chunk = averages.slice(i, i + chunkSize);
      const { error } = await supabase.from("calculated_averages").insert(chunk);
      if (error) throw error;
      totalInserted += chunk.length;
    }

    return new Response(
      JSON.stringify({
        message: `Calculated ${totalInserted} average records from ${bills.length} bills across years ${uniqueYears.join(", ")}. Grouped by hospital, doctor, procedure, diagnosis, comorbidity, age group, and gender.`,
        records: totalInserted,
        years: uniqueYears,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
