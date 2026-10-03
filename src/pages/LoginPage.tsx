import { useState } from "react";
import { login } from "../api";

interface Props {
	onLogin: () => void;
}

export default function LoginPage({ onLogin }: Props) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError("");

		if (!email.trim() || !password) {
			setError("All fields are required.");
			return;
		}

		try {
			setLoading(true);

			await login(email.trim(), password);

			onLogin();
		} catch (error) {
			setError(
				error instanceof Error
					? error.message
					: "Unable to sign in.",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div
			className="h-full flex"
			style={{ fontFamily: "'Inter', sans-serif" }}
		>
			{/* Left panel */}
			<div className="w-1/2 bg-[#0a0a0a] flex flex-col justify-between p-12">
				<div>
					<div
						className="text-white text-xs tracking-[0.25em] uppercase mb-1"
						style={{
							fontFamily: "'JetBrains Mono', monospace",
						}}
					>
						Accountants
					</div>

					<div
						className="text-white text-xs tracking-[0.25em] uppercase"
						style={{
							fontFamily: "'JetBrains Mono', monospace",
						}}
					>
						Anonymous
					</div>
				</div>

				<div>
					<p
						className="text-[#6b6b6b] text-xs leading-relaxed max-w-xs"
						style={{
							fontFamily: "'JetBrains Mono', monospace",
						}}
					>
						"The first step is admitting you have a balance sheet."
					</p>

					<p
						className="text-[#3a3a3a] text-xs mt-3"
						style={{
							fontFamily: "'JetBrains Mono', monospace",
						}}
					>
						— A. Anonymous, CPA
					</p>
				</div>

				<div className="border-t border-[#2a2a2a] pt-6">
					<div className="grid grid-cols-2 gap-4">
						{[
							{ label: "Active clients", value: "312" },
							{ label: "Fiscal year", value: "2026" },
							{ label: "Entries logged", value: "14,809" },
							{ label: "Net balance", value: "$2.4M" },
						].map((stat) => (
							<div key={stat.label}>
								<div
									className="text-[#6b6b6b] text-xs"
									style={{
										fontFamily:
											"'JetBrains Mono', monospace",
									}}
								>
									{stat.label}
								</div>

								<div
									className="text-white text-sm font-medium mt-0.5"
									style={{
										fontFamily:
											"'JetBrains Mono', monospace",
									}}
								>
									{stat.value}
								</div>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Right panel */}
			<div className="w-1/2 flex items-center justify-center bg-white px-12">
				<div className="w-full max-w-sm">
					<h1 className="text-2xl font-semibold text-[#0a0a0a] mb-1">
						Sign in
					</h1>

					<p className="text-sm text-[#6b6b6b] mb-8">
						Access your accounting workspace.
					</p>

					<form
						onSubmit={handleSubmit}
						className="flex flex-col gap-5"
					>
						<div>
							<label
								htmlFor="email"
								className="block text-xs text-[#0a0a0a] mb-1.5 tracking-wide uppercase"
								style={{
									fontFamily:
										"'JetBrains Mono', monospace",
								}}
							>
								Email
							</label>

							<input
								id="email"
								name="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								autoComplete="email"
								placeholder="you@firm.com"
								disabled={loading}
								className="w-full border border-[#d0d0d0] px-3 py-2.5 text-sm text-[#0a0a0a] placeholder-[#b0b0b0] outline-none focus:border-[#0a0a0a] transition-colors disabled:bg-[#f5f5f5] disabled:cursor-not-allowed"
							/>
						</div>

						<div>
							<label
								htmlFor="password"
								className="block text-xs text-[#0a0a0a] mb-1.5 tracking-wide uppercase"
								style={{
									fontFamily:
										"'JetBrains Mono', monospace",
								}}
							>
								Password
							</label>

							<input
								id="password"
								name="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								autoComplete="current-password"
								placeholder="••••••••"
								disabled={loading}
								className="w-full border border-[#d0d0d0] px-3 py-2.5 text-sm text-[#0a0a0a] placeholder-[#b0b0b0] outline-none focus:border-[#0a0a0a] transition-colors disabled:bg-[#f5f5f5] disabled:cursor-not-allowed"
							/>
						</div>

						{error && (
							<p
								role="alert"
								className="text-xs text-red-600"
								style={{
									fontFamily:
										"'JetBrains Mono', monospace",
								}}
							>
								{error}
							</p>
						)}

						<button
							type="submit"
							disabled={loading}
							className="bg-[#0a0a0a] text-white text-sm py-3 hover:bg-[#2a2a2a] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
						>
							{loading ? "Signing in..." : "Sign in"}
						</button>
					</form>

					<p className="mt-6 text-xs text-[#b0b0b0]">
						Forgot your password?{" "}
						<button
							type="button"
							onClick={() => {
								// Add password-reset navigation or API call here.
							}}
							className="text-[#0a0a0a] underline underline-offset-2 cursor-pointer hover:text-[#6b6b6b] transition-colors"
						>
							Reset it
						</button>
					</p>
				</div>
			</div>
		</div>
	);
}
