import { useState, useRef, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen, Building2, Stethoscope, Users, Calculator, Upload, Database,
  Layers, ClipboardList, Shield, MessageCircle, Search, ChevronRight,
  LogIn, LayoutDashboard, ArrowRight, CheckCircle2, AlertCircle, Info,
  FileText, Settings, HelpCircle, Workflow, BarChart3, ArrowDown,
  UserCheck, Eye, PencilLine, Power, Download, RefreshCw, ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Exported raw text for AI assistant reference ─────────────────────────
export const USER_MANUAL_TEXT = `
# KPJ Bill Estimator — User Manual

## 1. System Overview
The KPJ Bill Estimator is a data-driven cost estimation system for KPJ Healthcare Group. It provides P50 (Median) and P75 (High-end) bill estimates based on historical billing data across all KPJ hospitals, segmented by hospital, doctor, procedure, diagnosis, comorbidity, age group, and gender.

### Key Features
- Bill estimation with P50 and P75 breakdowns by fee category
- Doctor-specific vs hospital-wide estimates with automatic fallback
- AI-powered competitor price comparison
- Surgical package pricing where available
- Historical data ingestion and automated P50/P75 recalculation
- Role-based access control for Group, Hospital, Doctor, and Admin users

### User Roles
- Group Users: Full system administrators
- Hospital Users: View facility data and generate bill estimates
- Doctor Users: View profile and generate bill estimates
- Admin Users: System-wide administration capabilities

## 2. Getting Started
### Logging In
1. Navigate to the login page
2. Enter your email and password
3. Click Sign In

### Dashboard
After login, you'll see the Dashboard with quick links based on your role.

## 3. Bill Estimator
The core feature accessible to all authenticated users.

### Step 1 — Core Details
1. Select Hospital
2. Select Doctor (optional)
3. Select Procedure(s)
4. Choose Episode Type

### Step 2 — Refine Estimate
Patient Age, Gender, Ward Type, Length of Stay, Payor Type

### Understanding Results
Total Estimated Cost, Data Source Info, Fee Breakdown, Surgical Package, Competitor Comparison

## 4. Data Management (Group Users Only)
### Manage Hospitals
### Manage Doctors
### Manage Procedures
### Reference Data
### Data Ingestion
### Recalculate Averages
### User Management

## 5. AI Assistant
Conversational chatbot that answers questions about the system.

## 6. FAQ
Common questions about P50/P75, data uploads, surgical packages, and access management.
`;

// ─── Section definitions ──────────────────────────────────────────────────

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
}

const sections: Section[] = [
  { id: "overview", title: "System Overview", icon: <Shield className="h-4 w-4" /> },
  { id: "getting-started", title: "Getting Started", icon: <LogIn className="h-4 w-4" /> },
  { id: "estimator", title: "Bill Estimator", icon: <Calculator className="h-4 w-4" />, badge: "Core" },
  { id: "data-management", title: "Data Management", icon: <Database className="h-4 w-4" />, badge: "Group Only", badgeVariant: "secondary" },
  { id: "ai-assistant", title: "AI Assistant", icon: <MessageCircle className="h-4 w-4" /> },
  { id: "faq", title: "FAQ", icon: <HelpCircle className="h-4 w-4" /> },
];

// ─── Flow Diagram Components ──────────────────────────────────────────────

function FlowStep({ icon, label, description, isLast = false }: { icon: React.ReactNode; label: string; description?: string; isLast?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
          {icon}
        </div>
        {!isLast && <div className="w-px h-8 bg-border mt-1" />}
      </div>
      <div className="pt-1.5">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

function HorizontalFlow({ steps }: { steps: { icon: React.ReactNode; label: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2 py-3">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-primary/5 border border-primary/15 rounded-lg px-3 py-2">
            <span className="text-primary">{step.icon}</span>
            <span className="text-xs font-medium text-foreground">{step.label}</span>
          </div>
          {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
        </div>
      ))}
    </div>
  );
}

function InfoCallout({ children, variant = "info" }: { children: React.ReactNode; variant?: "info" | "warning" | "success" }) {
  const styles = {
    info: "bg-accent/10 border-accent/30 text-accent",
    warning: "bg-warning/10 border-warning/30 text-warning",
    success: "bg-success/10 border-success/30 text-success",
  };
  const icons = {
    info: <Info className="h-4 w-4 shrink-0 mt-0.5" />,
    warning: <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />,
  };
  return (
    <div className={cn("flex gap-2.5 rounded-lg border px-4 py-3 text-sm", styles[variant])}>
      {icons[variant]}
      <div className="text-foreground">{children}</div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex gap-3 p-3 rounded-lg border border-border bg-card hover:shadow-sm transition-shadow">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">{icon}</div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function RoleBadge({ role, desc }: { role: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Badge variant="outline" className="shrink-0 mt-0.5 border-primary/30 text-primary bg-primary/5">{role}</Badge>
      <span className="text-sm text-muted-foreground">{desc}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────

export default function UserManual() {
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState("overview");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const contentRef = useRef<HTMLDivElement>(null);

  // Search-based filtering
  const filteredSections = useMemo(() => {
    if (!search.trim()) return sections;
    const q = search.toLowerCase();
    // Simple keyword match per section
    const keywords: Record<string, string> = {
      overview: "system overview features roles group hospital doctor admin key p50 p75 estimation competitor",
      "getting-started": "login sign up dashboard getting started email password verify",
      estimator: "bill estimator estimate procedure doctor hospital episode ward age gender payor results breakdown chart surgical package competitor comparison quick refine",
      "data-management": "data management hospitals doctors procedures reference ward episode payor ingestion upload csv template recalculate averages user roles",
      "ai-assistant": "ai assistant chatbot questions help",
      faq: "faq frequently asked questions p50 p75 surgical package upload data access",
    };
    return sections.filter((s) => {
      const text = `${s.title} ${keywords[s.id] || ""}`.toLowerCase();
      return text.includes(q);
    });
  }, [search]);

  // Scroll spy
  useEffect(() => {
    const handleScroll = () => {
      const container = contentRef.current;
      if (!container) return;
      const scrollTop = container.scrollTop;
      let current = "overview";
      for (const section of sections) {
        const el = sectionRefs.current[section.id];
        if (el && el.offsetTop - 120 <= scrollTop) {
          current = section.id;
        }
      }
      setActiveSection(current);
    };
    const container = contentRef.current;
    container?.addEventListener("scroll", handleScroll);
    return () => container?.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = sectionRefs.current[id];
    if (el && contentRef.current) {
      contentRef.current.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" });
    }
  };

  const setRef = (id: string) => (el: HTMLDivElement | null) => { sectionRefs.current[id] = el; };

  const highlight = (text: string) => {
    if (!search.trim()) return text;
    const idx = text.toLowerCase().indexOf(search.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-warning/30 rounded px-0.5">{text.slice(idx, idx + search.length)}</mark>
        {text.slice(idx + search.length)}
      </>
    );
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* ── Sidebar TOC ── */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card/50 shrink-0">
        <div className="p-4 pb-3">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-bold font-display text-foreground">User Manual</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search manual…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs bg-background"
            />
          </div>
        </div>
        <Separator />
        <ScrollArea className="flex-1 py-2">
          <nav className="px-2 space-y-0.5">
            {filteredSections.map((s, i) => (
              <button
                key={s.id}
                onClick={() => { scrollTo(s.id); setActiveSection(s.id); }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-colors",
                  activeSection === s.id
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <span className={cn(activeSection === s.id ? "text-primary" : "text-muted-foreground")}>{s.icon}</span>
                <span className="flex-1 truncate">{highlight(s.title) as any}</span>
                {s.badge && (
                  <Badge variant={s.badgeVariant || "default"} className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                    {s.badge}
                  </Badge>
                )}
              </button>
            ))}
          </nav>
        </ScrollArea>
        <Separator />
        <div className="p-3">
          <p className="text-[10px] text-muted-foreground text-center">KPJ Bill Estimator v1.0</p>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div ref={contentRef} className="flex-1 overflow-y-auto">
        {/* Mobile search header */}
        <div className="lg:hidden sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold font-display text-foreground">User Manual</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search manual…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>
          {/* Mobile section chips */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
            {filteredSections.map((s) => (
              <button
                key={s.id}
                onClick={() => { scrollTo(s.id); setActiveSection(s.id); }}
                className={cn(
                  "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                  activeSection === s.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/30"
                )}
              >
                {s.icon}
                {s.title}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6 lg:p-8 space-y-10">
          {/* Desktop title */}
          <div className="hidden lg:block">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-display text-foreground">KPJ Bill Estimator</h1>
                <p className="text-sm text-muted-foreground">User Manual & Reference Guide</p>
              </div>
            </div>
          </div>

          {/* ════════ 1. System Overview ════════ */}
          <section ref={setRef("overview")} className="scroll-mt-24 space-y-5">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold font-display text-foreground">1. System Overview</h2>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              The KPJ Bill Estimator is a data-driven cost estimation system for KPJ Healthcare Group. It provides <strong className="text-foreground">P50 (Median)</strong> and <strong className="text-foreground">P75 (High-end)</strong> bill estimates based on historical billing data across all KPJ hospitals, segmented by hospital, doctor, procedure, diagnosis, comorbidity, age group, and gender.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FeatureCard icon={<BarChart3 className="h-4 w-4" />} title="P50 & P75 Estimates" desc="Median and high-end cost breakdowns by fee category" />
              <FeatureCard icon={<Stethoscope className="h-4 w-4" />} title="Doctor-Specific Pricing" desc="Automatic fallback to hospital-wide when unavailable" />
              <FeatureCard icon={<Workflow className="h-4 w-4" />} title="Competitor Comparison" desc="AI-powered pricing from nearby competitor hospitals" />
              <FeatureCard icon={<Upload className="h-4 w-4" />} title="Data Ingestion" desc="Bulk CSV upload with automated recalculation" />
              <FeatureCard icon={<Shield className="h-4 w-4" />} title="Role-Based Access" desc="Group, Hospital, Doctor, and Admin roles" />
              <FeatureCard icon={<FileText className="h-4 w-4" />} title="Surgical Packages" desc="Fixed-price bundles shown alongside estimates" />
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold font-display text-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> User Roles
              </h3>
              <Card className="bg-card">
                <CardContent className="p-4 space-y-1">
                  <RoleBadge role="Group" desc="Full system administrators. Manage hospitals, doctors, procedures, data ingestion, averages, and user roles." />
                  <RoleBadge role="Hospital" desc="View facility data and generate bill estimates for their hospital." />
                  <RoleBadge role="Doctor" desc="View profile and generate bill estimates for associated procedures." />
                  <RoleBadge role="Admin" desc="System-wide administration capabilities." />
                </CardContent>
              </Card>
            </div>
          </section>

          <Separator />

          {/* ════════ 2. Getting Started ════════ */}
          <section ref={setRef("getting-started")} className="scroll-mt-24 space-y-5">
            <div className="flex items-center gap-2">
              <LogIn className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold font-display text-foreground">2. Getting Started</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-sm font-bold font-display text-foreground">Logging In</h3>
                <FlowStep icon={<LogIn className="h-4 w-4" />} label="Navigate to Login" description="Go to the login page" />
                <FlowStep icon={<PencilLine className="h-4 w-4" />} label="Enter Credentials" description="Email address and password" />
                <FlowStep icon={<CheckCircle2 className="h-4 w-4" />} label="Sign In" description="Click Sign In to access dashboard" isLast />
                <InfoCallout variant="info">
                  New users: Click <strong>Sign Up</strong>, fill in your details, and verify your email before first login.
                </InfoCallout>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold font-display text-foreground">Dashboard Overview</h3>
                <p className="text-sm text-muted-foreground">After login, you'll see the Dashboard with quick links based on your role:</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calculator className="h-4 w-4 text-primary" />
                    <span className="text-foreground font-medium">Bill Estimator</span>
                    <Badge variant="outline" className="text-[10px]">All Users</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Database className="h-4 w-4 text-primary" />
                    <span className="text-foreground font-medium">Data Management</span>
                    <Badge variant="secondary" className="text-[10px]">Group Only</Badge>
                  </div>
                </div>
                <InfoCallout variant="warning">
                  If no role is assigned, you'll see a notification to contact your Group administrator.
                </InfoCallout>
              </div>
            </div>
          </section>

          <Separator />

          {/* ════════ 3. Bill Estimator ════════ */}
          <section ref={setRef("estimator")} className="scroll-mt-24 space-y-5">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold font-display text-foreground">3. Bill Estimator</h2>
              <Badge className="text-[10px]">Core Feature</Badge>
            </div>
            <p className="text-sm text-muted-foreground">The Bill Estimator is accessible to all authenticated users. Follow the two-step process below:</p>

            {/* Estimator Flow Diagram */}
            <Card className="bg-primary/[0.03] border-primary/15">
              <CardContent className="p-5">
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Estimation Flow</p>
                <HorizontalFlow steps={[
                  { icon: <Building2 className="h-3.5 w-3.5" />, label: "Select Hospital" },
                  { icon: <Stethoscope className="h-3.5 w-3.5" />, label: "Select Doctor" },
                  { icon: <ClipboardList className="h-3.5 w-3.5" />, label: "Choose Procedures" },
                  { icon: <Layers className="h-3.5 w-3.5" />, label: "Episode Type" },
                  { icon: <BarChart3 className="h-3.5 w-3.5" />, label: "View Results" },
                ]} />
              </CardContent>
            </Card>

            {/* Step 1 */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold font-display text-foreground flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">1</span>
                Core Details (Required)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-8">
                <div className="p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-bold text-foreground">Select Hospital</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Choose a KPJ hospital. This filters the doctor list.</p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-2 mb-1">
                    <Stethoscope className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-bold text-foreground">Select Doctor</span>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">Optional</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Doctor-specific pricing tried first, with hospital-wide fallback.</p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-2 mb-1">
                    <ClipboardList className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-bold text-foreground">Select Procedure(s)</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Search and add Schedule 13 codes. Related procedures may be suggested.</p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-2 mb-1">
                    <Layers className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-bold text-foreground">Episode Type</span>
                  </div>
                  <p className="text-xs text-muted-foreground">IP (Inpatient), OP (Outpatient), DS (Day Surgery), ER (Emergency).</p>
                </div>
              </div>
              <div className="pl-8">
                <InfoCallout variant="success">
                  Use <strong>Quick Estimate</strong> for immediate results, or <strong>Refine Estimate</strong> to add optional details in Step 2.
                </InfoCallout>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold font-display text-foreground flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center font-bold">2</span>
                Refine Estimate (Optional)
              </h3>
              <div className="pl-8 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { label: "Patient Age", desc: "0–110, auto-binned" },
                  { label: "Gender", desc: "Male / Female" },
                  { label: "Ward Type", desc: "SR, TS, 4B, 6B, Suite, ICU" },
                  { label: "Length of Stay", desc: "Days" },
                  { label: "Payor Type", desc: "Self-Pay, Insurance, etc." },
                  { label: "Payor Name", desc: "Specific insurer" },
                ].map((f) => (
                  <div key={f.label} className="p-2.5 rounded-lg border border-border bg-card">
                    <p className="text-xs font-semibold text-foreground">{f.label}</p>
                    <p className="text-[10px] text-muted-foreground">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Results */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold font-display text-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Understanding Results
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FeatureCard icon={<BarChart3 className="h-4 w-4" />} title="Total Estimated Cost" desc="P50 (Median) and P75 (High-end) toggle view" />
                <FeatureCard icon={<Eye className="h-4 w-4" />} title="Data Source Info" desc="Historical case count, data years, doctor vs hospital-wide" />
                <FeatureCard icon={<Layers className="h-4 w-4" />} title="Fee Breakdown" desc="Chart & table: Consultant, Surgery, Radiology, Lab, Pharmacy, Room" />
                <FeatureCard icon={<Workflow className="h-4 w-4" />} title="Competitor Comparison" desc="AI-powered pricing from nearby competitor hospitals" />
              </div>

              <InfoCallout variant="info">
                <strong>P50</strong> = 50% of historical cases cost less. <strong>P75</strong> = 75% cost less. Use P50 for typical estimates, P75 for conservative.
              </InfoCallout>
            </div>
          </section>

          <Separator />

          {/* ════════ 4. Data Management ════════ */}
          <section ref={setRef("data-management")} className="scroll-mt-24 space-y-5">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold font-display text-foreground">4. Data Management</h2>
              <Badge variant="secondary" className="text-[10px]">Group Users Only</Badge>
            </div>

            {/* Data flow */}
            <Card className="bg-primary/[0.03] border-primary/15">
              <CardContent className="p-5">
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Data Pipeline</p>
                <HorizontalFlow steps={[
                  { icon: <Upload className="h-3.5 w-3.5" />, label: "Upload CSV" },
                  { icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: "Validate & Ingest" },
                  { icon: <RefreshCw className="h-3.5 w-3.5" />, label: "Recalculate Averages" },
                  { icon: <BarChart3 className="h-3.5 w-3.5" />, label: "Estimates Ready" },
                ]} />
              </CardContent>
            </Card>

            {/* Modules grid */}
            <div className="space-y-4">
              {/* Hospitals */}
              <Card className="bg-card">
                <CardContent className="p-5 space-y-2">
                  <h3 className="text-sm font-bold font-display text-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" /> 4.1 Manage Hospitals
                  </h3>
                  <p className="text-sm text-muted-foreground">View, search, add, edit, and toggle active status for KPJ hospitals.</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-[10px] gap-1"><Eye className="h-3 w-3" /> View</Badge>
                    <Badge variant="outline" className="text-[10px] gap-1"><Search className="h-3 w-3" /> Search</Badge>
                    <Badge variant="outline" className="text-[10px] gap-1"><PencilLine className="h-3 w-3" /> Edit</Badge>
                    <Badge variant="outline" className="text-[10px] gap-1"><Power className="h-3 w-3" /> Toggle</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Required: Code (e.g., KPJ-AMP) and Name. Optional: Address, State.</p>
                </CardContent>
              </Card>

              {/* Doctors */}
              <Card className="bg-card">
                <CardContent className="p-5 space-y-2">
                  <h3 className="text-sm font-bold font-display text-foreground flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-primary" /> 4.2 Manage Doctors
                  </h3>
                  <p className="text-sm text-muted-foreground">View, search, add, edit, and toggle status for doctors. Assign to hospitals and specialties.</p>
                  <p className="text-xs text-muted-foreground">Required: Code and Name. Optional: Specialty, Hospital assignment.</p>
                </CardContent>
              </Card>

              {/* Procedures */}
              <Card className="bg-card">
                <CardContent className="p-5 space-y-2">
                  <h3 className="text-sm font-bold font-display text-foreground flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-primary" /> 4.3 Manage Procedures
                  </h3>
                  <p className="text-sm text-muted-foreground">Manage Schedule 13 procedures with code, name, category, and status.</p>
                  <p className="text-xs text-muted-foreground">Required: Code (e.g., S13-005) and Name. Optional: Category.</p>
                </CardContent>
              </Card>

              {/* Reference Data */}
              <Card className="bg-card">
                <CardContent className="p-5 space-y-2">
                  <h3 className="text-sm font-bold font-display text-foreground flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" /> 4.4 Reference Data
                  </h3>
                  <p className="text-sm text-muted-foreground">Manage lookup tables used throughout the system:</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded-lg bg-muted text-center">
                      <p className="text-xs font-semibold text-foreground">Ward Types</p>
                      <p className="text-[10px] text-muted-foreground">SR, TS, 4B, 6B, Suite, ICU</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted text-center">
                      <p className="text-xs font-semibold text-foreground">Episode Types</p>
                      <p className="text-[10px] text-muted-foreground">IP, OP, DS, ER</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted text-center">
                      <p className="text-xs font-semibold text-foreground">Payor Types</p>
                      <p className="text-[10px] text-muted-foreground">Self-Pay, Insurance, etc.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data Ingestion */}
              <Card className="bg-card">
                <CardContent className="p-5 space-y-3">
                  <h3 className="text-sm font-bold font-display text-foreground flex items-center gap-2">
                    <Upload className="h-4 w-4 text-primary" /> 4.5 Data Ingestion
                  </h3>
                  <FlowStep icon={<Download className="h-4 w-4" />} label="Download CSV Template" description="Get the correct file format" />
                  <FlowStep icon={<PencilLine className="h-4 w-4" />} label="Prepare CSV" description="Required: hospital_code, procedure_code, total_bill" />
                  <FlowStep icon={<Upload className="h-4 w-4" />} label="Upload & Process" description="Select data year, upload file" />
                  <FlowStep icon={<CheckCircle2 className="h-4 w-4" />} label="Validation Complete" description="Success/error counts displayed" isLast />

                  <InfoCallout variant="warning">
                    Unrecognized hospital/doctor codes will be skipped with warnings. Ensure codes match registered entries.
                  </InfoCallout>
                </CardContent>
              </Card>

              {/* Recalculate & Averages */}
              <Card className="bg-card">
                <CardContent className="p-5 space-y-2">
                  <h3 className="text-sm font-bold font-display text-foreground flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-primary" /> 4.6 Recalculate Averages
                  </h3>
                  <p className="text-sm text-muted-foreground">After uploading data, click <strong className="text-foreground">Recalculate P50/P75 Averages</strong>. The system processes the most recent 2 years across these dimensions:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["Hospital + Procedure", "Doctor-Specific", "Episode Type", "Ward Type", "Diagnosis (ICD-10)", "Age Group", "Gender"].map((d) => (
                      <Badge key={d} variant="outline" className="text-[10px]">{d}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* User Management */}
              <Card className="bg-card">
                <CardContent className="p-5 space-y-2">
                  <h3 className="text-sm font-bold font-display text-foreground flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-primary" /> 4.7 User Management
                  </h3>
                  <p className="text-sm text-muted-foreground">View all users, search by name/email, and manage roles via the shield icon.</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["Admin", "Group", "Hospital", "Doctor"].map((r) => (
                      <Badge key={r} variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/5">{r}</Badge>
                    ))}
                  </div>
                  <InfoCallout variant="info">Users can have multiple roles. Changes take effect immediately.</InfoCallout>
                </CardContent>
              </Card>
            </div>
          </section>

          <Separator />

          {/* ════════ 5. AI Assistant ════════ */}
          <section ref={setRef("ai-assistant")} className="scroll-mt-24 space-y-5">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold font-display text-foreground">5. AI Assistant</h2>
            </div>
            <p className="text-sm text-muted-foreground">A conversational chatbot that answers questions about using the KPJ Bill Estimator. It references this user manual for accurate, contextual answers.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                "How do I upload historical billing data?",
                "What does P50 vs P75 mean?",
                "How do I add a new doctor?",
                "What file format is needed for data ingestion?",
                "How are averages calculated?",
                "What roles can be assigned to users?",
              ].map((q) => (
                <div key={q} className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card text-sm">
                  <MessageCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-muted-foreground text-xs italic">"{q}"</span>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* ════════ 6. FAQ ════════ */}
          <section ref={setRef("faq")} className="scroll-mt-24 space-y-5">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold font-display text-foreground">6. Frequently Asked Questions</h2>
            </div>
            <div className="space-y-4">
              {[
                { q: "What is the difference between P50 and P75?", a: "P50 (Median) means 50% of historical cases cost less than this amount. P75 means 75%. Use P50 for a typical estimate and P75 for a conservative (higher) estimate." },
                { q: "Why does my estimate show \"hospital-wide data\"?", a: "There isn't enough doctor-specific historical data for your selected doctor. The system falls back to all doctors at that hospital for the given procedure, which still provides a reliable estimate." },
                { q: "Can I estimate costs for multiple procedures at once?", a: "Yes. In Step 1, add multiple procedures using the multi-select. The estimate sums the costs for all selected procedures." },
                { q: "What is a Surgical Package?", a: "A fixed-price bundle including surgery fees, room stay, tests, and medications at a set price. Shown alongside P50/P75 estimates for comparison when available." },
                { q: "How often should historical data be uploaded?", a: "Annually recommended. The system uses the most recent 2 years of data for calculations." },
                { q: "What if my CSV has unrecognized codes?", a: "Rows with unrecognized hospital or doctor codes are skipped with warnings. Ensure your codes match those registered in the Hospitals/Doctors modules." },
                { q: "How do I access Data Management?", a: "Data Management is restricted to Group users. Contact your system administrator to be assigned the Group role." },
              ].map((faq, i) => (
                <Card key={i} className="bg-card">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">Q</span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{faq.q}</p>
                        <p className="text-sm text-muted-foreground mt-1">{faq.a}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Footer */}
          <div className="text-center py-8 text-xs text-muted-foreground">
            KPJ Bill Estimator — User Manual v1.0
          </div>
        </div>
      </div>
    </div>
  );
}
