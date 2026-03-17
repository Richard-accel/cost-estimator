import { useState, useMemo, useRef, useEffect } from "react";
import { Search, X, Plus } from "lucide-react";

interface MultiSelectProps {
  label: string;
  placeholder: string;
  options: { value: string; label: string; sublabel?: string }[];
  values: string[];
  onChange: (values: string[]) => void;
  required?: boolean;
}

export function MultiSelect({ label, placeholder, options, values, onChange, required }: MultiSelectProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () => options.filter(
      (o) => !values.includes(o.value) &&
        (o.label.toLowerCase().includes(search.toLowerCase()) ||
          (o.sublabel && o.sublabel.toLowerCase().includes(search.toLowerCase())))
    ),
    [options, values, search]
  );

  const selectedItems = options.filter((o) => values.includes(o.value));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-foreground mb-1.5">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedItems.map((item) => (
            <span
              key={item.value}
              className="inline-flex items-center gap-1 rounded-md bg-highlight text-highlight-foreground px-2 py-1 text-xs font-medium"
            >
              {item.label}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => onChange(values.filter((v) => v !== item.value))}
              />
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-left transition-colors hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
      >
        <span className="text-muted-foreground">{placeholder}</span>
        <Plus className="h-4 w-4 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-xl max-h-64 overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="flex items-center gap-2 px-2">
              <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search procedures..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-48">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-muted-foreground">No more procedures</div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange([...values, opt.value]); setSearch(""); }}
                  className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-highlight text-foreground"
                >
                  <div>{opt.label}</div>
                  {opt.sublabel && (
                    <div className="text-xs text-muted-foreground mt-0.5">{opt.sublabel}</div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
