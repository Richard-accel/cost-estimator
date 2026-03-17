import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Tag, CheckCircle2, Building2, Calendar, ArrowRight, Search } from "lucide-react";
import { Link } from "react-router-dom";

interface Promotion {
  id: string;
  title: string;
  description: string | null;
  hospital_id: string | null;
  procedure_code: string | null;
  package_price: number;
  original_price: number | null;
  includes: string[];
  valid_from: string | null;
  valid_until: string | null;
  badge_text: string | null;
}

interface Hospital { id: string; name: string; }

export default function Dashboard() {
  const { profile, hasRole } = useAuth();
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      supabase.from("promotions").select("*").eq("is_active", true).order("sort_order", { ascending: true }).order("created_at", { ascending: false }),
      supabase.from("hospitals").select("id, name").eq("is_active", true),
    ]).then(([p, h]) => {
      setPromos((p.data ?? []) as Promotion[]);
      setHospitals(h.data ?? []);
      setLoading(false);
    });
  }, []);

  const hospName = (id: string | null) => (id ? hospitals.find((h) => h.id === id)?.name ?? "" : "All KPJ Hospitals");
  const formatRM = (n: number) => `RM ${n.toLocaleString("en-MY")}`;
  const discount = (orig: number | null, pkg: number) => orig ? Math.round(((orig - pkg) / orig) * 100) : 0;

  const filtered = promos.filter((p) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      p.title.toLowerCase().includes(s) ||
      (p.description ?? "").toLowerCase().includes(s) ||
      hospName(p.hospital_id).toLowerCase().includes(s) ||
      (p.procedure_code ?? "").toLowerCase().includes(s) ||
      p.includes.some((inc) => inc.toLowerCase().includes(s))
    );
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display text-foreground">
          Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}
        </h1>
        <p className="text-muted-foreground mt-1">
          Explore our latest healthcare packages and promotions across KPJ hospitals.
        </p>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link to="/estimator">
          <Button className="gradient-primary text-primary-foreground gap-2">
            <Sparkles className="h-4 w-4" /> Get Bill Estimate <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        {hasRole("group") && (
          <Link to="/admin/promotions">
            <Button variant="outline" className="gap-2">
              <Tag className="h-4 w-4" /> Manage Promotions
            </Button>
          </Link>
        )}
      </div>

      {/* Promotions Header + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold font-display text-foreground">Current Packages & Promotions</h2>
        </div>
        <div className="relative max-w-xs w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search packages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading promotions...</div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground">
              {search.trim() ? "No packages match your search." : "No active promotions at the moment."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((promo) => {
            const disc = discount(promo.original_price, promo.package_price);
            return (
              <Card key={promo.id} className="group hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
                {/* Badge + Price Header */}
                <div className="gradient-primary px-5 pt-5 pb-4 relative">
                  {promo.badge_text && (
                    <Badge className="absolute top-3 right-3 bg-primary-foreground/20 text-primary-foreground border-0 text-xs">
                      {promo.badge_text}
                    </Badge>
                  )}
                  <h3 className="text-base font-semibold font-display text-primary-foreground leading-tight pr-16">
                    {promo.title}
                  </h3>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-display text-primary-foreground">
                      {formatRM(promo.package_price)}
                    </span>
                    {promo.original_price && (
                      <span className="text-sm line-through text-primary-foreground/60">
                        {formatRM(promo.original_price)}
                      </span>
                    )}
                  </div>
                  {disc > 0 && (
                    <span className="text-xs font-medium text-primary-foreground/80 mt-0.5 block">
                      Save {disc}%
                    </span>
                  )}
                </div>

                <CardContent className="flex-1 p-5 space-y-3">
                  {promo.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{promo.description}</p>
                  )}

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                    {hospName(promo.hospital_id)}
                  </div>

                  {promo.valid_until && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      Valid until {new Date(promo.valid_until).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  )}

                  {promo.includes.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Package Includes</div>
                      {promo.includes.map((item) => (
                        <div key={item} className="text-sm text-foreground flex items-start gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                          {item}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>

                <div className="px-5 pb-5">
                  <Link to="/estimator">
                    <Button variant="outline" size="sm" className="w-full gap-1.5">
                      Get Detailed Estimate <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
