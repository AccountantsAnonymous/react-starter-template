import { useState } from "react";
import AuthLayout from "../components/AuthLayout.tsx";

interface Props {
  onCreateAccount: () => void;
  onBackToLogin: () => void;
}

export default function CreateAccountPage({ onCreateAccount, onBackToLogin }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name || !email || !password || !confirmation) {
      setError("All fields are required.");
      return;
    }
    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }
    if (!accepted) {
      setError("Please accept the workspace terms.");
      return;
    }
    setError("");
    onCreateAccount();
  };

  return (
    <AuthLayout
      eyebrow="A clean start"
      quote="Good books do not happen by accident. They happen by process."
      attribution="The closing checklist"
    >
      <button
        type="button"
        onClick={onBackToLogin}
        className="mb-8 text-xs text-[#6b6b6b] hover:text-[#0a0a0a] transition-colors cursor-pointer"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        ← Back to sign in
      </button>
      <h1 className="text-2xl font-semibold text-[#0a0a0a] mb-1">Create an account</h1>
      <p className="text-sm text-[#6b6b6b] mb-8">Set up your accounting workspace.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs text-[#0a0a0a] mb-1.5 tracking-wide uppercase font-mono">
            Full name
          </label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Morgan Chen"
            className="w-full border border-[#d0d0d0] px-3 py-2.5 text-sm outline-none focus:border-[#0a0a0a] transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-[#0a0a0a] mb-1.5 tracking-wide uppercase font-mono">
            Work email
          </label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@firm.com"
            className="w-full border border-[#d0d0d0] px-3 py-2.5 text-sm outline-none focus:border-[#0a0a0a] transition-colors"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#0a0a0a] mb-1.5 tracking-wide uppercase font-mono">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="w-full border border-[#d0d0d0] px-3 py-2.5 text-sm outline-none focus:border-[#0a0a0a] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-[#0a0a0a] mb-1.5 tracking-wide uppercase font-mono">
              Confirm
            </label>
            <input
              type="password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder="••••••••"
              className="w-full border border-[#d0d0d0] px-3 py-2.5 text-sm outline-none focus:border-[#0a0a0a] transition-colors"
            />
          </div>
        </div>
        <label className="flex items-start gap-3 text-xs text-[#6b6b6b] leading-relaxed cursor-pointer">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
            className="mt-0.5 accent-[#0a0a0a]"
          />
          <span>I agree to the workspace terms and acknowledge the data handling policy.</span>
        </label>
        {error && <p className="text-xs text-[#0a0a0a] font-mono border-l-2 border-[#0a0a0a] pl-3">{error}</p>}
        <button
          type="submit"
          className="bg-[#0a0a0a] text-white text-sm py-3 mt-1 hover:bg-[#2a2a2a] transition-colors cursor-pointer"
        >
          Create workspace
        </button>
      </form>
      <p className="mt-6 text-xs text-[#b0b0b0]">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onBackToLogin}
          className="text-[#0a0a0a] underline underline-offset-2 cursor-pointer hover:text-[#6b6b6b]"
        >
          Sign in
        </button>
      </p>
    </AuthLayout>
  );
}
