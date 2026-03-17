import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Loader2, Sparkles, MapPin, CheckCircle2, ExternalLink, AlertTriangle, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Competitor {
  hospitalName: string;
  packageName: string;
  packagePrice: number;
  packageIncludes: string[];
  location: string;
  websiteUrl: string;
  priceVerified: boolean;
  verificationNote?: string;
  evidenceSnippet?: string;
}

interface Props {
  kpjHospitalName: string;
  packageName: string;
  packagePrice: number;
  packageIncludes: string[];
  procedureName: string;
}

export function CompetitorComparison({
  kpjHospitalName,
  packageName,
  packagePrice,
  packageIncludes,
  procedureName,
}: Props) {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  const formatRM = (n: number) => `RM ${n.toLocaleString("en-MY")}`;

  const fetchCompetitors = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "competitor-comparison",
        {
          body: {
            procedureName,
            packageName,
            packagePrice,
            hospitalName: kpjHospitalName,
            packageIncludes,
          },
        }
      );

      if (fnError) throw new Error(fnError.message || "Failed to fetch competitors");
      if (data?.error) throw new Error(data.error);

      setCompetitors(data.competitors || []);
      setFetched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load competitor data");
    } finally {
      setLoading(false);
    }
  };

  const Disclaimer = () => (
    <div className="flex items-start gap-2 rounded-lg bg-muted/50 border border-border px-4 py-3 mt-4">
      <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
      <p className="text-xs text-muted-foreground">
        Prices are scraped from hospital websites and may not reflect the most current pricing. 
        Please verify directly via the provided links before making any decisions.
      </p>
    </div>
  );

  if (!fetched && !loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold font-display text-foreground">
              Competitor Price Comparison
            </h3>
          </div>
          <button
            onClick={fetchCompetitors}
            className="inline-flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Building2 className="h-4 w-4" />
            Compare with Competitors
          </button>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          See how KPJ's package compares with nearby competitor hospitals.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div>
            <h3 className="text-lg font-semibold font-display text-foreground">
              Fetching Competitor Data...
            </h3>
            <p className="text-sm text-muted-foreground">
              AI is identifying competitor hospitals and scraping their websites for real pricing data. This may take a moment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
        <p className="text-sm text-destructive">{error}</p>
        <button
          onClick={fetchCompetitors}
          className="mt-2 text-sm font-medium text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (competitors.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold font-display text-foreground">
            No Verified Competitor Pricing Found
          </h3>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          We couldn't find verifiable pricing data from competitor hospital websites for this procedure. 
          This may be because competitor hospitals don't publish their package pricing online.
        </p>
        <button
          onClick={fetchCompetitors}
          className="mt-3 text-sm font-medium text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  // Determine if KPJ is cheapest
  const kpjIsCheapest = competitors.every((c) => packagePrice <= c.packagePrice);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold font-display text-foreground">
          Competitor Price Comparison
        </h3>
      </div>

      {/* Side-by-side cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPJ Card */}
        <div className="rounded-xl border-2 border-primary bg-highlight p-4 relative">
          <div className="absolute -top-3 left-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
            {kpjIsCheapest ? "✓ KPJ — Best Value" : "KPJ"}
          </div>
          <div className="mt-3">
            <div className="text-sm font-medium text-foreground truncate">{kpjHospitalName}</div>
            <div className="text-xs text-muted-foreground mt-1">{packageName}</div>
            <div className="text-2xl font-bold font-display text-primary mt-2">
              {formatRM(packagePrice)}
            </div>
            <div className="mt-3 space-y-1">
              {packageIncludes.map((item) => (
                <div key={item} className="text-xs text-foreground flex items-start gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-primary flex-shrink-0 mt-0.5" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Competitor Cards */}
        {competitors.slice(0, 2).map((comp, i) => {
          const priceDiff = comp.packagePrice - packagePrice;
          const isHigher = priceDiff > 0;
          const pct = Math.abs((priceDiff / packagePrice) * 100).toFixed(0);
          return (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-4 relative"
            >
              <div className="absolute -top-3 left-4 bg-muted text-muted-foreground text-xs font-medium px-3 py-1 rounded-full">
                Competitor {i + 1}
              </div>
              <div className="mt-3">
                <div className="text-sm font-medium text-foreground truncate">
                  {comp.hospitalName}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <MapPin className="h-3 w-3" />
                  {comp.location}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{comp.packageName}</div>
                <div className="text-2xl font-bold font-display text-foreground mt-2">
                  {formatRM(comp.packagePrice)}
                </div>
                {priceDiff !== 0 && (
                  <div className={`text-xs font-medium mt-1 ${isHigher ? "text-destructive" : "text-primary"}`}>
                    {isHigher
                      ? `+${formatRM(priceDiff)} (${pct}% higher than KPJ)`
                      : `-${formatRM(Math.abs(priceDiff))} (${pct}% lower than KPJ)`}
                  </div>
                )}
                {comp.priceVerified ? (
                  <div className="text-xs text-primary font-medium mt-1 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {comp.verificationNote || "Price verified from website"}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground font-medium mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {comp.verificationNote || "Price from AI estimate"}
                  </div>
                )}
                <div className="mt-3 space-y-1">
                  {comp.packageIncludes.map((item) => (
                    <div key={item} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 flex-shrink-0 mt-1" />
                      {item}
                    </div>
                  ))}
                </div>
                {comp.evidenceSnippet && (
                  <div className="mt-3 rounded-md bg-muted/60 border border-border px-3 py-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      Evidence
                    </div>
                    <p className="text-xs text-foreground italic leading-relaxed">
                      "{comp.evidenceSnippet}"
                    </p>
                  </div>
                )}
                {comp.websiteUrl && (
                  <a
                    href={comp.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View official pricing
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Disclaimer />
    </motion.div>
  );
}
