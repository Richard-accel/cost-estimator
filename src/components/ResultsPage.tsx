import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, Package, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { EstimationResult } from "@/data/estimationEngine";
import { procedures, hospitals } from "@/data/hospitals";
import { CompetitorComparison } from "./CompetitorComparison";

interface Props {
  result: EstimationResult;
  procedureCodes: string[];
  hospitalId: string;
  onBack: () => void;
}

const categoryLabels: Record<string, string> = {
  consultantFees: "Consultant Fees",
  surgeryFees: "Surgery & Procedure",
  radiologyFees: "Radiology",
  laboratoryFees: "Laboratory",
  pharmacyFees: "Pharmacy",
  roomAndBoard: "Room & Board",
};

const barColors = [
  "hsl(174, 62%, 38%)",
  "hsl(199, 70%, 48%)",
  "hsl(152, 60%, 42%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 50%, 55%)",
  "hsl(210, 30%, 55%)",
];

export function ResultsPage({ result, procedureCodes, hospitalId, onBack }: Props) {
  const [percentile, setPercentile] = useState<"p50" | "p75">("p50");

  const total = percentile === "p50" ? result.totalP50 : result.totalP75;
  const breakdown = percentile === "p50" ? result.breakdownP50 : result.breakdownP75;

  const chartData = Object.entries(breakdown).map(([key, value]) => ({
    name: categoryLabels[key] || key,
    amount: value,
  }));

  const procNames = procedureCodes.map((c) => procedures.find((p) => p.code === c)?.name || c);
  const hospitalName = hospitals.find((h) => h.id === hospitalId)?.name || hospitalId;

  const formatRM = (n: number) => `RM ${n.toLocaleString("en-MY")}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Modify Inputs
        </button>
        <div className="flex rounded-lg border border-border bg-card overflow-hidden">
          {(["p50", "p75"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPercentile(p)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                percentile === p ? "gradient-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              {p === "p50" ? "P50 (Median)" : "P75 (High-end)"}
            </button>
          ))}
        </div>
      </div>

      {/* Total Estimate Card */}
      <div className="rounded-2xl gradient-primary p-6 text-primary-foreground shadow-lg">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="h-5 w-5 opacity-80" />
          <span className="text-sm font-medium opacity-80">
            Estimated Total ({percentile === "p50" ? "Median" : "75th Percentile"})
          </span>
        </div>
        <div className="text-4xl font-bold font-display">{formatRM(total)}</div>
        <div className="mt-2 text-sm opacity-80">
          {procNames.join(" + ")}
        </div>
        {result.hospitalWideNote && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-primary-foreground/10 px-3 py-2 text-xs">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            {result.hospitalWideNote}
          </div>
        )}
      </div>

      {/* Range comparison */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`rounded-xl border p-4 transition-all ${percentile === "p50" ? "border-primary bg-highlight" : "border-border bg-card"}`}>
          <div className="text-xs text-muted-foreground font-medium mb-1">P50 — Median Estimate</div>
          <div className="text-2xl font-bold font-display text-foreground">{formatRM(result.totalP50)}</div>
          <div className="text-xs text-muted-foreground mt-1">50% of cases fall below this</div>
        </div>
        <div className={`rounded-xl border p-4 transition-all ${percentile === "p75" ? "border-primary bg-highlight" : "border-border bg-card"}`}>
          <div className="text-xs text-muted-foreground font-medium mb-1">P75 — High-end Estimate</div>
          <div className="text-2xl font-bold font-display text-foreground">{formatRM(result.totalP75)}</div>
          <div className="text-xs text-muted-foreground mt-1">75% of cases fall below this</div>
        </div>
      </div>

      {/* Fee Breakdown Chart */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold font-display text-foreground mb-4">Fee Breakdown</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
              <XAxis type="number" tickFormatter={(v) => `RM ${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => [formatRM(value), ""]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid hsl(210 18% 88%)",
                  fontSize: "13px",
                }}
              />
              <Bar dataKey="amount" radius={[0, 6, 6, 0]} barSize={20}>
                {chartData.map((_, index) => (
                  <Cell key={index} fill={barColors[index % barColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Breakdown table */}
        <div className="mt-4 divide-y divide-border">
          {chartData.map((item, i) => (
            <div key={item.name} className="flex items-center justify-between py-2.5 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: barColors[i] }} />
                <span className="text-foreground">{item.name}</span>
              </div>
              <span className="font-medium text-foreground">{formatRM(item.amount)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between py-2.5 text-sm font-bold">
            <span className="text-foreground">Total</span>
            <span className="text-foreground">{formatRM(total)}</span>
          </div>
        </div>
      </div>

      {/* Surgical Package */}
      {result.surgicalPackage && (
        <div className="rounded-2xl border border-primary/30 bg-highlight p-6">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold font-display text-highlight-foreground">
              Fixed Surgical Package Available
            </h3>
          </div>
          <div className="mb-3">
            <span className="text-sm font-medium text-highlight-foreground">{result.surgicalPackage.name}</span>
            <div className="text-2xl font-bold font-display text-primary mt-1">
              {formatRM(result.surgicalPackage.price)}
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Package Includes:</div>
            {result.surgicalPackage.includes.map((item) => (
              <div key={item} className="text-sm text-highlight-foreground flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competitor Comparison — only shown when a surgical package exists */}
      {result.surgicalPackage && (
        <CompetitorComparison
          kpjHospitalName={hospitalName}
          packageName={result.surgicalPackage.name}
          packagePrice={result.surgicalPackage.price}
          packageIncludes={result.surgicalPackage.includes}
          procedureName={procNames[0] || ""}
        />
      )}
    </motion.div>
  );
}
