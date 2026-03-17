import { supabase } from "@/integrations/supabase/client";

export interface FeeBreakdown {
  consultantFees: number;
  surgeryFees: number;
  radiologyFees: number;
  laboratoryFees: number;
  pharmacyFees: number;
  roomAndBoard: number;
}

export interface EstimationResult {
  totalP50: number;
  totalP75: number;
  breakdownP50: FeeBreakdown;
  breakdownP75: FeeBreakdown;
  doctorSpecific: boolean;
  hospitalWideNote?: string;
  sampleSize: number;
  dataYears: string[];
  surgicalPackage?: {
    name: string;
    price: number;
    includes: string[];
  };
}

function mapBreakdown(raw: Record<string, number> | null): FeeBreakdown {
  if (!raw) return { consultantFees: 0, surgeryFees: 0, radiologyFees: 0, laboratoryFees: 0, pharmacyFees: 0, roomAndBoard: 0 };
  return {
    consultantFees: raw.consultant ?? 0,
    surgeryFees: raw.surgery ?? 0,
    radiologyFees: raw.radiology ?? 0,
    laboratoryFees: raw.lab ?? 0,
    pharmacyFees: raw.pharmacy ?? 0,
    roomAndBoard: raw.room ?? 0,
  };
}

function ageToGroup(age: number | undefined): string | null {
  if (age === undefined || age === null) return null;
  if (age <= 12) return "0-12";
  if (age <= 17) return "13-17";
  if (age <= 30) return "18-30";
  if (age <= 45) return "31-45";
  if (age <= 60) return "46-60";
  if (age <= 75) return "61-75";
  return "76+";
}

function genderCode(gender: string | undefined): string | null {
  if (!gender) return null;
  if (gender.toLowerCase().startsWith("m")) return "M";
  if (gender.toLowerCase().startsWith("f")) return "F";
  return null;
}

/**
 * Query calculated_averages with progressive fallback.
 * Starts with the most specific match and broadens until a result is found.
 */
async function findBestMatch(params: {
  hospitalId: string;
  procedureCode: string;
  episodeType?: string;
  doctorId?: string;
  wardType?: string;
  age?: number;
  gender?: string;
  diagnosisCode?: string;
}) {
  const ag = ageToGroup(params.age);
  const g = genderCode(params.gender);

  // Build query layers from most specific to least
  const queries = [
    // 1. Full match with doctor + demographics
    params.doctorId ? () => supabase.from("calculated_averages").select("*")
      .eq("hospital_id", params.hospitalId)
      .eq("procedure_code", params.procedureCode)
      .eq("doctor_id", params.doctorId!)
      .eq("episode_type", params.episodeType ?? "")
      .limit(1) : null,

    // 2. Hospital-level with episode + ward
    () => {
      let q = supabase.from("calculated_averages").select("*")
        .eq("hospital_id", params.hospitalId)
        .eq("procedure_code", params.procedureCode)
        .is("doctor_id", null);
      if (params.episodeType) q = q.eq("episode_type", params.episodeType);
      if (params.wardType) q = q.eq("ward_type", params.wardType);
      return q.limit(1);
    },

    // 3. Hospital + procedure + episode only
    () => {
      let q = supabase.from("calculated_averages").select("*")
        .eq("hospital_id", params.hospitalId)
        .eq("procedure_code", params.procedureCode)
        .is("doctor_id", null);
      if (params.episodeType) q = q.eq("episode_type", params.episodeType);
      return q.limit(1);
    },

    // 4. Hospital + procedure only
    () => supabase.from("calculated_averages").select("*")
      .eq("hospital_id", params.hospitalId)
      .eq("procedure_code", params.procedureCode)
      .is("doctor_id", null)
      .limit(1),

    // 5. Any hospital with this procedure (cross-hospital fallback)
    () => supabase.from("calculated_averages").select("*")
      .eq("procedure_code", params.procedureCode)
      .is("doctor_id", null)
      .limit(1),
  ].filter(Boolean) as (() => any)[];

  for (const queryFn of queries) {
    const { data } = await queryFn();
    if (data && data.length > 0) return data[0];
  }
  return null;
}

export async function generateEstimate(params: {
  hospitalId: string;
  procedureCodes: string[];
  episodeType: string;
  doctorId?: string;
  age?: number;
  gender?: string;
  wardType?: string;
  los?: number;
  diagnosisCode?: string;
}): Promise<EstimationResult> {
  let totalP50 = 0;
  let totalP75 = 0;
  let totalBreakdownP50: FeeBreakdown = { consultantFees: 0, surgeryFees: 0, radiologyFees: 0, laboratoryFees: 0, pharmacyFees: 0, roomAndBoard: 0 };
  let totalBreakdownP75: FeeBreakdown = { consultantFees: 0, surgeryFees: 0, radiologyFees: 0, laboratoryFees: 0, pharmacyFees: 0, roomAndBoard: 0 };
  let doctorSpecific = false;
  let totalSampleSize = 0;
  let dataYears: string[] = [];

  for (const code of params.procedureCodes) {
    const match = await findBestMatch({
      hospitalId: params.hospitalId,
      procedureCode: code,
      episodeType: params.episodeType,
      doctorId: params.doctorId,
      wardType: params.wardType,
      age: params.age,
      gender: params.gender,
      diagnosisCode: params.diagnosisCode,
    });

    if (match) {
      totalP50 += Number(match.p50_total ?? 0);
      totalP75 += Number(match.p75_total ?? 0);
      const bp50 = mapBreakdown(match.p50_breakdown as any);
      const bp75 = mapBreakdown(match.p75_breakdown as any);
      totalBreakdownP50 = addBreakdowns(totalBreakdownP50, bp50);
      totalBreakdownP75 = addBreakdowns(totalBreakdownP75, bp75);
      if (match.doctor_id) doctorSpecific = true;
      totalSampleSize += match.sample_size ?? 0;
      if (match.data_years) dataYears = match.data_years;
    }
  }

  // If no DB data found, return zeros with message
  if (totalP50 === 0 && totalP75 === 0) {
    return {
      totalP50: 0,
      totalP75: 0,
      breakdownP50: totalBreakdownP50,
      breakdownP75: totalBreakdownP75,
      doctorSpecific: false,
      hospitalWideNote: "No historical data available for this combination. Please contact the administrator to upload historical billing data.",
      sampleSize: 0,
      dataYears: [],
    };
  }

  const pkg = checkSurgicalPackage(params.procedureCodes[0]);

  return {
    totalP50,
    totalP75,
    breakdownP50: totalBreakdownP50,
    breakdownP75: totalBreakdownP75,
    doctorSpecific,
    hospitalWideNote: !doctorSpecific ? "Estimate based on hospital-wide data as no doctor-specific data was found." : undefined,
    sampleSize: totalSampleSize,
    dataYears,
    surgicalPackage: pkg,
  };
}

function addBreakdowns(a: FeeBreakdown, b: FeeBreakdown): FeeBreakdown {
  return {
    consultantFees: a.consultantFees + b.consultantFees,
    surgeryFees: a.surgeryFees + b.surgeryFees,
    radiologyFees: a.radiologyFees + b.radiologyFees,
    laboratoryFees: a.laboratoryFees + b.laboratoryFees,
    pharmacyFees: a.pharmacyFees + b.pharmacyFees,
    roomAndBoard: a.roomAndBoard + b.roomAndBoard,
  };
}

function checkSurgicalPackage(primaryCode: string) {
  const packages: Record<string, { name: string; price: number; includes: string[] }> = {
    "S13-005": {
      name: "Total Knee Replacement Package",
      price: 25000,
      includes: ["Surgery & anaesthesia fees", "Implant cost", "5 nights ward stay", "Pre-op tests", "Post-op physiotherapy (3 sessions)", "Medications"],
    },
    "S13-013": {
      name: "Laparoscopic Cholecystectomy Package",
      price: 9500,
      includes: ["Surgery & anaesthesia fees", "2 nights single room", "Pre-op blood tests", "Medications", "Surgeon & anaesthetist fees"],
    },
    "S13-022": {
      name: "Caesarean Section Package",
      price: 11000,
      includes: ["Surgery & anaesthesia fees", "3 nights single room", "Baby care (normal)", "Pre-op tests", "Medications"],
    },
    "S13-027": {
      name: "Cataract Surgery Day Care Package",
      price: 5500,
      includes: ["Phacoemulsification", "Foldable IOL implant", "Day care charges", "Surgeon fees", "Medications (1 week)"],
    },
  };
  return packages[primaryCode] || undefined;
}
