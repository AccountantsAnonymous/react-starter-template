import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import LedgerPage from "./pages/LedgerPage";
import JournalPage from "./pages/JournalPage";

type Page = "login" | "ledger" | "journal";

export default function App() {
  const [page, setPage] = useState<Page>("login");
  const [loggedIn, setLoggedIn] = useState(false);

  const handleLogin = () => {
    setLoggedIn(true);
    setPage("ledger");
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setPage("login");
  };

  if (!loggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-full" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar */}
      <aside className="w-56 bg-[#0a0a0a] flex flex-col shrink-0">
        <div className="px-6 pt-8 pb-6 border-b border-[#2a2a2a]">
          <div
            className="text-white text-xs tracking-[0.2em] uppercase mb-1"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Accountants
          </div>
          <div
            className="text-white text-xs tracking-[0.2em] uppercase"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Anonymous
          </div>
        </div>
        <nav className="flex flex-col gap-1 p-3 flex-1">
          <button
            onClick={() => setPage("ledger")}
            className={`text-left px-3 py-2.5 text-sm transition-colors cursor-pointer ${
              page === "ledger"
                ? "bg-white text-black"
                : "text-[#a0a0a0] hover:text-white hover:bg-[#1a1a1a]"
            }`}
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Ledger
          </button>
          <button
            onClick={() => setPage("journal")}
            className={`text-left px-3 py-2.5 text-sm transition-colors cursor-pointer ${
              page === "journal"
                ? "bg-white text-black"
                : "text-[#a0a0a0] hover:text-white hover:bg-[#1a1a1a]"
            }`}
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Journal
          </button>
        </nav>
        <div className="p-3 border-t border-[#2a2a2a]">
          <div className="px-3 py-2 mb-1">
            <div className="text-[#6b6b6b] text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Logged in as
            </div>
            <div className="text-white text-xs mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              m.chen@firm.com
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2.5 text-sm text-[#a0a0a0] hover:text-white hover:bg-[#1a1a1a] transition-colors cursor-pointer"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto bg-white">
        {page === "ledger" && <LedgerPage />}
        {page === "journal" && <JournalPage />}
      </main>
    </div>
  );
}
