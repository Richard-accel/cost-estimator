import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Building2, Stethoscope, Users, Calculator, Upload, Database, Layers, ClipboardList, Shield, MessageCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const USER_MANUAL_TEXT = `
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
- **Group Users**: Full system administrators. Manage all hospitals, doctors, procedures, reference data, data ingestion, average calculations, and user roles.
- **Hospital Users**: View their facility's data and generate bill estimates for their hospital.
- **Doctor Users**: View their profile and generate bill estimates for their associated procedures.
- **Admin Users**: System-wide administration capabilities.

---

## 2. Getting Started

### 2.1 Logging In
1. Navigate to the login page at /login.
2. Enter your registered email address and password.
3. Click "Sign In" to access the dashboard.
4. If you don't have an account, click "Sign Up" and fill in your details. Your account will require email verification before first login.

### 2.2 Dashboard
After login, you'll see the Dashboard with quick links based on your role:
- **Bill Estimator** — available to all authenticated users
- **Hospitals, Doctors, Data Ingestion, Calculated Averages** — visible only to Group users

If your account has no assigned role, you'll see a notification to contact your Group administrator.

---

## 3. Bill Estimator (All Users)

The Bill Estimator is the core feature, accessible to all authenticated users.

### 3.1 Step 1 — Core Details (Required)
1. **Select Hospital**: Choose a KPJ hospital from the dropdown. This filters the doctor list to show only doctors at that hospital.
2. **Select Doctor** (optional): Choose the admitting doctor. If selected, the system will attempt to find doctor-specific pricing first, falling back to hospital-wide data if unavailable.
3. **Select Procedure(s)**: Search and add one or more procedure codes (Schedule 13 items). The system may suggest related procedures based on your primary selection.
4. **Choose Episode Type**: Select from Inpatient (IP), Outpatient (OP), Day Surgery (DS), or Emergency (ER).

After filling required fields, you can either:
- Click **Quick Estimate** to get immediate results with just the core details
- Click **Refine Estimate** to proceed to Step 2 for more precise results

### 3.2 Step 2 — Refine Estimate (Optional)
These optional fields improve estimate accuracy:
- **Patient Age**: Enter patient age (0-110). The system bins this into age groups: 0-12, 13-17, 18-30, 31-45, 46-60, 61-75, 76+.
- **Gender**: Select Male or Female.
- **Ward Type**: Choose the ward category (Single Room, Twin Sharing, 4-Bed, 6-Bed, Suite, ICU).
- **Length of Stay**: Enter expected stay in days.
- **Payor Type & Name**: Select the payor category and enter the specific payor/insurer name.

Click **Get Estimate** to view results.

### 3.3 Understanding Results
The results page shows:
- **Total Estimated Cost**: Displayed prominently with P50 (Median) and P75 (High-end) toggle.
- **Data Source Info**: Shows how many historical cases the estimate is based on, the data years, and whether it's doctor-specific or hospital-wide.
- **P50 vs P75 Comparison Cards**: Side-by-side view showing the range. P50 means 50% of historical cases fell below this amount; P75 means 75% did.
- **Fee Breakdown Chart**: Horizontal bar chart showing cost split across Consultant Fees, Surgery & Procedure, Radiology, Laboratory, Pharmacy, and Room & Board.
- **Fee Breakdown Table**: Detailed line-by-line amounts for each category.
- **Surgical Package** (if available): Some procedures have fixed-price packages that include bundled services at a set price.
- **Competitor Comparison**: Click "Compare with Competitors" to see how KPJ's pricing compares with nearby competitor hospitals (AI-powered, fetches live data).

### 3.4 When No Data Is Available
If the system cannot find historical data for your selected combination, it will display a message indicating no data is available. Contact your Group administrator to upload historical billing data for that hospital/procedure.

---

## 4. Data Management (Group Users Only)

Group users have access to the Data Management section in the sidebar, which includes the following modules:

### 4.1 Manage Hospitals
**Path**: Data Management → Hospitals

- **View**: See all KPJ hospitals with their code, name, state, and active/inactive status.
- **Search**: Use the search bar to filter hospitals by code, name, or state.
- **Add**: Click "Add Hospital" to create a new entry. Required fields: Code (e.g., KPJ-AMP) and Name. Optional: Address, State.
- **Edit**: Click the pencil icon to update hospital details.
- **Toggle Status**: Click the power icon to activate/deactivate a hospital. Inactive hospitals won't appear in the Bill Estimator dropdown.

### 4.2 Manage Doctors
**Path**: Data Management → Doctors

- **View**: See all registered doctors with code, name, specialty, assigned hospital, and status.
- **Search**: Filter by code, name, or specialty.
- **Add**: Click "Add Doctor". Required: Code and Name. Optional: Specialty and Hospital assignment.
- **Edit**: Update doctor details including reassigning to a different hospital.
- **Toggle Status**: Activate/deactivate doctors.

### 4.3 Manage Procedures
**Path**: Data Management → Procedures

- **View**: All Schedule 13 procedures with code, name, category, and status.
- **Search**: Filter by code, name, or category.
- **Add**: Click "Add Procedure". Required: Code (e.g., S13-005) and Name. Optional: Category.
- **Edit**: Update procedure details.
- **Toggle Status**: Activate/deactivate procedures.

### 4.4 Reference Data
**Path**: Data Management → Reference Data

Manage lookup tables used throughout the system, organized in tabs:

- **Ward Types**: Room categories (e.g., SR = Single Room, TS = Twin Sharing, ICU = Intensive Care Unit).
- **Episode Types**: Visit types (e.g., IP = Inpatient, OP = Outpatient, DS = Day Surgery, ER = Emergency).
- **Payor Types**: Payment categories (e.g., Self-Pay, Insurance, Corporate, Government).

For each tab, you can add new entries, edit existing ones, and toggle active status.

### 4.5 Data Ingestion
**Path**: Data Management → Data Ingestion

This module allows bulk uploading of historical billing data that drives the P50/P75 calculations.

#### Uploading Data
1. Click **Download CSV Template** to get the correct file format.
2. Prepare your CSV file with these columns:
   - **Required**: hospital_code, procedure_code, total_bill
   - **Optional**: doctor_code, diagnosis_code (ICD-10), comorbidity, episode_type (IP/OP/DS/ER), ward_type (SR/TS/4B/6B/SU/ICU), age, gender (M/F), bill_date (YYYY-MM-DD)
   - **Fee Breakdowns** (optional): consultant_fee, surgery_fee, radiology_fee, lab_fee, pharmacy_fee, room_fee
3. Select the **Data Year** for the uploaded data.
4. Choose your CSV file and click **Upload & Process**.
5. The system validates codes against the database (hospital_code must match existing hospital codes, doctor_code must match existing doctor codes).
6. Progress is shown during upload. Upon completion, you'll see success/error counts.

#### Ingestion History
View all past uploads with file name, year, record count, status, and upload date.

### 4.6 Recalculate Averages
**Path**: Data Management → Data Ingestion (bottom section) or Data Management → Averages

After uploading historical data:
1. Click **Recalculate P50/P75 Averages** on the Data Ingestion page.
2. The system processes the most recent 2 years of historical data.
3. Averages are calculated across these dimensions:
   - Hospital + Procedure (base level)
   - Hospital + Procedure + Doctor (doctor-specific)
   - Hospital + Procedure + Episode Type
   - Hospital + Procedure + Ward Type
   - Hospital + Procedure + Diagnosis Code (ICD-10)
   - Hospital + Procedure + Age Group (0-12, 13-17, 18-30, 31-45, 46-60, 61-75, 76+)
   - Hospital + Procedure + Gender
4. Results include P50 and P75 totals with fee breakdowns, sample sizes, and data years.

### 4.7 View Calculated Averages
**Path**: Data Management → Averages

Browse all calculated averages in a searchable, filterable table showing:
- Hospital, Procedure Code, Episode Type, Ward Type, Diagnosis, Age Group, Gender
- P50 (Median) and P75 amounts
- Sample size and data years

Use the hospital filter dropdown and search bar to find specific averages.

### 4.8 User Management
**Path**: Data Management → Users

- **View**: See all registered users with name, email, and assigned roles.
- **Search**: Filter users by name or email.
- **Manage Roles**: Click the shield icon to assign or remove roles. Available roles: Admin, Group, Hospital, Doctor. Users can have multiple roles. Changes take effect immediately.

---

## 5. Resources (All Users)

### 5.1 User Manual
**Path**: Resources → User Manual

This comprehensive guide (you are reading it now).

### 5.2 Documentation
**Path**: Resources → Documentation

Technical documentation including API references and system architecture details.

### 5.3 AI Assistant
**Path**: Resources → AI Assistant

A conversational AI assistant that can answer questions about using the KPJ Bill Estimator system. Ask questions like:
- "How do I upload historical billing data?"
- "What does P50 vs P75 mean?"
- "How do I add a new doctor?"
- "What file format is needed for data ingestion?"
- "How are averages calculated?"

The assistant references this user manual to provide accurate, contextual answers.

---

## 6. Frequently Asked Questions

**Q: What is the difference between P50 and P75?**
A: P50 (Median) means 50% of historical cases cost less than this amount. P75 means 75% of cases cost less. Use P50 for a typical estimate and P75 for a conservative (higher) estimate.

**Q: Why does my estimate show "hospital-wide data"?**
A: This means there isn't enough doctor-specific historical data for your selected doctor. The system falls back to all doctors at that hospital for the given procedure, which still provides a reliable estimate.

**Q: Can I estimate costs for multiple procedures at once?**
A: Yes. In Step 1, you can add multiple procedures using the multi-select. The estimate will sum the costs for all selected procedures.

**Q: What is a Surgical Package?**
A: Some common procedures have fixed-price packages offered by KPJ that bundle surgery fees, room stay, tests, and medications at a set price. When available, the package price is shown alongside the P50/P75 estimates for comparison.

**Q: How often should historical data be uploaded?**
A: We recommend uploading billing data annually to keep estimates current. The system uses the most recent 2 years of data for calculations.

**Q: What happens if I upload data with an unrecognized hospital code?**
A: Those rows will be skipped with a warning. Ensure your CSV uses the exact hospital codes registered in the system (e.g., KPJ-AMP, KPJ-DAM).

**Q: How do I get access to the Data Management features?**
A: Data Management is restricted to Group users. Contact your system administrator to be assigned the Group role.
`;

export default function UserManual() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold font-display text-foreground">User Manual</h1>
      </div>

      <Accordion type="multiple" defaultValue={["overview", "getting-started", "estimator"]} className="space-y-3">
        {/* 1. System Overview */}
        <AccordionItem value="overview" className="rounded-xl border border-border bg-card px-4">
          <AccordionTrigger className="text-base font-semibold font-display hover:no-underline">
            <span className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> 1. System Overview</span>
          </AccordionTrigger>
          <AccordionContent className="prose prose-sm max-w-none text-foreground font-sans">
            <p>The KPJ Bill Estimator is a data-driven cost estimation system for KPJ Healthcare Group. It provides <strong>P50 (Median)</strong> and <strong>P75 (High-end)</strong> bill estimates based on historical billing data across all KPJ hospitals.</p>
            <p>Estimates are segmented by hospital, doctor, procedure, diagnosis, comorbidity, age group, and gender.</p>
            <h4 className="font-display">Key Features</h4>
            <ul>
              <li>Bill estimation with P50 and P75 breakdowns by fee category (consultant, surgery, radiology, laboratory, pharmacy, room & board)</li>
              <li>Doctor-specific vs hospital-wide estimates with automatic fallback</li>
              <li>AI-powered competitor price comparison</li>
              <li>Surgical package pricing where available</li>
              <li>Historical data ingestion and automated P50/P75 recalculation</li>
              <li>Role-based access control</li>
            </ul>
            <h4 className="font-display">User Roles</h4>
            <ul>
              <li><strong>Group Users</strong> — Full system administrators. Manage hospitals, doctors, procedures, reference data, data ingestion, averages, and user roles.</li>
              <li><strong>Hospital Users</strong> — View facility data and generate bill estimates for their hospital.</li>
              <li><strong>Doctor Users</strong> — View profile and generate bill estimates for their procedures.</li>
              <li><strong>Admin Users</strong> — System-wide administration capabilities.</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        {/* 2. Getting Started */}
        <AccordionItem value="getting-started" className="rounded-xl border border-border bg-card px-4">
          <AccordionTrigger className="text-base font-semibold font-display hover:no-underline">
            <span className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> 2. Getting Started</span>
          </AccordionTrigger>
          <AccordionContent className="prose prose-sm max-w-none text-foreground font-sans">
            <h4 className="font-display">Logging In</h4>
            <ol>
              <li>Navigate to the login page.</li>
              <li>Enter your registered email address and password.</li>
              <li>Click "Sign In" to access the dashboard.</li>
              <li>New users: Click "Sign Up", fill in your details, and verify your email before logging in.</li>
            </ol>
            <h4 className="font-display">Dashboard</h4>
            <p>After login, you'll see the Dashboard with quick links based on your role. If no role is assigned, contact your Group administrator.</p>
          </AccordionContent>
        </AccordionItem>

        {/* 3. Bill Estimator */}
        <AccordionItem value="estimator" className="rounded-xl border border-border bg-card px-4">
          <AccordionTrigger className="text-base font-semibold font-display hover:no-underline">
            <span className="flex items-center gap-2"><Calculator className="h-4 w-4 text-primary" /> 3. Bill Estimator</span>
          </AccordionTrigger>
          <AccordionContent className="prose prose-sm max-w-none text-foreground font-sans">
            <h4 className="font-display">Step 1 — Core Details (Required)</h4>
            <ol>
              <li><strong>Select Hospital</strong>: Choose a KPJ hospital. This filters the doctor list.</li>
              <li><strong>Select Doctor</strong> (optional): If selected, the system attempts doctor-specific pricing first.</li>
              <li><strong>Select Procedure(s)</strong>: Search and add one or more Schedule 13 procedure codes. The system may suggest related procedures.</li>
              <li><strong>Choose Episode Type</strong>: Inpatient (IP), Outpatient (OP), Day Surgery (DS), or Emergency (ER).</li>
            </ol>
            <p>Then choose <strong>Quick Estimate</strong> for immediate results, or <strong>Refine Estimate</strong> for Step 2.</p>

            <h4 className="font-display">Step 2 — Refine Estimate (Optional)</h4>
            <ul>
              <li><strong>Patient Age</strong>: 0–110. Binned into groups: 0-12, 13-17, 18-30, 31-45, 46-60, 61-75, 76+.</li>
              <li><strong>Gender</strong>: Male or Female.</li>
              <li><strong>Ward Type</strong>: Single Room, Twin Sharing, 4-Bed, 6-Bed, Suite, or ICU.</li>
              <li><strong>Length of Stay</strong>: Expected days.</li>
              <li><strong>Payor Type & Name</strong>: Payment category and specific insurer.</li>
            </ul>

            <h4 className="font-display">Understanding Results</h4>
            <ul>
              <li><strong>Total Estimated Cost</strong> with P50/P75 toggle.</li>
              <li><strong>Data Source Info</strong>: Number of historical cases, data years, doctor-specific vs hospital-wide.</li>
              <li><strong>Fee Breakdown Chart & Table</strong>: Consultant, Surgery, Radiology, Laboratory, Pharmacy, Room & Board.</li>
              <li><strong>Surgical Package</strong>: Fixed-price bundles when available.</li>
              <li><strong>Competitor Comparison</strong>: AI-powered pricing from nearby competitor hospitals.</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        {/* 4. Data Management */}
        <AccordionItem value="data-management" className="rounded-xl border border-border bg-card px-4">
          <AccordionTrigger className="text-base font-semibold font-display hover:no-underline">
            <span className="flex items-center gap-2"><Database className="h-4 w-4 text-primary" /> 4. Data Management (Group Users Only)</span>
          </AccordionTrigger>
          <AccordionContent className="prose prose-sm max-w-none text-foreground font-sans">
            <h4 className="font-display"><Building2 className="inline h-4 w-4 mr-1" />Manage Hospitals</h4>
            <p>View, search, add, edit, and toggle active status for KPJ hospitals. Required fields: Code (e.g., KPJ-AMP) and Name. Optional: Address, State.</p>

            <h4 className="font-display"><Stethoscope className="inline h-4 w-4 mr-1" />Manage Doctors</h4>
            <p>View, search, add, edit, and toggle status for doctors. Required: Code and Name. Optional: Specialty and Hospital assignment.</p>

            <h4 className="font-display"><ClipboardList className="inline h-4 w-4 mr-1" />Manage Procedures</h4>
            <p>Manage Schedule 13 procedures. Required: Code (e.g., S13-005) and Name. Optional: Category (e.g., Orthopaedic).</p>

            <h4 className="font-display"><Layers className="inline h-4 w-4 mr-1" />Reference Data</h4>
            <p>Manage lookup tables in three tabs:</p>
            <ul>
              <li><strong>Ward Types</strong>: SR (Single Room), TS (Twin Sharing), 4B, 6B, SU (Suite), ICU</li>
              <li><strong>Episode Types</strong>: IP (Inpatient), OP (Outpatient), DS (Day Surgery), ER (Emergency)</li>
              <li><strong>Payor Types</strong>: Self-Pay, Insurance, Corporate, Government</li>
            </ul>

            <h4 className="font-display"><Upload className="inline h-4 w-4 mr-1" />Data Ingestion</h4>
            <ol>
              <li>Click <strong>Download CSV Template</strong> for the correct format.</li>
              <li>Prepare your CSV with required columns: hospital_code, procedure_code, total_bill.</li>
              <li>Optional columns: doctor_code, diagnosis_code (ICD-10), comorbidity, episode_type, ward_type, age, gender, bill_date, and fee breakdowns (consultant_fee, surgery_fee, radiology_fee, lab_fee, pharmacy_fee, room_fee).</li>
              <li>Select the Data Year, choose the file, and click Upload & Process.</li>
              <li>The system validates codes and shows progress. Unrecognized hospital/doctor codes are skipped with warnings.</li>
            </ol>

            <h4 className="font-display">Recalculate Averages</h4>
            <p>After uploading data, click <strong>Recalculate P50/P75 Averages</strong>. The system processes the most recent 2 years and calculates across: Hospital, Doctor, Procedure, Episode Type, Ward Type, Diagnosis, Age Group, and Gender.</p>

            <h4 className="font-display"><Users className="inline h-4 w-4 mr-1" />User Management</h4>
            <p>View all registered users and manage their roles. Click the shield icon to assign/remove roles (Admin, Group, Hospital, Doctor). Users can have multiple roles.</p>
          </AccordionContent>
        </AccordionItem>

        {/* 5. AI Assistant */}
        <AccordionItem value="ai-assistant" className="rounded-xl border border-border bg-card px-4">
          <AccordionTrigger className="text-base font-semibold font-display hover:no-underline">
            <span className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-primary" /> 5. AI Assistant</span>
          </AccordionTrigger>
          <AccordionContent className="prose prose-sm max-w-none text-foreground font-sans">
            <p>The AI Assistant is a conversational chatbot that answers questions about using the KPJ Bill Estimator. It references this user manual for accurate responses.</p>
            <h4 className="font-display">Example Questions</h4>
            <ul>
              <li>"How do I upload historical billing data?"</li>
              <li>"What does P50 vs P75 mean?"</li>
              <li>"How do I add a new doctor?"</li>
              <li>"What file format is needed for data ingestion?"</li>
              <li>"How are averages calculated?"</li>
              <li>"What roles can be assigned to users?"</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        {/* 6. FAQ */}
        <AccordionItem value="faq" className="rounded-xl border border-border bg-card px-4">
          <AccordionTrigger className="text-base font-semibold font-display hover:no-underline">
            <span className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> 6. Frequently Asked Questions</span>
          </AccordionTrigger>
          <AccordionContent className="prose prose-sm max-w-none text-foreground font-sans">
            <h4 className="font-display">What is the difference between P50 and P75?</h4>
            <p>P50 (Median) means 50% of historical cases cost less than this amount. P75 means 75%. Use P50 for a typical estimate and P75 for a conservative estimate.</p>

            <h4 className="font-display">Why does my estimate show "hospital-wide data"?</h4>
            <p>There isn't enough doctor-specific historical data. The system falls back to all doctors at that hospital for the procedure.</p>

            <h4 className="font-display">Can I estimate costs for multiple procedures?</h4>
            <p>Yes. Add multiple procedures in Step 1. The estimate sums the costs for all selected procedures.</p>

            <h4 className="font-display">What is a Surgical Package?</h4>
            <p>A fixed-price bundle including surgery fees, room stay, tests, and medications. Shown alongside P50/P75 estimates when available.</p>

            <h4 className="font-display">How often should data be uploaded?</h4>
            <p>Annually recommended. The system uses the most recent 2 years of data.</p>

            <h4 className="font-display">What if my CSV has unrecognized hospital codes?</h4>
            <p>Those rows are skipped with warnings. Ensure codes match those registered in the Hospitals module (e.g., KPJ-AMP).</p>

            <h4 className="font-display">How do I access Data Management?</h4>
            <p>Data Management is restricted to Group users. Contact your administrator for role assignment.</p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
