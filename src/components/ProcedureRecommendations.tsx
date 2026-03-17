import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check, X } from "lucide-react";
import { procedures, procedureRecommendations } from "@/data/hospitals";

interface Props {
  primaryProcedureCode: string;
  currentProcedures: string[];
  onAccept: (codes: string[]) => void;
}

export function ProcedureRecommendations({ primaryProcedureCode, currentProcedures, onAccept }: Props) {
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  const recommendations = procedureRecommendations[primaryProcedureCode] || [];
  const newRecommendations = recommendations.filter((r) => !currentProcedures.includes(r.procedureCode));

  useEffect(() => {
    setLoading(true);
    setDismissed(false);
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, [primaryProcedureCode]);

  if (dismissed || newRecommendations.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="rounded-xl border border-primary/20 bg-highlight p-4 mt-3"
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-highlight-foreground">AI Recommendation</span>
        </div>

        {loading ? (
          <div className="flex items-center gap-3">
            <div className="h-1.5 flex-1 rounded-full bg-primary/20 overflow-hidden">
              <motion.div
                className="h-full rounded-full gradient-primary"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
              />
            </div>
            <span className="text-xs text-muted-foreground">Analyzing patterns...</span>
          </div>
        ) : (
          <div className="space-y-2">
            {newRecommendations.map((rec) => {
              const proc = procedures.find((p) => p.code === rec.procedureCode);
              return (
                <div key={rec.procedureCode} className="text-sm text-highlight-foreground">
                  <span className="font-medium">{proc?.name}</span>
                  <span className="text-muted-foreground ml-1">— {rec.reason}</span>
                </div>
              );
            })}
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => onAccept(newRecommendations.map((r) => r.procedureCode))}
                className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Check className="h-3.5 w-3.5" /> Yes, include these
              </button>
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors"
              >
                <X className="h-3.5 w-3.5" /> No, I'll use my own
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
