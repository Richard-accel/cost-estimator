import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Calculator } from "lucide-react";
import { SearchableSelect } from "@/components/SearchableSelect";
import { MultiSelect } from "@/components/MultiSelect";
import { ProcedureRecommendations } from "@/components/ProcedureRecommendations";
import { StepIndicator } from "@/components/StepIndicator";
import {
  hospitals, doctors, procedures, episodeTypes, wardTypes,
  payorTypes, diagnosisCodes,
} from "@/data/hospitals";

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

export function EstimatorForm({ onSubmit }: Props) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<EstimatorFormData>({
    hospitalId: "", doctorId: "", doctorSpecialty: "", procedureCodes: [],
    episodeType: "", age: "", gender: "", diagnosisCode: "",
    wardType: "", los: "", payorType: "", payorName: "",
  });

  const update = <K extends keyof EstimatorFormData>(key: K, val: EstimatorFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const hospitalOptions = hospitals.map((h) => ({ value: h.id, label: h.name }));

  const doctorOptions = useMemo(
    () => doctors
      .filter((d) => !form.hospitalId || d.hospitalId === form.hospitalId)
      .map((d) => ({ value: d.id, label: d.name, sublabel: d.specialty })),
    [form.hospitalId]
  );

  const procedureOptions = procedures.map((p) => ({
    value: p.code, label: `${p.code} — ${p.name}`, sublabel: p.category,
  }));

  const diagnosisOptions = diagnosisCodes.map((d) => ({
    value: d.code, label: `${d.code} — ${d.description}`,
  }));

  // Auto-fill specialty when doctor selected
  const handleDoctorChange = (id: string) => {
    update("doctorId", id);
    const doc = doctors.find((d) => d.id === id);
    if (doc) update("doctorSpecialty", doc.specialty);
    else update("doctorSpecialty", "");
  };

  const isStep1Valid = form.hospitalId && form.doctorId && form.procedureCodes.length > 0 && form.episodeType;

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
                options={hospitalOptions} value={form.hospitalId}
                onChange={(v) => { update("hospitalId", v); update("doctorId", ""); update("doctorSpecialty", ""); }}
              />

              <SearchableSelect
                label="Doctor's Name" placeholder="Select admitting doctor..." required
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

              <MultiSelect
                label="Procedure(s)" placeholder="Add procedures..." required
                options={procedureOptions} values={form.procedureCodes}
                onChange={(v) => update("procedureCodes", v)}
              />

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
                <div className="grid grid-cols-3 gap-2">
                  {episodeTypes.map((ep) => (
                    <button
                      key={ep} type="button"
                      onClick={() => update("episodeType", ep)}
                      className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                        form.episodeType === ep
                          ? "border-primary bg-highlight text-highlight-foreground"
                          : "border-input bg-card text-foreground hover:border-primary/40"
                      }`}
                    >
                      {ep}
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

              <SearchableSelect
                label="Diagnosis (ICD-10)" placeholder="Search diagnosis code..."
                options={diagnosisOptions} value={form.diagnosisCode}
                onChange={(v) => update("diagnosisCode", v)}
              />

              <div className="grid grid-cols-2 gap-4">
                <SearchableSelect
                  label="Ward Type" placeholder="Select ward..."
                  options={wardTypes.map((w) => ({ value: w, label: w }))}
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
                    {payorTypes.map((p) => <option key={p} value={p}>{p}</option>)}
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
