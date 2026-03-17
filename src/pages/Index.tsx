import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EstimatorForm, EstimatorFormData } from "@/components/EstimatorForm";
import { ResultsPage } from "@/components/ResultsPage";
import { generateEstimate, EstimationResult } from "@/data/estimationEngine";

const Index = () => {
  const [result, setResult] = useState<EstimationResult | null>(null);
  const [formData, setFormData] = useState<EstimatorFormData | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (data: EstimatorFormData) => {
    const estimation = await generateEstimate({
      hospitalId: data.hospitalId,
      procedureCodes: data.procedureCodes,
      episodeType: data.episodeType,
      doctorId: data.doctorId || undefined,
      age: data.age ? Number(data.age) : undefined,
      gender: data.gender || undefined,
      wardType: data.wardType || undefined,
      los: data.los ? Number(data.los) : undefined,
    });
    setResult(estimation);
    setFormData(data);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg">
              <img
                src="/kpj_logo.webp"
                alt="KPJ Logo"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold font-display text-foreground">KPJ Bill Estimator</h1>
              <p className="text-xs text-muted-foreground">Hospital Bill Estimation System</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/documentation")}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors"
          >
            <FileText className="h-3.5 w-3.5" /> Documentation
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {!result ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
                Estimate Your Hospital Bill
              </h2>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base max-w-lg mx-auto">
                Get an AI-powered cost estimate for procedures across KPJ Healthcare facilities.
              </p>
            </div>
            <EstimatorForm onSubmit={handleSubmit} />
          </motion.div>
        ) : (
          <ResultsPage
            result={result}
            procedureCodes={formData!.procedureCodes}
            hospitalId={formData!.hospitalId}
            onBack={() => setResult(null)}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
