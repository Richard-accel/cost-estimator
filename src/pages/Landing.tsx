import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, BookOpen, FileText, MessageCircle, ArrowRight, Shield, Building2, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

const features = [
  {
    icon: BookOpen,
    title: "User Manual",
    description: "Step-by-step guides for using the bill estimation system across all user roles.",
    link: "/user-manual",
    color: "text-primary",
  },
  {
    icon: FileText,
    title: "System Documentation",
    description: "Technical documentation covering architecture, data models, and API references.",
    link: "/documentation",
    color: "text-accent",
  },
  {
    icon: MessageCircle,
    title: "AI Assistant",
    description: "Chat with our AI-powered assistant for instant help with the system.",
    link: "/chatbot",
    color: "text-success",
  },
];

const personas = [
  { icon: Shield, title: "Group", description: "Full system administration, data management, and historical data ingestion." },
  { icon: Building2, title: "Hospital", description: "View hospital-specific data and generate bill estimates." },
  { icon: Stethoscope, title: "Doctor", description: "Access your profile and procedure-level bill estimates." },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-5" />
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold font-display text-foreground">KPJ Bill Estimator</span>
          </div>
          <div className="flex gap-3">
            {user ? (
              <Button asChild>
                <Link to="/dashboard">Go to Dashboard <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            ) : (
              <>
                <Button variant="outline" asChild><Link to="/login">Sign In</Link></Button>
                <Button asChild><Link to="/signup">Get Started</Link></Button>
              </>
            )}
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 pt-16 pb-24 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display text-foreground leading-tight">
              Hospital Bill
              <span className="gradient-primary-text"> Estimation</span>
              <br />Made Simple
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              AI-powered cost estimation across KPJ Healthcare facilities. Accurate, transparent,
              and backed by historical data analysis.
            </p>
            <div className="mt-8 flex gap-4 justify-center">
              {user ? (
                <Button size="lg" asChild>
                  <Link to="/estimator">Open Estimator <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" asChild><Link to="/signup">Create Account <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
                  <Button size="lg" variant="outline" asChild><Link to="/login">Sign In</Link></Button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </header>

      {/* Personas */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold font-display text-center mb-10 text-foreground">Three User Personas</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {personas.map((p, i) => (
            <motion.div key={p.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}>
              <Card className="h-full text-center">
                <CardContent className="pt-8 pb-6 px-6">
                  <div className="flex justify-center mb-4">
                    <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center">
                      <p.icon className="h-7 w-7 text-primary-foreground" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold font-display text-foreground mb-2">{p.title}</h3>
                  <p className="text-sm text-muted-foreground">{p.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Resources */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-border">
        <h2 className="text-2xl font-bold font-display text-center mb-10 text-foreground">Resources & Support</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}>
              <Link to={f.link}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
                  <CardContent className="pt-8 pb-6 px-6">
                    <f.icon className={`h-8 w-8 mb-4 ${f.color}`} />
                    <h3 className="text-lg font-bold font-display text-foreground mb-2 group-hover:text-primary transition-colors">
                      {f.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{f.description}</p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} KPJ Healthcare Berhad. Bill Estimator System.</p>
      </footer>
    </div>
  );
}
