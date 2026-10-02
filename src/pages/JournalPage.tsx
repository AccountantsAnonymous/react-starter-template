import { useState } from "react";

const journalEntries = [
  {
    id: "JE-1042",
    date: "2026-09-09",
    memo: "Record retainer received from Harmon LLC for Q4 advisory engagement.",
    preparedBy: "M. Chen",
    status: "Posted",
    lines: [
      { account: "Accounts Receivable", debit: 8500.0, credit: null },
      { account: "Revenue — Advisory", debit: null, credit: 8500.0 },
    ],
  },
  {
    id: "JE-1041",
    date: "2026-09-09",
    memo: "Monthly office lease payment for September 2026.",
    preparedBy: "D. Park",
    status: "Posted",
    lines: [
      { account: "Operating Expenses — Rent", debit: 3200.0, credit: null },
      { account: "Cash & Equivalents", debit: null, credit: 3200.0 },
    ],
  },
  {
    id: "JE-1040",
    date: "2026-09-08",
    memo: "Full payment received from Vasquez & Co. for outstanding invoice #7804.",
    preparedBy: "M. Chen",
    status: "Posted",
    lines: [
      { account: "Cash & Equivalents", debit: 12000.0, credit: null },
      { account: "Accounts Receivable", debit: null, credit: 12000.0 },
    ],
  },
  {
    id: "JE-1039",
    date: "2026-09-08",
    memo: "Q3 software subscriptions: Practice Ignition, Xero, Loom.",
    preparedBy: "D. Park",
    status: "Posted",
    lines: [
      { account: "Operating Expenses — Software", debit: 840.0, credit: null },
      { account: "Accounts Payable", debit: null, credit: 840.0 },
    ],
  },
  {
    id: "JE-1038",
    date: "2026-09-07",
    memo: "Invoice #7831 issued to Aurelius Partners for audit preparation services.",
    preparedBy: "M. Chen",
    status: "Posted",
    lines: [
      { account: "Accounts Receivable", debit: 22500.0, credit: null },
      { account: "Revenue — Audit", debit: null, credit: 22500.0 },
    ],
  },
  {
    id: "JE-1037",
    date: "2026-09-06",
    memo: "Biweekly payroll disbursement — 14 staff members.",
    preparedBy: "D. Park",
    status: "Posted",
    lines: [
      { account: "Payroll Expense", debit: 41200.0, credit: null },
      { account: "Cash & Equivalents", debit: null, credit: 41200.0 },
    ],
  },
];

const statusColors: Record<string, string> = {
  Posted: "bg-[#0a0a0a] text-white",
  Draft: "bg-[#e8e8e8] text-[#6b6b6b]",
  Pending: "bg-[#d4d4d4] text-[#0a0a0a]",
};

export default function JournalPage() {
  const [expanded, setExpanded] = useState<string | null>("JE-1042");
  const [showForm, setShowForm] = useState(false);
  const [newMemo, setNewMemo] = useState("");

  return (
    <div className="p-10 min-h-full" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#0a0a0a]">Journal Entries</h1>
          <p className="text-sm text-[#6b6b6b] mt-1">September 2026 — {journalEntries.length} entries</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-[#0a0a0a] text-white text-sm px-4 py-2 hover:bg-[#2a2a2a] transition-colors cursor-pointer"
        >
          {showForm ? "Cancel" : "+ New entry"}
        </button>
      </div>

      {/* New entry form */}
      {showForm && (
        <div className="border border-[#0a0a0a] p-6 mb-8 bg-[#fafafa]">
          <h2 className="text-sm font-semibold text-[#0a0a0a] mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            New Journal Entry
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-[#6b6b6b] mb-1 uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Date
              </label>
              <input
                type="date"
                defaultValue="2026-09-10"
                className="w-full border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-[#0a0a0a] transition-colors bg-white"
              />
            </div>
            <div>
              <label className="block text-xs text-[#6b6b6b] mb-1 uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Prepared by
              </label>
              <input
                type="text"
                placeholder="Your name"
                className="w-full border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-[#0a0a0a] transition-colors bg-white placeholder-[#b0b0b0]"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs text-[#6b6b6b] mb-1 uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Memo
            </label>
            <textarea
              rows={2}
              value={newMemo}
              onChange={(e) => setNewMemo(e.target.value)}
              placeholder="Describe this journal entry..."
              className="w-full border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-[#0a0a0a] transition-colors bg-white placeholder-[#b0b0b0] resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button className="bg-[#0a0a0a] text-white text-sm px-4 py-2 hover:bg-[#2a2a2a] transition-colors cursor-pointer">
              Save as draft
            </button>
            <button className="border border-[#d0d0d0] text-[#0a0a0a] text-sm px-4 py-2 hover:border-[#0a0a0a] transition-colors cursor-pointer">
              Post entry
            </button>
          </div>
        </div>
      )}

      {/* Entry list */}
      <div className="flex flex-col gap-px border border-[#d0d0d0]">
        {journalEntries.map((entry) => {
          const isOpen = expanded === entry.id;
          const debitTotal = entry.lines.reduce((s, l) => s + (l.debit ?? 0), 0);
          const creditTotal = entry.lines.reduce((s, l) => s + (l.credit ?? 0), 0);
          const balanced = Math.abs(debitTotal - creditTotal) < 0.01;

          return (
            <div key={entry.id} className="bg-white">
              {/* Row */}
              <button
                className="w-full flex items-center gap-6 px-5 py-4 text-left hover:bg-[#fafafa] transition-colors cursor-pointer border-b border-[#f0f0f0]"
                onClick={() => setExpanded(isOpen ? null : entry.id)}
              >
                <span
                  className="text-xs text-[#6b6b6b] w-20 shrink-0"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {entry.date}
                </span>
                <span
                  className="text-xs font-medium text-[#0a0a0a] w-20 shrink-0"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {entry.id}
                </span>
                <span className="text-sm text-[#0a0a0a] flex-1 truncate">{entry.memo}</span>
                <span className="text-xs text-[#6b6b6b] w-20 shrink-0 text-right">
                  {entry.preparedBy}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 w-16 text-center shrink-0 ${statusColors[entry.status]}`}
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {entry.status}
                </span>
                <span className="text-[#b0b0b0] text-xs w-4 shrink-0">
                  {isOpen ? "▲" : "▼"}
                </span>
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <div className="px-5 py-5 bg-[#fafafa] border-b border-[#d0d0d0]">
                  <p className="text-xs text-[#6b6b6b] mb-4 leading-relaxed max-w-xl">{entry.memo}</p>
                  <table className="w-full" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    <thead>
                      <tr className="border-b border-[#d0d0d0]">
                        {["Account", "Debit", "Credit"].map((h) => (
                          <th
                            key={h}
                            className={`text-left text-xs text-[#6b6b6b] uppercase tracking-wider pb-2 font-medium ${
                              h !== "Account" ? "text-right" : ""
                            }`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {entry.lines.map((line, i) => (
                        <tr key={i} className="border-b border-[#f0f0f0]">
                          <td className="py-2.5 text-xs text-[#0a0a0a]">{line.account}</td>
                          <td className="py-2.5 text-xs text-right text-[#0a0a0a]">
                            {line.debit != null
                              ? `$${line.debit.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                              : ""}
                          </td>
                          <td className="py-2.5 text-xs text-right text-[#0a0a0a]">
                            {line.credit != null
                              ? `$${line.credit.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                              : ""}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t border-[#d0d0d0]">
                        <td className="pt-2.5 text-xs font-medium text-[#0a0a0a]">Totals</td>
                        <td className="pt-2.5 text-xs text-right font-medium text-[#0a0a0a]">
                          ${debitTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="pt-2.5 text-xs text-right font-medium text-[#0a0a0a]">
                          ${creditTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 ${balanced ? "bg-[#0a0a0a] text-white" : "bg-red-100 text-red-700"}`}
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {balanced ? "Balanced" : "Out of balance"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
