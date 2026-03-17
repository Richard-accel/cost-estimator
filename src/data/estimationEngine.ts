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
  surgicalPackage?: {
    name: string;
    price: number;
    includes: string[];
  };
}

// Mock estimation engine - generates realistic-looking estimates
export function generateEstimate(params: {
  hospitalId: string;
  procedureCodes: string[];
  episodeType: string;
  doctorId?: string;
  age?: number;
  gender?: string;
  wardType?: string;
  los?: number;
}): EstimationResult {
  // Base costs by procedure (mock)
  const baseCosts: Record<string, number> = {
    "PR001": 28000, "PR002": 32000, "PR003": 12000,
    "PR004": 65000, "PR005": 25000, "PR006": 8000,
    "PR007": 10000, "PR008": 7000, "PR009": 12000,
    "PR010": 5000, "PR011": 18000, "PR012": 6000,
    "PR013": 5500, "PR014": 7000, "PR015": 14000,
    "PR016": 8000, "PR017": 22000, "PR018": 15000,
    "PR019": 45000, "PR020": 18000, "PR021": 200,
    "PR022": 800, "PR023": 300, "PR024": 250,
    "PR025": 3000, "PR026": 2500, "PR027": 1500,
    "PR028": 3500, "PR029": 30000, "PR030": 35000,
  };

  let totalBase = params.procedureCodes.reduce((sum, code) => sum + (baseCosts[code] || 5000), 0);

  // Ward type multiplier
  const wardMultipliers: Record<string, number> = {
    "Suite": 1.6, "Single Room": 1.3, "Twin Sharing": 1.1,
    "4-Bedded Ward": 1.0, "6-Bedded Ward": 0.85, "ICU": 2.0,
  };
  if (params.wardType) totalBase *= (wardMultipliers[params.wardType] || 1);

  // LOS multiplier
  if (params.los && params.los > 1) totalBase *= (1 + (params.los - 1) * 0.12);

  // Episode type
  if (params.episodeType === "Outpatient") totalBase *= 0.4;
  else if (params.episodeType === "Day Surgery") totalBase *= 0.65;

  // Age adjustment
  if (params.age && params.age > 65) totalBase *= 1.15;

  const p50 = Math.round(totalBase);
  const p75 = Math.round(totalBase * 1.35);

  const breakdownP50 = distributeBreakdown(p50);
  const breakdownP75 = distributeBreakdown(p75);

  const doctorSpecific = !!params.doctorId;

  // Check surgical package
  const pkg = checkSurgicalPackage(params.procedureCodes[0]);

  return {
    totalP50: p50,
    totalP75: p75,
    breakdownP50,
    breakdownP75,
    doctorSpecific,
    hospitalWideNote: !doctorSpecific ? "Estimate based on hospital-wide data as no specific doctor was selected." : undefined,
    surgicalPackage: pkg,
  };
}

function distributeBreakdown(total: number): FeeBreakdown {
  return {
    consultantFees: Math.round(total * 0.22),
    surgeryFees: Math.round(total * 0.30),
    radiologyFees: Math.round(total * 0.08),
    laboratoryFees: Math.round(total * 0.10),
    pharmacyFees: Math.round(total * 0.15),
    roomAndBoard: Math.round(total * 0.15),
  };
}

function checkSurgicalPackage(primaryCode: string) {
  const packages: Record<string, { name: string; price: number; includes: string[] }> = {
    "PR001": {
      name: "Total Knee Replacement Package",
      price: 25000,
      includes: ["Surgery & anaesthesia fees", "Implant cost", "5 nights ward stay", "Pre-op tests", "Post-op physiotherapy (3 sessions)", "Medications"],
    },
    "PR007": {
      name: "Laparoscopic Cholecystectomy Package",
      price: 9500,
      includes: ["Surgery & anaesthesia fees", "2 nights single room", "Pre-op blood tests", "Medications", "Surgeon & anaesthetist fees"],
    },
    "PR009": {
      name: "Caesarean Section Package",
      price: 11000,
      includes: ["Surgery & anaesthesia fees", "3 nights single room", "Baby care (normal)", "Pre-op tests", "Medications"],
    },
    "PR012": {
      name: "Cataract Surgery Day Care Package",
      price: 5500,
      includes: ["Phacoemulsification", "Foldable IOL implant", "Day care charges", "Surgeon fees", "Medications (1 week)"],
    },
  };
  return packages[primaryCode] || undefined;
}
