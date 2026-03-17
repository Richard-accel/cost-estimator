import { useState } from "react";
import { motion } from "framer-motion";
import { EstimatorForm, EstimatorFormData } from "@/components/EstimatorForm";
import { ResultsPage } from "@/components/ResultsPage";
import { generateEstimate, EstimationResult } from "@/data/estimationEngine";
import { Loader2 } from "lucide-react";

export default function Estimator() {
  const [result, setResult] = useState<EstimationResult | null>(null);
  const [formData, setFormData] = useState<EstimatorFormData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: EstimatorFormData) => {
    setLoading(true);
    try {
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Calculating estimate from historical data...</p>
        </div>
      ) : !result ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6">
            <h1 className="text-2xl font-bold font-display text-foreground">Bill Estimator</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Get a data-driven cost estimate for procedures across KPJ Healthcare facilities.
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
    </div>
  );
}
