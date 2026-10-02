import { useState } from "react";

const ACCOUNTS = [
  "All accounts",
  "Cash & Equivalents",
  "Accounts Receivable",
  "Accounts Payable",
  "Revenue",
  "Operating Expenses",
  "Payroll",
];

const ledgerEntries = [
  { date: "2026-09-09", ref: "JE-1042", description: "Client retainer — Harmon LLC", account: "Accounts Receivable", debit: 8500.0, credit: null, balance: 142380.5 },
  { date: "2026-09-09", ref: "JE-1041", description: "Office lease — September", account: "Operating Expenses", debit: 3200.0, credit: null, balance: 133880.5 },
  { date: "2026-09-08", ref: "JE-1040", description: "Payment received — Vasquez & Co.", account: "Cash & Equivalents", debit: null, credit: 12000.0, balance: 137080.5 },
  { date: "2026-09-08", ref: "JE-1039", description: "Software subscriptions — Q3", account: "Operating Expenses", debit: 840.0, credit: null, balance: 125080.5 },
  { date: "2026-09-07", ref: "JE-1038", description: "Invoice #7831 — Aurelius Partners", account: "Revenue", debit: null, credit: 22500.0, balance: 125920.5 },
  { date: "2026-09-06", ref: "JE-1037", description: "Payroll — biweekly disbursement", account: "Payroll", debit: 41200.0, credit: null, balance: 103420.5 },
  { date: "2026-09-05", ref: "JE-1036", description: "Insurance premium — annual", account: "Operating Expenses", debit: 4800.0, credit: null, balance: 144620.5 },
  { date: "2026-09-04", ref: "JE-1035", description: "Consulting fee — Nakamura Group", account: "Revenue", debit: null, credit: 6750.0, balance: 149420.5 },
  { date: "2026-09-03", ref: "JE-1034", description: "Equipment purchase — HP LaserJet", account: "Operating Expenses", debit: 1290.0, credit: null, balance: 142670.5 },
  { date: "2026-09-02", ref: "JE-1033", description: "Wire transfer — payables clearing", account: "Accounts Payable", debit: null, credit: 9400.0, balance: 143960.5 },
  { date: "2026-09-01", ref: "JE-1032", description: "Month-end reconciliation adjustment", account: "Cash & Equivalents", debit: 215.0, credit: null, balance: 134560.5 },
  { date: "2026-08-30", ref: "JE-1031", description: "Advance billing — Cortez Industries", account: "Accounts Receivable", debit: 15000.0, credit: null, balance: 134775.5 },
];

const fmt = (n: number | null, sign?: "debit" | "credit") => {
  if (n == null) return "";
  const s = n.toLocaleString("en-US", { minimumFractionDigits: 2 });
  if (sign === "debit") return s;
  if (sign === "credit") return s;
  return `$${s}`;
};

export default function LedgerPage() {
  const [account, setAccount] = useState("All accounts");
  const [search, setSearch] = useState("");

  const filtered = ledgerEntries.filter((e) => {
    const matchAccount = account === "All accounts" || e.account === account;
    const matchSearch =
      !search ||
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.ref.toLowerCase().includes(search.toLowerCase());
    return matchAccount && matchSearch;
  });

  const totalDebits = filtered.reduce((s, e) => s + (e.debit ?? 0), 0);
  const totalCredits = filtered.reduce((s, e) => s + (e.credit ?? 0), 0);

  return (
    <div className="p-10 min-h-full" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#0a0a0a]">General Ledger</h1>
          <p className="text-sm text-[#6b6b6b] mt-1">September 2026 — all entries</p>
        </div>
        <button className="bg-[#0a0a0a] text-white text-sm px-4 py-2 hover:bg-[#2a2a2a] transition-colors cursor-pointer">
          + New entry
        </button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total debits", value: `$${totalDebits.toLocaleString("en-US", { minimumFractionDigits: 2 })}` },
          { label: "Total credits", value: `$${totalCredits.toLocaleString("en-US", { minimumFractionDigits: 2 })}` },
          {
            label: "Net",
            value: `${totalDebits - totalCredits >= 0 ? "" : "-"}$${Math.abs(totalDebits - totalCredits).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
          },
        ].map((s) => (
          <div key={s.label} className="border border-[#d0d0d0] p-5">
            <div
              className="text-xs text-[#6b6b6b] mb-2 uppercase tracking-wider"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {s.label}
            </div>
            <div
              className="text-xl font-semibold text-[#0a0a0a]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Search entries..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-[#d0d0d0] px-3 py-2 text-sm text-[#0a0a0a] placeholder-[#b0b0b0] outline-none focus:border-[#0a0a0a] transition-colors w-64"
        />
        <select
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          className="border border-[#d0d0d0] px-3 py-2 text-sm text-[#0a0a0a] outline-none focus:border-[#0a0a0a] transition-colors bg-white cursor-pointer"
        >
          {ACCOUNTS.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="border border-[#d0d0d0]">
        <table className="w-full border-collapse" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          <thead>
            <tr className="bg-[#f5f5f5] border-b border-[#d0d0d0]">
              {["Date", "Ref", "Description", "Account", "Debit", "Credit", "Balance"].map((h) => (
                <th
                  key={h}
                  className={`text-left text-xs text-[#6b6b6b] uppercase tracking-wider px-4 py-3 font-medium ${
                    ["Debit", "Credit", "Balance"].includes(h) ? "text-right" : ""
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((e, i) => (
              <tr
                key={e.ref}
                className={`border-b border-[#f0f0f0] hover:bg-[#fafafa] transition-colors ${
                  i === filtered.length - 1 ? "border-b-0" : ""
                }`}
              >
                <td className="px-4 py-3 text-xs text-[#6b6b6b]">{e.date}</td>
                <td className="px-4 py-3 text-xs text-[#0a0a0a]">{e.ref}</td>
                <td className="px-4 py-3 text-xs text-[#0a0a0a] max-w-xs truncate">{e.description}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-[#f0f0f0] px-2 py-0.5 text-[#4a4a4a]">{e.account}</span>
                </td>
                <td className="px-4 py-3 text-xs text-right text-[#0a0a0a]">
                  {e.debit != null ? fmt(e.debit) : ""}
                </td>
                <td className="px-4 py-3 text-xs text-right text-[#0a0a0a]">
                  {e.credit != null ? fmt(e.credit) : ""}
                </td>
                <td className="px-4 py-3 text-xs text-right font-medium text-[#0a0a0a]">
                  {fmt(e.balance)}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-xs text-[#6b6b6b]">
                  No entries match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[#b0b0b0] mt-4">
        Showing {filtered.length} of {ledgerEntries.length} entries
      </p>
    </div>
  );
}
