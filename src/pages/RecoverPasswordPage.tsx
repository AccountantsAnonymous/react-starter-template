import { useState } from "react";
import AuthLayout from "../components/AuthLayout.tsx";

interface Props {
  onBackToLogin: () => void;
}

export default function RecoverPasswordPage({ onBackToLogin }: Props) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email) {
      setError("Enter the email associated with your account.");
      return;
    }
    setError("");
    setSent(true);
  };

  return (
    <AuthLayout
      eyebrow="Secure access"
      quote="Every discrepancy has a source. Every account has a way back in."
      attribution="Internal controls manual"
    >
      <button
        type="button"
        onClick={onBackToLogin}
        className="mb-8 text-xs text-[#6b6b6b] hover:text-[#0a0a0a] transition-colors cursor-pointer font-mono"
      >
        ← Back to sign in
      </button>
      <h1 className="text-2xl font-semibold text-[#0a0a0a] mb-1">Recover password</h1>
      <p className="text-sm text-[#6b6b6b] mb-8">
        We’ll send reset instructions to your work email.
      </p>

      {sent ? (
        <div>
          <div className="border border-[#0a0a0a] p-5 mb-6">
            <div className="text-xs uppercase tracking-wider font-mono text-[#0a0a0a] mb-2">
              Instructions sent
            </div>
            <p className="text-sm text-[#6b6b6b] leading-relaxed">
              If an account exists for <span className="text-[#0a0a0a]">{email}</span>, a reset link is
              on its way. Check your inbox and spam folder.
            </p>
          </div>
          <button
            type="button"
            onClick={onBackToLogin}
            className="w-full bg-[#0a0a0a] text-white text-sm py-3 hover:bg-[#2a2a2a] transition-colors cursor-pointer"
          >
            Return to sign in
          </button>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="w-full text-xs text-[#6b6b6b] mt-4 hover:text-[#0a0a0a] cursor-pointer"
          >
            Try another email
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-xs text-[#0a0a0a] mb-1.5 tracking-wide uppercase font-mono">
              Work email
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@firm.com"
              autoFocus
              className="w-full border border-[#d0d0d0] px-3 py-2.5 text-sm outline-none focus:border-[#0a0a0a] transition-colors"
            />
          </div>
          {error && <p className="text-xs text-[#0a0a0a] font-mono border-l-2 border-[#0a0a0a] pl-3">{error}</p>}
          <button
            type="submit"
            className="bg-[#0a0a0a] text-white text-sm py-3 hover:bg-[#2a2a2a] transition-colors cursor-pointer"
          >
            Send reset instructions
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
