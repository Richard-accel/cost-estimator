import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface StepIndicatorProps {
  currentStep: number;
  steps: { label: string; description: string }[];
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 ${
                i < currentStep
                  ? "step-indicator-done"
                  : i === currentStep
                  ? "step-indicator-active"
                  : "step-indicator-inactive"
              }`}
            >
              {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <div className="hidden sm:block">
              <div className={`text-sm font-medium ${i === currentStep ? "text-foreground" : "text-muted-foreground"}`}>
                {step.label}
              </div>
              <div className="text-xs text-muted-foreground">{step.description}</div>
            </div>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-px w-8 sm:w-16 transition-colors ${i < currentStep ? "bg-primary" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  );
}
