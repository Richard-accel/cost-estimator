import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Calculator, Info } from "lucide-react";
import { SearchableSelect } from "@/components/SearchableSelect";
import { MultiSelect } from "@/components/MultiSelect";
import { ProcedureRecommendations } from "@/components/ProcedureRecommendations";
import { StepIndicator } from "@/components/StepIndicator";
import { supabase } from "@/integrations/supabase/client";

export interface EstimatorFormData {
  hospitalId: string;
  doctorId: string;
  doctorSpecialty: string;
  procedureCodes: string[];
  episodeType: string;
  age: string;
  gender: string;
  diagnosisCode: string;
  wardType: string;
  los: string;
  payorType: string;
  payorName: string;
}

interface Props {
  onSubmit: (data: EstimatorFormData) => void;
}

const steps = [
  { label: "Core Details", description: "Required fields" },
  { label: "Refine Estimate", description: "Optional details" },
];

type SelectOption = { value: string; label: string; sublabel?: string };

export function EstimatorForm({ onSubmit }: Props) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<EstimatorFormData>({
    hospitalId: "", doctorId: "", doctorSpecialty: "", procedureCodes: [],
    episodeType: "", age: "", gender: "", diagnosisCode: "",
    wardType: "", los: "", payorType: "", payorName: "",
  });

  // DB-backed reference data
  const [hospitals, setHospitals] = useState<SelectOption[]>([]);
  const [allDoctors, setAllDoctors] = useState<{ id: string; name: string; specialty: string | null; hospital_id: string | null }[]>([]);
  const [allProcedures, setAllProcedures] = useState<SelectOption[]>([]);
  const [specialtyMappings, setSpecialtyMappings] = useState<{ specialty: string; procedure_category: string }[]>([]);
  const [episodeTypes, setEpisodeTypes] = useState<{ code: string; name: string }[]>([]);
  const [wardTypes, setWardTypes] = useState<SelectOption[]>([]);
  const [payorTypes, setPayorTypes] = useState<{ code: string; name: string }[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from("hospitals").select("id, name").eq("is_active", true).order("name"),
      supabase.from("doctors").select("id, name, specialty, hospital_id").eq("is_active", true).order("name"),
      supabase.from("procedures").select("code, name, category").eq("is_active", true).order("code"),
      supabase.from("episode_types").select("code, name").eq("is_active", true).order("name"),
      supabase.from("ward_types").select("code, name").eq("is_active", true).order("name"),
      supabase.from("payor_types").select("code, name").eq("is_active", true).order("name"),
      supabase.from("specialty_procedure_categories").select("specialty, procedure_category"),
    ]).then(([h, d, p, e, w, py, spc]) => {
      setHospitals((h.data ?? []).map(x => ({ value: x.id, label: x.name })));
      setAllDoctors(d.data ?? []);
      setAllProcedures((p.data ?? []).map(x => ({ value: x.code, label: `${x.code} — ${x.name}`, sublabel: x.category ?? undefined })));
      setEpisodeTypes(e.data ?? []);
      setWardTypes((w.data ?? []).map(x => ({ value: x.code, label: x.name })));
      setPayorTypes(py.data ?? []);
      setSpecialtyMappings(spc.data ?? []);
    });
  }, []);

  const update = <K extends keyof EstimatorFormData>(key: K, val: EstimatorFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const doctorOptions = useMemo(
    () => allDoctors
      .filter((d) => !form.hospitalId || d.hospital_id === form.hospitalId)
      .map((d) => ({ value: d.id, label: d.name, sublabel: d.specialty ?? undefined })),
    [form.hospitalId, allDoctors]
  );

  const handleDoctorChange = (id: string) => {
    update("doctorId", id);
    const doc = allDoctors.find((d) => d.id === id);
    update("doctorSpecialty", doc?.specialty ?? "");
    // Clear procedures that don't match the new doctor's specialty
    if (doc?.specialty) {
      const allowedCategories = specialtyMappings
        .filter(m => m.specialty === doc.specialty)
        .map(m => m.procedure_category);
      if (allowedCategories.length > 0) {
        const filtered = form.procedureCodes.filter(code => {
          const proc = allProcedures.find(p => p.value === code);
          return !proc?.sublabel || allowedCategories.includes(proc.sublabel);
        });
        if (filtered.length !== form.procedureCodes.length) {
          update("procedureCodes", filtered);
        }
      }
    }
  };

  // Filter procedures based on selected doctor's specialty
  const procedures = useMemo(() => {
    if (!form.doctorSpecialty) return allProcedures;
    const allowedCategories = specialtyMappings
      .filter(m => m.specialty === form.doctorSpecialty)
      .map(m => m.procedure_category);
    if (allowedCategories.length === 0) return allProcedures;
    return allProcedures.filter(p => !p.sublabel || allowedCategories.includes(p.sublabel));
  }, [form.doctorSpecialty, allProcedures, specialtyMappings]);

  const isStep1Valid = form.hospitalId && form.procedureCodes.length > 0 && form.episodeType;

  const handleSubmit = () => {
    if (isStep1Valid) onSubmit(form);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <StepIndicator currentStep={step} steps={steps} />

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            <div className="rounded-2xl bg-card border border-border p-6 shadow-sm space-y-5">
              <h2 className="text-lg font-semibold font-display text-foreground">Core Details</h2>

              <SearchableSelect
                label="Hospital" placeholder="Select KPJ hospital..." required
                options={hospitals} value={form.hospitalId}
                onChange={(v) => { update("hospitalId", v); update("doctorId", ""); update("doctorSpecialty", ""); }}
              />

              <SearchableSelect
                label="Doctor's Name" placeholder="Select admitting doctor (optional)..."
                options={doctorOptions} value={form.doctorId}
                onChange={handleDoctorChange}
                disabled={!form.hospitalId}
              />

              {form.doctorSpecialty && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Doctor's Specialty</label>
                  <div className="rounded-lg border border-input bg-muted px-3 py-2.5 text-sm text-muted-foreground">
                    {form.doctorSpecialty}
                  </div>
                </div>
              )}

              <div>
                <MultiSelect
                  label="Procedure(s)" placeholder="Add procedures..." required
                  options={procedures} values={form.procedureCodes}
                  onChange={(v) => update("procedureCodes", v)}
                />
                {form.doctorSpecialty && procedures.length < allProcedures.length && (
                  <p className="mt-1.5 text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Showing {procedures.length} procedures relevant to {form.doctorSpecialty}. Clear doctor to see all.
                  </p>
                )}
              </div>

              {form.procedureCodes.length > 0 && (
                <ProcedureRecommendations
                  primaryProcedureCode={form.procedureCodes[0]}
                  currentProcedures={form.procedureCodes}
                  onAccept={(codes) => update("procedureCodes", [...form.procedureCodes, ...codes])}
                />
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Episode Type <span className="text-destructive">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {episodeTypes.map((ep) => (
                    <button
                      key={ep.code} type="button"
                      onClick={() => update("episodeType", ep.code)}
                      className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                        form.episodeType === ep.code
                          ? "border-primary bg-highlight text-highlight-foreground"
                          : "border-input bg-card text-foreground hover:border-primary/40"
                      }`}
                    >
                      {ep.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={!isStep1Valid}
                onClick={handleSubmit}
                className="inline-flex items-center gap-2 rounded-xl gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100"
              >
                <Calculator className="h-4 w-4" /> Quick Estimate
              </button>
              <button
                type="button"
                disabled={!isStep1Valid}
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 rounded-xl border border-primary bg-card px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-highlight disabled:opacity-40"
              >
                Refine Estimate <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            <div className="rounded-2xl bg-card border border-border p-6 shadow-sm space-y-5">
              <h2 className="text-lg font-semibold font-display text-foreground">Refine Your Estimate</h2>
              <p className="text-sm text-muted-foreground -mt-2">Optional fields for higher accuracy</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Patient Age</label>
                  <input
                    type="number" min={0} max={110} placeholder="0–110"
                    value={form.age} onChange={(e) => update("age", e.target.value)}
                    className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Gender</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Male", "Female"].map((g) => (
                      <button
                        key={g} type="button"
                        onClick={() => update("gender", g)}
                        className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                          form.gender === g
                            ? "border-primary bg-highlight text-highlight-foreground"
                            : "border-input bg-card text-foreground hover:border-primary/40"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <SearchableSelect
                  label="Ward Type" placeholder="Select ward..."
                  options={wardTypes}
                  value={form.wardType}
                  onChange={(v) => update("wardType", v)}
                />
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Length of Stay (Days)</label>
                  <input
                    type="number" min={0} max={99} placeholder="0–99"
                    value={form.los} onChange={(e) => update("los", e.target.value)}
                    className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Payor Type</label>
                  <select
                    value={form.payorType} onChange={(e) => update("payorType", e.target.value)}
                    className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                  >
                    <option value="">Select payor type</option>
                    {payorTypes.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Payor Name</label>
                  <input
                    type="text" placeholder="Enter payor name"
                    value={form.payorName} onChange={(e) => update("payorName", e.target.value)}
                    className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="inline-flex items-center gap-2 rounded-xl gradient-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Calculator className="h-4 w-4" /> Get Estimate
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
