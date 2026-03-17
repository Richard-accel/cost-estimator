import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, Printer, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TocItem {
  id: string;
  label: string;
  level: number;
}

const tocItems: TocItem[] = [
  { id: "cover", label: "Cover Page", level: 1 },
  { id: "revision-history", label: "Document Revision History", level: 1 },
  { id: "executive-summary", label: "1. Executive Summary", level: 1 },
  { id: "system-objectives", label: "2. System Objectives", level: 1 },
  { id: "obj-primary", label: "2.1 Primary Objectives", level: 2 },
  { id: "obj-secondary", label: "2.2 Secondary Objectives", level: 2 },
  { id: "system-architecture", label: "3. System Architecture", level: 1 },
  { id: "arch-overview", label: "3.1 Architecture Overview", level: 2 },
  { id: "arch-tech-stack", label: "3.2 Technology Stack", level: 2 },
  { id: "arch-data-flow", label: "3.3 Data Flow Architecture", level: 2 },
  { id: "process-workflow", label: "4. Process & System Workflow", level: 1 },
  { id: "wf-estimation", label: "4.1 Estimation Workflow", level: 2 },
  { id: "wf-recommendation", label: "4.2 Recommendation Engine Workflow", level: 2 },
  { id: "wf-results", label: "4.3 Results Presentation Workflow", level: 2 },
  { id: "modules", label: "5. Module Descriptions & Functionalities", level: 1 },
  { id: "mod-estimator", label: "5.1 Bill Estimator Module", level: 2 },
  { id: "mod-recommendation", label: "5.2 Procedure Recommendation Module", level: 2 },
  { id: "mod-estimation-engine", label: "5.3 Estimation Engine Module", level: 2 },
  { id: "mod-results", label: "5.4 Results & Insights Module", level: 2 },
  { id: "mod-data", label: "5.5 Data Management Module", level: 2 },
  { id: "mod-ui", label: "5.6 UI Component Library", level: 2 },
  { id: "data-dictionary", label: "6. Data Dictionary", level: 1 },
  { id: "dd-hospitals", label: "6.1 Hospital Entity", level: 2 },
  { id: "dd-doctors", label: "6.2 Doctor Entity", level: 2 },
  { id: "dd-procedures", label: "6.3 Procedure Entity", level: 2 },
  { id: "dd-estimation", label: "6.4 Estimation Result Entity", level: 2 },
  { id: "business-rules", label: "7. Business Rules & Logic", level: 1 },
  { id: "br-cost", label: "7.1 Cost Calculation Rules", level: 2 },
  { id: "br-ward", label: "7.2 Ward Type Multipliers", level: 2 },
  { id: "br-surgical", label: "7.3 Surgical Package Rules", level: 2 },
  { id: "security", label: "8. Security & Access Control", level: 1 },
  { id: "appendix", label: "9. Appendices", level: 1 },
  { id: "appendix-procedures", label: "9.1 Full Procedure Code Listing", level: 2 },
  { id: "appendix-glossary", label: "9.2 Glossary of Terms", level: 2 },
];

export default function Documentation() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("cover");
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    );
    const sections = document.querySelectorAll("[data-section]");
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
              <FileText className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-bold font-display text-foreground">System Documentation</h1>
              <p className="text-[11px] text-muted-foreground">KPJ Hospital Bill Estimation System</p>
            </div>
          </div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors print:hidden"
          >
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto flex">
        {/* Sidebar TOC */}
        <aside className="hidden lg:block w-72 flex-shrink-0 border-r border-border sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto print:hidden">
          <nav className="py-6 px-4 space-y-0.5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 px-2">Table of Contents</div>
            {tocItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`w-full text-left rounded-md px-2 py-1.5 text-[12px] leading-snug transition-colors ${
                  item.level === 2 ? "pl-6" : "font-semibold"
                } ${
                  activeSection === item.id
                    ? "bg-highlight text-highlight-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Document Body */}
        <main ref={contentRef} className="flex-1 min-w-0">
          <div className="max-w-[816px] mx-auto py-8 px-6 sm:px-10 space-y-0">
            {/* Word-like document styling wrapper */}
            <div className="bg-card border border-border rounded-sm shadow-sm print:shadow-none print:border-0" style={{ fontFamily: "'Times New Roman', 'Cambria', Georgia, serif" }}>
              <div className="px-12 py-16 space-y-10 text-[14px] leading-[1.8] text-card-foreground">

                {/* ============= COVER PAGE ============= */}
                <section id="cover" data-section className="text-center py-20 border-b-2 border-border">
                  <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-8">KPJ Healthcare Berhad</div>
                  <h1 className="text-[32px] font-bold leading-tight text-foreground" style={{ fontFamily: "'Cambria', Georgia, serif" }}>
                    Hospital Bill Estimation System
                  </h1>
                  <h2 className="text-[18px] font-normal text-muted-foreground mt-3" style={{ fontFamily: "'Cambria', Georgia, serif" }}>
                    System Documentation & Technical Reference
                  </h2>
                  <div className="mt-12 text-[12px] text-muted-foreground space-y-1">
                    <p><strong>Document Version:</strong> 1.0</p>
                    <p><strong>Date:</strong> 24 February 2026</p>
                    <p><strong>Classification:</strong> Internal — Confidential</p>
                    <p><strong>Prepared by:</strong> Digital Transformation & IT Division</p>
                  </div>
                </section>

                {/* ============= REVISION HISTORY ============= */}
                <section id="revision-history" data-section className="pt-8">
                  <DocHeading level={1}>Document Revision History</DocHeading>
                  <table className="w-full text-[12px] border-collapse mt-4">
                    <thead>
                      <tr className="border-b-2 border-foreground/20">
                        <th className="text-left py-2 pr-4 font-semibold">Version</th>
                        <th className="text-left py-2 pr-4 font-semibold">Date</th>
                        <th className="text-left py-2 pr-4 font-semibold">Author</th>
                        <th className="text-left py-2 font-semibold">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border">
                        <td className="py-2 pr-4">0.1</td>
                        <td className="py-2 pr-4">10 Jan 2026</td>
                        <td className="py-2 pr-4">IT Division</td>
                        <td className="py-2">Initial draft — requirements gathering</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-2 pr-4">0.5</td>
                        <td className="py-2 pr-4">01 Feb 2026</td>
                        <td className="py-2 pr-4">IT Division</td>
                        <td className="py-2">Added estimation engine logic and UI wireframes</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-2 pr-4">1.0</td>
                        <td className="py-2 pr-4">24 Feb 2026</td>
                        <td className="py-2 pr-4">IT Division</td>
                        <td className="py-2">Final release — complete system documentation</td>
                      </tr>
                    </tbody>
                  </table>
                </section>

                {/* ============= 1. EXECUTIVE SUMMARY ============= */}
                <section id="executive-summary" data-section className="pt-8">
                  <DocHeading level={1}>1. Executive Summary</DocHeading>
                  <p className="mt-4">
                    The <strong>KPJ Hospital Bill Estimation System</strong> is a web-based decision-support application developed for KPJ Healthcare Berhad
                    to provide transparent, data-driven hospital bill estimates to patients, admitting officers, and financial counsellors across all 15 KPJ
                    specialist hospitals in Malaysia.
                  </p>
                  <p className="mt-3">
                    The system leverages historical billing data, procedure-level cost distributions, and AI-driven procedure recommendations to generate
                    statistical estimates at the <strong>50th percentile (median)</strong> and <strong>75th percentile (high-end)</strong>, enabling patients
                    to understand the expected cost range before admission. The application follows a progressive disclosure interface pattern — users begin
                    with a <em>Quick Estimate</em> using mandatory core fields (hospital, doctor, procedure, and episode type), and may optionally refine
                    their estimate with demographic, clinical, and logistical parameters such as patient age, diagnosis code (ICD-10), ward preference, and
                    anticipated length of stay.
                  </p>
                  <p className="mt-3">
                    Key differentiators of this system include: (1) an intelligent procedure recommendation engine that suggests commonly co-occurring
                    procedures based on historical probability data; (2) doctor-specific versus hospital-wide estimation capabilities; (3) fixed surgical
                    package detection and display; and (4) an interactive results dashboard with category-level fee breakdowns presented via both tabular
                    and graphical formats.
                  </p>
                  <p className="mt-3">
                    This document serves as the authoritative reference for the system's architecture, processes, modules, data structures, business logic,
                    and operational guidelines. It is intended for technical stakeholders, project sponsors, clinical informaticists, and QA teams involved in
                    the development, maintenance, and enhancement of the platform.
                  </p>
                </section>

                {/* ============= 2. SYSTEM OBJECTIVES ============= */}
                <section id="system-objectives" data-section className="pt-8">
                  <DocHeading level={1}>2. System Objectives</DocHeading>
                </section>

                <section id="obj-primary" data-section>
                  <DocHeading level={2}>2.1 Primary Objectives</DocHeading>
                  <ol className="list-decimal list-inside mt-3 space-y-2 pl-4">
                    <li><strong>Bill Transparency:</strong> Provide patients with realistic, data-backed bill estimates prior to hospital admission, reducing bill shock and improving patient satisfaction scores.</li>
                    <li><strong>Operational Efficiency:</strong> Reduce the time financial counsellors spend manually computing estimates from 15–20 minutes per case to under 2 minutes through automated calculation.</li>
                    <li><strong>Standardised Estimation:</strong> Establish a consistent estimation methodology across all 15 KPJ hospitals, eliminating facility-level discrepancies in how estimates are communicated.</li>
                    <li><strong>Decision Support:</strong> Empower patients to make informed decisions regarding procedure selection, ward preference, and payor arrangements based on accurate cost projections.</li>
                    <li><strong>Regulatory Compliance:</strong> Align with Malaysia's Ministry of Health (MOH) guidelines on healthcare pricing transparency and the Private Healthcare Facilities and Services Act 1998.</li>
                  </ol>
                </section>

                <section id="obj-secondary" data-section>
                  <DocHeading level={2}>2.2 Secondary Objectives</DocHeading>
                  <ol className="list-decimal list-inside mt-3 space-y-2 pl-4">
                    <li><strong>Data Analytics Foundation:</strong> Establish a structured dataset of estimation requests and outcomes that can inform future pricing strategy and actuarial analysis.</li>
                    <li><strong>Doctor Performance Insights:</strong> Enable comparison of doctor-specific versus hospital-wide cost patterns to identify outliers and support quality improvement initiatives.</li>
                    <li><strong>Patient Engagement:</strong> Serve as a patient-facing digital touchpoint that reinforces KPJ's commitment to transparent and affordable healthcare.</li>
                    <li><strong>Integration Readiness:</strong> Design the system architecture to support future integration with KPJ's Hospital Information System (HIS), Electronic Medical Records (EMR), and insurance pre-authorisation workflows.</li>
                  </ol>
                </section>

                {/* ============= 3. SYSTEM ARCHITECTURE ============= */}
                <section id="system-architecture" data-section className="pt-8">
                  <DocHeading level={1}>3. System Architecture</DocHeading>
                </section>

                <section id="arch-overview" data-section>
                  <DocHeading level={2}>3.1 Architecture Overview</DocHeading>
                  <p className="mt-3">
                    The KPJ Bill Estimation System is built as a <strong>Single-Page Application (SPA)</strong> following a component-based architecture.
                    The application is structured into three logical tiers:
                  </p>
                  <ul className="list-disc list-inside mt-3 space-y-2 pl-4">
                    <li><strong>Presentation Layer:</strong> React components responsible for user interface rendering, form management, and interactive data visualisation. Key components include <code className="text-[12px] bg-muted px-1 rounded">EstimatorForm</code>, <code className="text-[12px] bg-muted px-1 rounded">ResultsPage</code>, <code className="text-[12px] bg-muted px-1 rounded">SearchableSelect</code>, and <code className="text-[12px] bg-muted px-1 rounded">MultiSelect</code>.</li>
                    <li><strong>Business Logic Layer:</strong> The <code className="text-[12px] bg-muted px-1 rounded">estimationEngine.ts</code> module encapsulates all cost calculation logic, including base cost lookups, multiplier application, percentile computation, fee distribution, and surgical package matching.</li>
                    <li><strong>Data Layer:</strong> Static data files (<code className="text-[12px] bg-muted px-1 rounded">hospitals.ts</code>) containing reference datasets for hospitals, doctors, procedures, diagnoses, ward types, and procedure recommendations. This layer is designed to be swappable with API-based data retrieval in production.</li>
                  </ul>
                </section>

                <section id="arch-tech-stack" data-section>
                  <DocHeading level={2}>3.2 Technology Stack</DocHeading>
                  <table className="w-full text-[12px] border-collapse mt-4">
                    <thead>
                      <tr className="border-b-2 border-foreground/20">
                        <th className="text-left py-2 pr-4 font-semibold w-40">Layer</th>
                        <th className="text-left py-2 pr-4 font-semibold">Technology</th>
                        <th className="text-left py-2 font-semibold">Purpose</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Front-end Framework", "React 18.3 with TypeScript", "Component-based UI development with type safety"],
                        ["Build Tool", "Vite 5.x", "Fast development server and optimised production builds"],
                        ["Styling", "Tailwind CSS 4.x with custom design tokens", "Utility-first CSS with semantic theming via HSL variables"],
                        ["UI Components", "shadcn/ui + Radix UI Primitives", "Accessible, unstyled component primitives with custom styling"],
                        ["Animation", "Framer Motion 12.x", "Declarative animations for page transitions and micro-interactions"],
                        ["Charts", "Recharts 2.x", "Responsive, composable charting for fee breakdown visualisation"],
                        ["Routing", "React Router DOM 6.x", "Client-side SPA routing with nested route support"],
                        ["State Management", "React useState/useReducer", "Local component state management (no global store required)"],
                        ["Icons", "Lucide React", "Consistent, tree-shakeable icon library"],
                        ["Form Validation", "React Hook Form + Zod", "Declarative form validation with TypeScript-first schema definition"],
                      ].map(([layer, tech, purpose], i) => (
                        <tr key={i} className="border-b border-border">
                          <td className="py-2 pr-4 font-medium">{layer}</td>
                          <td className="py-2 pr-4">{tech}</td>
                          <td className="py-2">{purpose}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>

                <section id="arch-data-flow" data-section>
                  <DocHeading level={2}>3.3 Data Flow Architecture</DocHeading>
                  <p className="mt-3">
                    The system follows a unidirectional data flow pattern consistent with React best practices:
                  </p>
                  <div className="mt-4 bg-muted/50 border border-border rounded-md p-5 text-[12px] font-mono leading-relaxed">
                    <div className="space-y-1">
                      <p>┌─────────────────────────────────────────────────────────────┐</p>
                      <p>│                      USER INTERACTION                       │</p>
                      <p>│  Hospital → Doctor → Procedure(s) → Episode Type            │</p>
                      <p>└──────────────────────────┬──────────────────────────────────┘</p>
                      <p>                           │</p>
                      <p>                           ▼</p>
                      <p>┌──────────────────────────────────────────────────────────────┐</p>
                      <p>│                    ESTIMATOR FORM MODULE                     │</p>
                      <p>│  Collects, validates and structures form data                │</p>
                      <p>│  Triggers AI Procedure Recommendations on selection          │</p>
                      <p>└──────────────────────────┬──────────────────────────────────┘</p>
                      <p>                           │</p>
                      <p>                           ▼</p>
                      <p>┌──────────────────────────────────────────────────────────────┐</p>
                      <p>│                    ESTIMATION ENGINE                         │</p>
                      <p>│  Base cost lookup → Multipliers → Percentile split           │</p>
                      <p>│  Fee distribution → Surgical package check                   │</p>
                      <p>└──────────────────────────┬──────────────────────────────────┘</p>
                      <p>                           │</p>
                      <p>                           ▼</p>
                      <p>┌──────────────────────────────────────────────────────────────┐</p>
                      <p>│                    RESULTS PAGE MODULE                       │</p>
                      <p>│  Percentile toggle → Bar chart → Fee table → Package card    │</p>
                      <p>└──────────────────────────────────────────────────────────────┘</p>
                    </div>
                  </div>
                </section>

                {/* ============= 4. PROCESS & SYSTEM WORKFLOW ============= */}
                <section id="process-workflow" data-section className="pt-8">
                  <DocHeading level={1}>4. Process & System Workflow</DocHeading>
                  <p className="mt-3">
                    This section describes the end-to-end workflows that govern how users interact with the system and how data flows through the estimation pipeline.
                  </p>
                </section>

                <section id="wf-estimation" data-section>
                  <DocHeading level={2}>4.1 Estimation Workflow</DocHeading>
                  <p className="mt-3">The core estimation workflow follows a two-step progressive disclosure pattern:</p>
                  <div className="mt-4 space-y-4">
                    <WorkflowStep number={1} title="Step 1 — Core Details (Mandatory)">
                      <p>The user must complete four mandatory fields to generate a baseline estimate:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1 pl-4">
                        <li><strong>Hospital Selection:</strong> User selects from a searchable dropdown of 15 KPJ specialist hospitals. This filters the available doctors list.</li>
                        <li><strong>Doctor Selection:</strong> User selects the admitting doctor from the hospital-filtered list. The doctor's specialty is auto-populated. If no doctor is selected, the system uses hospital-wide aggregate data.</li>
                        <li><strong>Procedure Selection:</strong> User selects one or more procedures from a searchable multi-select component containing 30 procedure codes. Upon primary procedure selection, the Recommendation Engine (Section 4.2) activates.</li>
                        <li><strong>Episode Type:</strong> User selects from three mutually exclusive options: Inpatient, Outpatient, or Day Surgery. This significantly affects the cost multiplier.</li>
                      </ul>
                      <p className="mt-2">At this point, the user may click <strong>"Quick Estimate"</strong> to immediately generate results, or proceed to Step 2.</p>
                    </WorkflowStep>

                    <WorkflowStep number={2} title="Step 2 — Refinement (Optional)">
                      <p>Optional fields are presented in a second panel for users who wish to improve estimate accuracy:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1 pl-4">
                        <li><strong>Patient Age (0–110):</strong> Numeric input. Ages above 65 trigger a 15% cost adjustment for higher complexity of care.</li>
                        <li><strong>Gender:</strong> Binary selection (Male/Female) for gender-specific procedure adjustments.</li>
                        <li><strong>Diagnosis Code (ICD-10):</strong> Searchable dropdown of 12 common diagnosis codes for clinical context.</li>
                        <li><strong>Ward Type:</strong> Selection from 6 ward categories (Suite, Single Room, Twin Sharing, 4-Bedded, 6-Bedded, ICU) with corresponding cost multipliers ranging from 0.85× to 2.0×.</li>
                        <li><strong>Length of Stay (Days):</strong> Numeric input (0–99). Each additional day beyond 1 adds 12% to the base cost.</li>
                        <li><strong>Payor Type & Name:</strong> Self-pay, Insurance, Corporate, or Others, with free-text payor name.</li>
                      </ul>
                    </WorkflowStep>

                    <WorkflowStep number={3} title="Step 3 — Estimate Generation">
                      <p>Upon submission, the system invokes the Estimation Engine (Section 5.3) which performs the following sequential operations:</p>
                      <ol className="list-decimal list-inside mt-2 space-y-1 pl-4">
                        <li>Aggregate base costs for all selected procedure codes</li>
                        <li>Apply ward type multiplier (if specified)</li>
                        <li>Apply length-of-stay multiplier (if LOS &gt; 1 day)</li>
                        <li>Apply episode type multiplier (Outpatient: 0.4×, Day Surgery: 0.65×)</li>
                        <li>Apply age-based adjustment (Age &gt; 65: 1.15×)</li>
                        <li>Compute P50 (total) and P75 (total × 1.35)</li>
                        <li>Distribute totals across six fee categories using fixed percentage ratios</li>
                        <li>Check for matching surgical package on primary procedure code</li>
                      </ol>
                    </WorkflowStep>
                  </div>
                </section>

                <section id="wf-recommendation" data-section>
                  <DocHeading level={2}>4.2 Recommendation Engine Workflow</DocHeading>
                  <p className="mt-3">
                    The Procedure Recommendation Engine is a distinctive feature that proactively suggests commonly co-occurring procedures to improve estimation completeness.
                  </p>
                  <div className="mt-4 space-y-3">
                    <p><strong>Trigger:</strong> Activated automatically when a user selects a primary procedure code in the Estimator Form.</p>
                    <p><strong>Process:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 pl-4">
                      <li>The system looks up the selected procedure code against the <code className="text-[12px] bg-muted px-1 rounded">procedureRecommendations</code> reference table.</li>
                      <li>A simulated 1.5-second loading state is displayed with a pulsing "Analysing procedure patterns…" indicator to convey the system is processing historical data.</li>
                      <li>If recommendations exist, up to two co-occurring procedures are displayed with their historical probability (e.g., "88% of TKR episodes also include Setting of Branula").</li>
                      <li>The user is presented with two action buttons: <strong>"Yes, include these"</strong> (which adds the recommended procedures to the selection) or <strong>"No, I'll use my own"</strong> (which dismisses the recommendation).</li>
                    </ol>
                    <p><strong>Currently Supported Procedure Combinations:</strong></p>
                    <table className="w-full text-[12px] border-collapse mt-2">
                      <thead>
                        <tr className="border-b-2 border-foreground/20">
                          <th className="text-left py-2 pr-4 font-semibold">Primary Procedure</th>
                          <th className="text-left py-2 pr-4 font-semibold">Recommended Procedure</th>
                          <th className="text-left py-2 font-semibold">Probability</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ["PR001 — Total Knee Replacement", "PR021 — Setting of Branula", "88%"],
                          ["PR001 — Total Knee Replacement", "PR024 — Physiotherapy Session", "75%"],
                          ["PR004 — CABG", "PR023 — ECG Monitoring", "95%"],
                          ["PR004 — CABG", "PR022 — Blood Transfusion", "60%"],
                          ["PR007 — Cholecystectomy", "PR021 — Setting of Branula", "82%"],
                          ["PR009 — Caesarean Section", "PR021 — Setting of Branula", "92%"],
                          ["PR009 — Caesarean Section", "PR022 — Blood Transfusion", "45%"],
                          ["PR012 — Cataract Surgery", "PR023 — ECG Monitoring", "30%"],
                        ].map(([primary, rec, prob], i) => (
                          <tr key={i} className="border-b border-border">
                            <td className="py-1.5 pr-4">{primary}</td>
                            <td className="py-1.5 pr-4">{rec}</td>
                            <td className="py-1.5">{prob}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section id="wf-results" data-section>
                  <DocHeading level={2}>4.3 Results Presentation Workflow</DocHeading>
                  <p className="mt-3">
                    Upon successful estimation, the system transitions to the Results Page which presents data through multiple complementary views:
                  </p>
                  <ol className="list-decimal list-inside mt-3 space-y-2 pl-4">
                    <li><strong>Percentile Toggle:</strong> A toggle control allows users to switch between P50 (Median) and P75 (High-end) views. All displayed values — total, chart, and table — update reactively.</li>
                    <li><strong>Total Estimate Card:</strong> A prominent gradient card displays the selected percentile total in Malaysian Ringgit (RM), with the procedure name(s) listed below. If no doctor was selected, a contextual note informs the user that the estimate is based on hospital-wide data.</li>
                    <li><strong>Range Comparison:</strong> Side-by-side cards show both P50 and P75 totals simultaneously, with the active percentile visually highlighted.</li>
                    <li><strong>Fee Breakdown Chart:</strong> A horizontal bar chart (using Recharts) displays the six fee categories with distinct colour coding. An accompanying tabular breakdown shows exact RM amounts per category with a bolded total row.</li>
                    <li><strong>Surgical Package Card:</strong> If the primary procedure matches a predefined surgical package, a highlighted card displays the package name, fixed price, and itemised inclusions (e.g., surgery fees, implant, room nights, pre-op tests).</li>
                  </ol>
                </section>

                {/* ============= 5. MODULE DESCRIPTIONS ============= */}
                <section id="modules" data-section className="pt-8">
                  <DocHeading level={1}>5. Module Descriptions & Functionalities</DocHeading>
                  <p className="mt-3">
                    This section provides a detailed description of each module in the system, including its responsibilities, interfaces, and internal logic.
                  </p>
                </section>

                <section id="mod-estimator" data-section>
                  <DocHeading level={2}>5.1 Bill Estimator Module</DocHeading>
                  <ModuleCard
                    file="src/components/EstimatorForm.tsx"
                    purpose="Collects and validates all user inputs required for bill estimation through a two-step progressive form."
                    responsibilities={[
                      "Renders the two-step input interface with animated transitions between Core Details and Refinement panels",
                      "Manages form state for 12 input fields using React useState with a typed EstimatorFormData interface",
                      "Filters doctor options dynamically based on selected hospital",
                      "Auto-fills doctor specialty when a doctor is selected",
                      "Validates mandatory fields (hospital, doctor, procedure, episode type) before enabling submission",
                      "Supports both 'Quick Estimate' (skip Step 2) and 'Refined Estimate' (complete Step 2) submission paths",
                      "Integrates the Procedure Recommendation Module when procedures are selected",
                    ]}
                    interfaces={[
                      "Input: User interactions (selections, text input)",
                      "Output: EstimatorFormData object passed to parent via onSubmit callback",
                      "Dependencies: SearchableSelect, MultiSelect, ProcedureRecommendations, StepIndicator components",
                    ]}
                  />
                </section>

                <section id="mod-recommendation" data-section>
                  <DocHeading level={2}>5.2 Procedure Recommendation Module</DocHeading>
                  <ModuleCard
                    file="src/components/ProcedureRecommendations.tsx"
                    purpose="Provides AI-driven suggestions for commonly co-occurring procedures based on historical data patterns."
                    responsibilities={[
                      "Monitors the primary procedure selection and triggers recommendation lookup",
                      "Simulates a 1.5-second analysis period with animated loading state",
                      "Displays up to 2 recommended procedures with probability percentages",
                      "Filters out procedures already selected by the user to avoid duplicates",
                      "Provides accept/decline action buttons with immediate form state integration",
                      "Handles graceful degradation when no recommendations exist for a procedure",
                    ]}
                    interfaces={[
                      "Input: primaryProcedureCode (string), currentProcedures (string[])",
                      "Output: onAccept callback with array of accepted procedure codes",
                      "Data Source: procedureRecommendations lookup table in hospitals.ts",
                    ]}
                  />
                </section>

                <section id="mod-estimation-engine" data-section>
                  <DocHeading level={2}>5.3 Estimation Engine Module</DocHeading>
                  <ModuleCard
                    file="src/data/estimationEngine.ts"
                    purpose="Core business logic module that computes bill estimates based on input parameters and returns structured results."
                    responsibilities={[
                      "Maintains base cost lookup table for 30 procedure codes (range: RM 200 – RM 65,000)",
                      "Aggregates total base cost across multiple selected procedures",
                      "Applies ward type multiplier (Suite: 1.6×, Single: 1.3×, Twin: 1.1×, 4-Bed: 1.0×, 6-Bed: 0.85×, ICU: 2.0×)",
                      "Applies length-of-stay increment (12% per additional day beyond Day 1)",
                      "Applies episode type adjustment (Outpatient: 0.4×, Day Surgery: 0.65×, Inpatient: 1.0×)",
                      "Applies age-based complexity adjustment (Age > 65: 1.15×)",
                      "Computes P50 (base total) and P75 (base × 1.35) estimates",
                      "Distributes total into six fee categories using fixed ratios: Consultant (22%), Surgery (30%), Radiology (8%), Laboratory (10%), Pharmacy (15%), Room & Board (15%)",
                      "Checks primary procedure against four predefined surgical packages and returns package details if matched",
                      "Returns complete EstimationResult object with all computed values",
                    ]}
                    interfaces={[
                      "Input: { hospitalId, procedureCodes[], episodeType, doctorId?, age?, gender?, wardType?, los? }",
                      "Output: EstimationResult { totalP50, totalP75, breakdownP50, breakdownP75, doctorSpecific, hospitalWideNote?, surgicalPackage? }",
                      "Pure Function: No side effects, deterministic output for given inputs",
                    ]}
                  />
                </section>

                <section id="mod-results" data-section>
                  <DocHeading level={2}>5.4 Results & Insights Module</DocHeading>
                  <ModuleCard
                    file="src/components/ResultsPage.tsx"
                    purpose="Presents estimation results through interactive visualisations and structured data displays."
                    responsibilities={[
                      "Renders percentile toggle (P50/P75) with reactive data updates across all visual elements",
                      "Displays total estimate in a prominent gradient card with RM formatting (Malaysian Ringgit)",
                      "Shows hospital-wide data notice when no specific doctor was selected",
                      "Renders horizontal bar chart using Recharts with six colour-coded fee categories",
                      "Displays detailed fee breakdown table with category amounts and grand total",
                      "Conditionally renders surgical package card with fixed price and itemised inclusions",
                      "Provides 'Modify Inputs' navigation to return to the estimation form with preserved state",
                    ]}
                    interfaces={[
                      "Input: EstimationResult object, procedureCodes[], onBack callback",
                      "Output: Interactive visual dashboard (no data emission)",
                      "Dependencies: Recharts (BarChart, ResponsiveContainer), Framer Motion, Lucide icons",
                    ]}
                  />
                </section>

                <section id="mod-data" data-section>
                  <DocHeading level={2}>5.5 Data Management Module</DocHeading>
                  <ModuleCard
                    file="src/data/hospitals.ts"
                    purpose="Centralised reference data store containing all static datasets used across the application."
                    responsibilities={[
                      "Defines and exports Hospital entity (15 KPJ facilities with unique IDs)",
                      "Defines and exports Doctor entity (15 doctors with hospital association and specialty)",
                      "Defines and exports Procedure entity (30 procedures across 10 clinical categories)",
                      "Defines and exports Procedure Recommendation mappings (5 primary procedures with 8 total recommendations)",
                      "Defines and exports Episode Types (Inpatient, Outpatient, Day Surgery)",
                      "Defines and exports Ward Types (6 categories) and Payor Types (4 categories)",
                      "Defines and exports Diagnosis Codes (12 ICD-10 codes with descriptions)",
                      "Provides TypeScript interfaces for all entities ensuring compile-time type safety",
                    ]}
                    interfaces={[
                      "Exports: hospitals[], doctors[], procedures[], procedureRecommendations{}, episodeTypes[], wardTypes[], payorTypes[], diagnosisCodes[]",
                      "All arrays are typed with corresponding interfaces (Hospital, Doctor, Procedure, etc.)",
                      "Designed for future replacement with API-based data fetching without UI changes",
                    ]}
                  />
                </section>

                <section id="mod-ui" data-section>
                  <DocHeading level={2}>5.6 UI Component Library</DocHeading>
                  <p className="mt-3">
                    The system utilises a comprehensive UI component library built on <strong>shadcn/ui</strong> with Radix UI primitives. All components follow WAI-ARIA accessibility guidelines and support both light and dark themes through CSS custom properties.
                  </p>
                  <table className="w-full text-[12px] border-collapse mt-4">
                    <thead>
                      <tr className="border-b-2 border-foreground/20">
                        <th className="text-left py-2 pr-4 font-semibold w-44">Component</th>
                        <th className="text-left py-2 pr-4 font-semibold">Description</th>
                        <th className="text-left py-2 font-semibold w-28">Used In</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["SearchableSelect", "Filterable dropdown with keyboard navigation and fuzzy matching", "Form (4×)"],
                        ["MultiSelect", "Multi-value selector with tag-based UI and search capability", "Form (1×)"],
                        ["StepIndicator", "Visual progress indicator showing current step in multi-step flow", "Form (1×)"],
                        ["Button", "Themed button with variants (primary, secondary, outline, ghost)", "Throughout"],
                        ["Card", "Container component with header, content, and footer slots", "Results"],
                        ["Tabs", "Tabbed interface with accessible keyboard navigation", "Results"],
                        ["Table", "Semantic HTML table with consistent styling", "Results"],
                        ["Toast / Sonner", "Non-blocking notification system for success/error messages", "Global"],
                        ["Tooltip", "Hover-activated contextual help text", "Form"],
                      ].map(([comp, desc, used], i) => (
                        <tr key={i} className="border-b border-border">
                          <td className="py-1.5 pr-4 font-mono text-[11px]">{comp}</td>
                          <td className="py-1.5 pr-4">{desc}</td>
                          <td className="py-1.5">{used}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>

                {/* ============= 6. DATA DICTIONARY ============= */}
                <section id="data-dictionary" data-section className="pt-8">
                  <DocHeading level={1}>6. Data Dictionary</DocHeading>
                  <p className="mt-3">
                    This section documents the data structures and entities used throughout the system, including field definitions, data types, and constraints.
                  </p>
                </section>

                <section id="dd-hospitals" data-section>
                  <DocHeading level={2}>6.1 Hospital Entity</DocHeading>
                  <DataTable
                    headers={["Field", "Type", "Required", "Description"]}
                    rows={[
                      ["id", "string", "Yes", "Unique identifier (e.g., 'kpj-ampang'). Kebab-case format."],
                      ["name", "string", "Yes", "Full hospital name (e.g., 'KPJ Ampang Puteri Specialist Hospital')."],
                    ]}
                  />
                  <p className="mt-2 text-[12px] text-muted-foreground"><em>Current record count: 15 hospitals</em></p>
                </section>

                <section id="dd-doctors" data-section>
                  <DocHeading level={2}>6.2 Doctor Entity</DocHeading>
                  <DataTable
                    headers={["Field", "Type", "Required", "Description"]}
                    rows={[
                      ["id", "string", "Yes", "Unique identifier (e.g., 'd1'). Sequential format."],
                      ["name", "string", "Yes", "Full name with title (e.g., 'Dr. Ahmad Razali')."],
                      ["specialty", "string", "Yes", "Medical specialty (e.g., 'Orthopaedic Surgery'). Must match specialties enum."],
                      ["hospitalId", "string", "Yes", "Foreign key reference to Hospital.id. Used for hospital-based filtering."],
                    ]}
                  />
                  <p className="mt-2 text-[12px] text-muted-foreground"><em>Current record count: 15 doctors across 8 specialties</em></p>
                </section>

                <section id="dd-procedures" data-section>
                  <DocHeading level={2}>6.3 Procedure Entity</DocHeading>
                  <DataTable
                    headers={["Field", "Type", "Required", "Description"]}
                    rows={[
                      ["code", "string", "Yes", "Unique procedure code (format: 'PR###'). Range: PR001–PR030."],
                      ["name", "string", "Yes", "Full procedure name (e.g., 'Total Knee Replacement (TKR)')."],
                      ["category", "string", "Yes", "Clinical category (e.g., 'Orthopaedic', 'Cardiology', 'General Surgery')."],
                    ]}
                  />
                  <p className="mt-2 text-[12px] text-muted-foreground"><em>Current record count: 30 procedures across 10 categories</em></p>
                </section>

                <section id="dd-estimation" data-section>
                  <DocHeading level={2}>6.4 Estimation Result Entity</DocHeading>
                  <DataTable
                    headers={["Field", "Type", "Required", "Description"]}
                    rows={[
                      ["totalP50", "number", "Yes", "50th percentile total estimate in RM (rounded to nearest integer)."],
                      ["totalP75", "number", "Yes", "75th percentile total estimate in RM (P50 × 1.35)."],
                      ["breakdownP50", "FeeBreakdown", "Yes", "Object with six fee category amounts at P50 level."],
                      ["breakdownP75", "FeeBreakdown", "Yes", "Object with six fee category amounts at P75 level."],
                      ["doctorSpecific", "boolean", "Yes", "True if a specific doctor was selected; false for hospital-wide estimate."],
                      ["hospitalWideNote", "string?", "No", "Informational note displayed when estimate is hospital-wide (no doctor selected)."],
                      ["surgicalPackage", "object?", "No", "Contains name, price, and includes[] if primary procedure matches a package."],
                    ]}
                  />
                  <div className="mt-3">
                    <p className="font-semibold text-[12px]">FeeBreakdown Sub-Entity:</p>
                    <DataTable
                      headers={["Field", "Type", "Ratio", "Description"]}
                      rows={[
                        ["consultantFees", "number", "22%", "Specialist consultation and follow-up fees"],
                        ["surgeryFees", "number", "30%", "Surgical procedure, anaesthesia, and theatre fees"],
                        ["radiologyFees", "number", "8%", "X-ray, MRI, CT scan, and ultrasound fees"],
                        ["laboratoryFees", "number", "10%", "Blood tests, pathology, and diagnostic laboratory fees"],
                        ["pharmacyFees", "number", "15%", "Medications, consumables, and pharmaceutical supplies"],
                        ["roomAndBoard", "number", "15%", "Ward charges, nursing care, and meals"],
                      ]}
                    />
                  </div>
                </section>

                {/* ============= 7. BUSINESS RULES ============= */}
                <section id="business-rules" data-section className="pt-8">
                  <DocHeading level={1}>7. Business Rules & Logic</DocHeading>
                </section>

                <section id="br-cost" data-section>
                  <DocHeading level={2}>7.1 Cost Calculation Rules</DocHeading>
                  <p className="mt-3">The estimation engine applies the following rules in sequential order:</p>
                  <table className="w-full text-[12px] border-collapse mt-4">
                    <thead>
                      <tr className="border-b-2 border-foreground/20">
                        <th className="text-left py-2 pr-4 font-semibold w-8">#</th>
                        <th className="text-left py-2 pr-4 font-semibold">Rule</th>
                        <th className="text-left py-2 pr-4 font-semibold">Formula</th>
                        <th className="text-left py-2 font-semibold w-24">Condition</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["1", "Base Cost Aggregation", "Sum of baseCosts[code] for all selected procedures", "Always"],
                        ["2", "Ward Type Multiplier", "totalBase × wardMultiplier[wardType]", "If wardType set"],
                        ["3", "LOS Adjustment", "totalBase × (1 + (LOS − 1) × 0.12)", "If LOS > 1"],
                        ["4", "Outpatient Modifier", "totalBase × 0.40", "If Outpatient"],
                        ["5", "Day Surgery Modifier", "totalBase × 0.65", "If Day Surgery"],
                        ["6", "Age Complexity", "totalBase × 1.15", "If age > 65"],
                        ["7", "P50 Computation", "Math.round(totalBase)", "Always"],
                        ["8", "P75 Computation", "Math.round(totalBase × 1.35)", "Always"],
                      ].map(([n, rule, formula, cond], i) => (
                        <tr key={i} className="border-b border-border">
                          <td className="py-1.5 pr-4">{n}</td>
                          <td className="py-1.5 pr-4">{rule}</td>
                          <td className="py-1.5 pr-4 font-mono text-[11px]">{formula}</td>
                          <td className="py-1.5">{cond}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>

                <section id="br-ward" data-section>
                  <DocHeading level={2}>7.2 Ward Type Multipliers</DocHeading>
                  <DataTable
                    headers={["Ward Type", "Multiplier", "Relative Cost"]}
                    rows={[
                      ["ICU", "2.00×", "Highest — intensive care equipment and staffing"],
                      ["Suite", "1.60×", "Premium private suite with dedicated amenities"],
                      ["Single Room", "1.30×", "Private single-occupancy room"],
                      ["Twin Sharing", "1.10×", "Two-patient shared room"],
                      ["4-Bedded Ward", "1.00×", "Standard ward (baseline)"],
                      ["6-Bedded Ward", "0.85×", "Economy ward — lowest cost option"],
                    ]}
                  />
                </section>

                <section id="br-surgical" data-section>
                  <DocHeading level={2}>7.3 Surgical Package Rules</DocHeading>
                  <p className="mt-3">
                    The system maintains four predefined surgical packages that offer fixed-price alternatives to itemised billing. When the user's primary procedure code matches a package, the package details are displayed alongside the statistical estimate.
                  </p>
                  <div className="mt-4 space-y-4">
                    {[
                      { name: "Total Knee Replacement Package", code: "PR001", price: "RM 25,000", includes: "Surgery & anaesthesia fees, Implant cost, 5 nights ward stay, Pre-op tests, Post-op physiotherapy (3 sessions), Medications" },
                      { name: "Laparoscopic Cholecystectomy Package", code: "PR007", price: "RM 9,500", includes: "Surgery & anaesthesia fees, 2 nights single room, Pre-op blood tests, Medications, Surgeon & anaesthetist fees" },
                      { name: "Caesarean Section Package", code: "PR009", price: "RM 11,000", includes: "Surgery & anaesthesia fees, 3 nights single room, Baby care (normal), Pre-op tests, Medications" },
                      { name: "Cataract Surgery Day Care Package", code: "PR012", price: "RM 5,500", includes: "Phacoemulsification, Foldable IOL implant, Day care charges, Surgeon fees, Medications (1 week)" },
                    ].map((pkg) => (
                      <div key={pkg.code} className="border border-border rounded-md p-4">
                        <p className="font-semibold">{pkg.name} ({pkg.code})</p>
                        <p className="mt-1"><strong>Fixed Price:</strong> {pkg.price}</p>
                        <p className="mt-1"><strong>Inclusions:</strong> {pkg.includes}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* ============= 8. SECURITY ============= */}
                <section id="security" data-section className="pt-8">
                  <DocHeading level={1}>8. Security & Access Control</DocHeading>
                  <p className="mt-3">
                    The current version of the system operates as a client-side application with the following security considerations:
                  </p>
                  <ul className="list-disc list-inside mt-3 space-y-2 pl-4">
                    <li><strong>Authentication:</strong> Not yet implemented. The system is currently designed for internal use by financial counsellors and admitting officers. Future releases will integrate with KPJ's corporate Single Sign-On (SSO) system.</li>
                    <li><strong>Data Classification:</strong> All data displayed is estimation-only and does not constitute a binding quotation. No Protected Health Information (PHI) is collected or stored.</li>
                    <li><strong>Hospital-Specific Access:</strong> In the production deployment, hospital selection may be pre-fixed based on the user's login credentials, restricting access to facility-specific data only.</li>
                    <li><strong>Audit Trail:</strong> Future versions will log all estimation requests (inputs, outputs, timestamps, and user IDs) for operational analytics and compliance purposes.</li>
                    <li><strong>Transport Security:</strong> All communication will be conducted over HTTPS with TLS 1.3 encryption in the production environment.</li>
                  </ul>
                </section>

                {/* ============= 9. APPENDICES ============= */}
                <section id="appendix" data-section className="pt-8">
                  <DocHeading level={1}>9. Appendices</DocHeading>
                </section>

                <section id="appendix-procedures" data-section>
                  <DocHeading level={2}>9.1 Full Procedure Code Listing</DocHeading>
                  <table className="w-full text-[12px] border-collapse mt-4">
                    <thead>
                      <tr className="border-b-2 border-foreground/20">
                        <th className="text-left py-1.5 pr-3 font-semibold w-16">Code</th>
                        <th className="text-left py-1.5 pr-3 font-semibold">Procedure Name</th>
                        <th className="text-left py-1.5 pr-3 font-semibold w-32">Category</th>
                        <th className="text-left py-1.5 font-semibold w-24">Base Cost (RM)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["PR001","Total Knee Replacement (TKR)","Orthopaedic","28,000"],
                        ["PR002","Total Hip Replacement (THR)","Orthopaedic","32,000"],
                        ["PR003","Arthroscopic Knee Surgery","Orthopaedic","12,000"],
                        ["PR004","Coronary Artery Bypass Graft","Cardiology","65,000"],
                        ["PR005","Percutaneous Coronary Intervention","Cardiology","25,000"],
                        ["PR006","Appendectomy","General Surgery","8,000"],
                        ["PR007","Cholecystectomy (Laparoscopic)","General Surgery","10,000"],
                        ["PR008","Hernia Repair (Inguinal)","General Surgery","7,000"],
                        ["PR009","Caesarean Section (LSCS)","Obstetrics","12,000"],
                        ["PR010","Normal Vaginal Delivery","Obstetrics","5,000"],
                        ["PR011","Hysterectomy","Obstetrics","18,000"],
                        ["PR012","Cataract Surgery","Ophthalmology","6,000"],
                        ["PR013","Tonsillectomy","ENT","5,500"],
                        ["PR014","Septoplasty","ENT","7,000"],
                        ["PR015","TURP","Urology","14,000"],
                        ["PR016","Lithotripsy (ESWL)","Urology","8,000"],
                        ["PR017","Mastectomy","General Surgery","22,000"],
                        ["PR018","Thyroidectomy","General Surgery","15,000"],
                        ["PR019","Spinal Fusion Surgery","Orthopaedic","45,000"],
                        ["PR020","ACL Reconstruction","Orthopaedic","18,000"],
                        ["PR021","Setting of Branula","General","200"],
                        ["PR022","Blood Transfusion","General","800"],
                        ["PR023","ECG Monitoring","Cardiology","300"],
                        ["PR024","Physiotherapy Session","Rehabilitation","250"],
                        ["PR025","Colonoscopy","Gastroenterology","3,000"],
                        ["PR026","Endoscopy (Upper GI)","Gastroenterology","2,500"],
                        ["PR027","Skin Biopsy","Dermatology","1,500"],
                        ["PR028","Excision of Lesion","General Surgery","3,500"],
                        ["PR029","Angioplasty","Cardiology","30,000"],
                        ["PR030","Pacemaker Implantation","Cardiology","35,000"],
                      ].map(([code, name, cat, cost], i) => (
                        <tr key={i} className="border-b border-border">
                          <td className="py-1 pr-3 font-mono">{code}</td>
                          <td className="py-1 pr-3">{name}</td>
                          <td className="py-1 pr-3">{cat}</td>
                          <td className="py-1 text-right">{cost}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>

                <section id="appendix-glossary" data-section>
                  <DocHeading level={2}>9.2 Glossary of Terms</DocHeading>
                  <table className="w-full text-[12px] border-collapse mt-4">
                    <thead>
                      <tr className="border-b-2 border-foreground/20">
                        <th className="text-left py-2 pr-4 font-semibold w-40">Term</th>
                        <th className="text-left py-2 font-semibold">Definition</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["P50 (Median)", "The 50th percentile estimate — 50% of historical cases fell at or below this amount."],
                        ["P75 (High-end)", "The 75th percentile estimate — 75% of historical cases fell at or below this amount."],
                        ["Episode Type", "Classification of the hospital visit: Inpatient (overnight stay), Outpatient (no admission), or Day Surgery (same-day discharge)."],
                        ["ICD-10", "International Classification of Diseases, 10th Revision — the WHO standard for coding diagnoses."],
                        ["LOS", "Length of Stay — the number of days a patient is admitted to the hospital."],
                        ["LSCS", "Lower Segment Caesarean Section — a surgical procedure for delivering a baby."],
                        ["TKR", "Total Knee Replacement — a surgical procedure to replace a damaged knee joint."],
                        ["THR", "Total Hip Replacement — a surgical procedure to replace a damaged hip joint."],
                        ["CABG", "Coronary Artery Bypass Graft — open-heart surgery to improve blood flow to the heart."],
                        ["PCI", "Percutaneous Coronary Intervention — a minimally invasive procedure to open blocked coronary arteries."],
                        ["TURP", "Transurethral Resection of Prostate — a surgical procedure to treat an enlarged prostate."],
                        ["ESWL", "Extracorporeal Shock Wave Lithotripsy — a non-invasive procedure to break up kidney stones."],
                        ["SPA", "Single-Page Application — a web application that loads a single HTML page and dynamically updates content."],
                        ["HIS", "Hospital Information System — the core IT system managing hospital operations."],
                        ["EMR", "Electronic Medical Records — digital records of patient health information."],
                        ["MOH", "Ministry of Health — the Malaysian government agency responsible for healthcare regulation."],
                        ["PHI", "Protected Health Information — any individually identifiable health information."],
                        ["SSO", "Single Sign-On — an authentication scheme allowing users to log in once for multiple applications."],
                      ].map(([term, def], i) => (
                        <tr key={i} className="border-b border-border">
                          <td className="py-1.5 pr-4 font-semibold">{term}</td>
                          <td className="py-1.5">{def}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>

                {/* Footer */}
                <div className="pt-12 mt-12 border-t-2 border-border text-center text-[11px] text-muted-foreground space-y-1">
                  <p>— End of Document —</p>
                  <p>KPJ Hospital Bill Estimation System — System Documentation v1.0</p>
                  <p>© 2026 KPJ Healthcare Berhad. All rights reserved.</p>
                  <p>This document is classified as <strong>Internal — Confidential</strong> and must not be distributed without authorisation.</p>
                </div>

              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ============= HELPER COMPONENTS ============= */

function DocHeading({ level, children }: { level: 1 | 2; children: React.ReactNode }) {
  if (level === 1) {
    return (
      <h2
        className="text-[22px] font-bold text-foreground pb-2 border-b-2 border-primary/30"
        style={{ fontFamily: "'Cambria', Georgia, serif" }}
      >
        {children}
      </h2>
    );
  }
  return (
    <h3
      className="text-[16px] font-bold text-foreground mt-6"
      style={{ fontFamily: "'Cambria', Georgia, serif" }}
    >
      {children}
    </h3>
  );
}

function WorkflowStep({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="border-l-4 border-primary/30 pl-5">
      <p className="font-bold text-[13px]">
        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold mr-2">
          {number}
        </span>
        {title}
      </p>
      <div className="mt-2 text-[13px]">{children}</div>
    </div>
  );
}

function ModuleCard({ file, purpose, responsibilities, interfaces }: {
  file: string;
  purpose: string;
  responsibilities: string[];
  interfaces: string[];
}) {
  return (
    <div className="mt-3 border border-border rounded-md overflow-hidden">
      <div className="bg-muted/50 px-4 py-2 border-b border-border">
        <span className="font-mono text-[11px] text-muted-foreground">{file}</span>
      </div>
      <div className="px-4 py-3 space-y-3 text-[13px]">
        <div>
          <p className="font-semibold text-[11px] uppercase tracking-wide text-muted-foreground">Purpose</p>
          <p className="mt-1">{purpose}</p>
        </div>
        <div>
          <p className="font-semibold text-[11px] uppercase tracking-wide text-muted-foreground">Responsibilities</p>
          <ul className="list-disc list-inside mt-1 space-y-1 pl-2">
            {responsibilities.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
        <div>
          <p className="font-semibold text-[11px] uppercase tracking-wide text-muted-foreground">Interfaces</p>
          <ul className="list-disc list-inside mt-1 space-y-1 pl-2">
            {interfaces.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <table className="w-full text-[12px] border-collapse mt-3">
      <thead>
        <tr className="border-b-2 border-foreground/20">
          {headers.map((h, i) => (
            <th key={i} className="text-left py-2 pr-4 font-semibold">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-border">
            {row.map((cell, j) => (
              <td key={j} className={`py-1.5 pr-4 ${j === 0 ? "font-mono" : ""}`}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
