import { useState } from "react";

type TeamMember = {
  name: string;
  email: string;
  role: string;
  status: string;
};

const initialMembers: TeamMember[] = [
  { name: "Morgan Chen", email: "m.chen@firm.com", role: "Administrator", status: "Active" },
  { name: "Devon Park", email: "d.park@firm.com", role: "Accountant", status: "Active" },
  { name: "Riley Brooks", email: "r.brooks@firm.com", role: "Reviewer", status: "Active" },
  { name: "Sam Rivera", email: "s.rivera@firm.com", role: "Accountant", status: "Invited" },
];

export default function AdminPage() {
  const [members, setMembers] = useState(initialMembers);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Accountant");
  const [saved, setSaved] = useState(false);

  const inviteMember = (event: React.FormEvent) => {
    event.preventDefault();
    if (!inviteEmail) return;
    setMembers((current) => [
      ...current,
      { name: "Pending invitation", email: inviteEmail, role: inviteRole, status: "Invited" },
    ]);
    setInviteEmail("");
    setShowInvite(false);
  };

  return (
    <div className="p-10 min-h-full" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#0a0a0a]">Administration</h1>
          <p className="text-sm text-[#6b6b6b] mt-1">Workspace access, preferences, and controls.</p>
        </div>
        <div
          className="border border-[#d0d0d0] px-3 py-2 text-xs text-[#6b6b6b]"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          AA-000312
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Team members", value: members.length.toString(), note: `${members.filter((m) => m.status === "Active").length} active` },
          { label: "Permission groups", value: "03", note: "1 administrator" },
          { label: "Last audit", value: "09/09", note: "No exceptions" },
        ].map((item) => (
          <div key={item.label} className="border border-[#d0d0d0] p-5">
            <div className="text-xs text-[#6b6b6b] uppercase tracking-wider font-mono">{item.label}</div>
            <div className="flex items-end justify-between mt-4">
              <span className="text-2xl font-semibold text-[#0a0a0a] font-mono">{item.value}</span>
              <span className="text-xs text-[#b0b0b0] font-mono">{item.note}</span>
            </div>
          </div>
        ))}
      </div>

      <section className="border border-[#d0d0d0] mb-8">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#d0d0d0]">
          <div>
            <h2 className="text-sm font-semibold text-[#0a0a0a]">Team access</h2>
            <p className="text-xs text-[#6b6b6b] mt-0.5">Manage members and workspace permissions.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowInvite((current) => !current)}
            className="bg-[#0a0a0a] text-white text-xs px-4 py-2 hover:bg-[#2a2a2a] transition-colors cursor-pointer"
          >
            {showInvite ? "Cancel" : "+ Invite member"}
          </button>
        </div>

        {showInvite && (
          <form onSubmit={inviteMember} className="grid grid-cols-[1fr_12rem_auto] gap-3 p-5 bg-[#fafafa] border-b border-[#d0d0d0]">
            <input
              type="email"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="colleague@firm.com"
              autoFocus
              className="border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-[#0a0a0a] bg-white"
            />
            <select
              value={inviteRole}
              onChange={(event) => setInviteRole(event.target.value)}
              className="border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-[#0a0a0a] bg-white"
            >
              <option>Accountant</option>
              <option>Reviewer</option>
              <option>Administrator</option>
            </select>
            <button type="submit" className="border border-[#0a0a0a] px-4 py-2 text-xs hover:bg-[#0a0a0a] hover:text-white cursor-pointer">
              Send invite
            </button>
          </form>
        )}

        <div className="grid grid-cols-[1.2fr_1.5fr_1fr_0.7fr] px-5 py-3 bg-[#f5f5f5] border-b border-[#d0d0d0] text-xs text-[#6b6b6b] uppercase tracking-wider font-mono">
          <span>Name</span>
          <span>Email</span>
          <span>Role</span>
          <span className="text-right">Status</span>
        </div>
        {members.map((member) => (
          <div
            key={member.email}
            className="grid grid-cols-[1.2fr_1.5fr_1fr_0.7fr] items-center px-5 py-3.5 border-b last:border-b-0 border-[#f0f0f0] text-xs"
          >
            <span className="text-[#0a0a0a] font-medium">{member.name}</span>
            <span className="text-[#6b6b6b] font-mono">{member.email}</span>
            <span className="text-[#0a0a0a]">{member.role}</span>
            <span className="text-right">
              <span className={`inline-block px-2 py-0.5 font-mono ${member.status === "Active" ? "bg-[#0a0a0a] text-white" : "bg-[#e8e8e8] text-[#6b6b6b]"}`}>
                {member.status}
              </span>
            </span>
          </div>
        ))}
      </section>

      <section className="border border-[#d0d0d0]">
        <div className="px-5 py-4 border-b border-[#d0d0d0]">
          <h2 className="text-sm font-semibold text-[#0a0a0a]">Workspace settings</h2>
          <p className="text-xs text-[#6b6b6b] mt-0.5">Defaults applied to reports and new entries.</p>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-5 p-5">
          <div>
            <label className="block text-xs text-[#6b6b6b] mb-1.5 uppercase tracking-wide font-mono">Firm name</label>
            <input defaultValue="Anonymous & Co." className="w-full border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-[#0a0a0a]" />
          </div>
          <div>
            <label className="block text-xs text-[#6b6b6b] mb-1.5 uppercase tracking-wide font-mono">Fiscal year end</label>
            <select defaultValue="December 31" className="w-full border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-[#0a0a0a] bg-white">
              <option>December 31</option>
              <option>June 30</option>
              <option>September 30</option>
            </select>
          </div>
          <label className="flex items-center gap-3 text-sm text-[#0a0a0a] cursor-pointer">
            <input type="checkbox" defaultChecked className="accent-[#0a0a0a]" />
            Require review before posting
          </label>
          <div className="flex items-center justify-end gap-3">
            {saved && <span className="text-xs text-[#6b6b6b] font-mono">Changes saved</span>}
            <button
              type="button"
              onClick={() => setSaved(true)}
              className="bg-[#0a0a0a] text-white text-xs px-4 py-2 hover:bg-[#2a2a2a] cursor-pointer"
            >
              Save changes
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
