import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const USER_MANUAL = `
# KPJ Bill Estimator — User Manual

## 1. System Overview
The KPJ Bill Estimator is a data-driven cost estimation system for KPJ Healthcare Group. It provides P50 (Median) and P75 (High-end) bill estimates based on historical billing data across all KPJ hospitals, segmented by hospital, doctor, procedure, diagnosis, comorbidity, age group, and gender.

### Key Features
- Bill estimation with P50 and P75 breakdowns by fee category (consultant, surgery, radiology, laboratory, pharmacy, room & board)
- Doctor-specific vs hospital-wide estimates with automatic fallback
- AI-powered competitor price comparison
- Surgical package pricing where available
- Historical data ingestion and automated P50/P75 recalculation
- Role-based access control for Group, Hospital, Doctor, and Admin users

### User Roles
- Group Users: Full system administrators. Manage all hospitals, doctors, procedures, reference data, data ingestion, average calculations, and user roles.
- Hospital Users: View their facility's data and generate bill estimates for their hospital.
- Doctor Users: View their profile and generate bill estimates for their associated procedures.
- Admin Users: System-wide administration capabilities.

## 2. Getting Started

### Logging In
1. Navigate to the login page.
2. Enter your registered email address and password.
3. Click "Sign In" to access the dashboard.
4. New users: Click "Sign Up", fill in details, verify email, then log in.

### Dashboard
Shows quick links based on role: Bill Estimator (all users), Hospitals/Doctors/Data Ingestion/Averages (Group only).
If no role assigned, contact Group administrator.

## 3. Bill Estimator (All Users)

### Step 1 — Core Details (Required)
1. Select Hospital: Choose a KPJ hospital. Filters doctor list.
2. Select Doctor (optional): System tries doctor-specific pricing first.
3. Select Procedure(s): Search/add Schedule 13 procedure codes. System may suggest related procedures.
4. Choose Episode Type: IP (Inpatient), OP (Outpatient), DS (Day Surgery), ER (Emergency).

Options: Quick Estimate (immediate) or Refine Estimate (Step 2).

### Step 2 — Refine Estimate (Optional)
- Patient Age: 0-110, binned into groups (0-12, 13-17, 18-30, 31-45, 46-60, 61-75, 76+).
- Gender: Male or Female.
- Ward Type: Single Room, Twin Sharing, 4-Bed, 6-Bed, Suite, ICU.
- Length of Stay: Expected days.
- Payor Type & Name.

### Understanding Results
- Total Estimated Cost with P50/P75 toggle.
- Data Source Info: Historical case count, data years, doctor-specific vs hospital-wide.
- Fee Breakdown: Consultant, Surgery, Radiology, Laboratory, Pharmacy, Room & Board.
- Surgical Package: Fixed-price bundles when available.
- Competitor Comparison: AI-powered pricing from competitor hospitals.

### When No Data Available
Contact Group administrator to upload historical data for that hospital/procedure.

## 4. Data Management (Group Users Only)

### Manage Hospitals
View, search, add, edit, toggle status. Required: Code (e.g., KPJ-AMP) and Name. Optional: Address, State.

### Manage Doctors
View, search, add, edit, toggle status. Required: Code and Name. Optional: Specialty, Hospital.

### Manage Procedures
Schedule 13 procedures. Required: Code and Name. Optional: Category.

### Reference Data
Tabs: Ward Types (SR, TS, 4B, 6B, SU, ICU), Episode Types (IP, OP, DS, ER), Payor Types (Self-Pay, Insurance, Corporate, Government).

### Data Ingestion
1. Download CSV Template.
2. Required columns: hospital_code, procedure_code, total_bill.
3. Optional: doctor_code, diagnosis_code (ICD-10), comorbidity, episode_type, ward_type, age, gender, bill_date, fee breakdowns.
4. Select Data Year, upload, system validates and processes.
5. Unrecognized codes are skipped with warnings.

### Recalculate Averages
Processes most recent 2 years. Calculates P50/P75 across: Hospital, Doctor, Procedure, Episode Type, Ward Type, Diagnosis, Age Group, Gender.

### View Calculated Averages
Searchable/filterable table of all computed averages.

### User Management
View users, manage roles (Admin, Group, Hospital, Doctor). Multiple roles allowed.

## 5. FAQ

Q: What is P50 vs P75?
A: P50 = 50% of cases cost less (median). P75 = 75% cost less (conservative estimate).

Q: Why "hospital-wide data"?
A: Not enough doctor-specific data; falls back to all doctors at that hospital.

Q: Multiple procedures at once?
A: Yes, add multiple in Step 1. Costs are summed.

Q: What is a Surgical Package?
A: Fixed-price bundle including surgery, room, tests, medications.

Q: How often upload data?
A: Annually recommended. System uses most recent 2 years.

Q: Unrecognized hospital codes in CSV?
A: Rows skipped with warnings. Use exact codes from Hospitals module.

Q: How to access Data Management?
A: Group role required. Contact administrator.
`;

const SYSTEM_PROMPT = `You are the KPJ Bill Estimator AI Assistant. You help users navigate and use the KPJ Bill Estimator system.

Your knowledge base is the following user manual. Answer questions ONLY based on this manual. If a question is outside the scope of the system, politely say so and redirect to relevant topics.

Be concise, friendly, and professional. Use bullet points and numbered steps when explaining procedures. Reference specific sections of the manual when relevant.

If the user asks about something not covered in the manual, say: "I don't have information about that in my knowledge base. Please contact your system administrator for further assistance."

${USER_MANUAL}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service credits exhausted. Please contact administrator." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat-assistant error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
