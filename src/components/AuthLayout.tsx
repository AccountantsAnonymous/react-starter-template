import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  eyebrow: string;
  quote: string;
  attribution: string;
}

const metrics = [
  { label: "Active clients", value: "312" },
  { label: "Fiscal year", value: "2026" },
  { label: "Entries logged", value: "14,809" },
  { label: "Net balance", value: "$2.4M" },
];

export default function AuthLayout({ children, eyebrow, quote, attribution }: Props) {
  return (
    <div className="min-h-full flex bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      <aside className="hidden lg:flex lg:w-1/2 bg-[#0a0a0a] flex-col justify-between p-12">
        <div>
          <div
            className="text-white text-xs tracking-[0.25em] uppercase mb-1"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Accountants
          </div>
          <div
            className="text-white text-xs tracking-[0.25em] uppercase"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Anonymous
          </div>
        </div>

        <div>
          <p
            className="text-[#6b6b6b] text-xs uppercase tracking-[0.2em] mb-5"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {eyebrow}
          </p>
          <p
            className="text-[#a0a0a0] text-xs leading-relaxed max-w-xs"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            “{quote}”
          </p>
          <p
            className="text-[#3a3a3a] text-xs mt-3"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            — {attribution}
          </p>
        </div>

        <div className="border-t border-[#2a2a2a] pt-6">
          <div className="grid grid-cols-2 gap-4">
            {metrics.map((metric) => (
              <div key={metric.label}>
                <div
                  className="text-[#6b6b6b] text-xs"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {metric.label}
                </div>
                <div
                  className="text-white text-sm font-medium mt-0.5"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {metric.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-12">
            <div
              className="text-[#0a0a0a] text-xs tracking-[0.22em] uppercase"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Accountants Anonymous
            </div>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
