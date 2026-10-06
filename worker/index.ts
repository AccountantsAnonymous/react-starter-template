import { Hono } from "hono";
import { fromHono } from "chanfana";

type Bindings = Env & {
	DB: D1Database;
};

type LoginBody = {
	email?: string;
	password?: string;
};

type UserRecord = {
	user_id: number;
	username: string;
	email: string;
	first_name: string;
	last_name: string;
	status: string;
};

async function hashPassword(password: string): Promise<string> {
	const data = new TextEncoder().encode(password);
	const hash = await crypto.subtle.digest("SHA-256", data);
	return Array.from(new Uint8Array(hash))
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
}

const app = new Hono<{ Bindings: Bindings }>();

const openapi = fromHono(app, {
	docs_url: "/",
	schema: {
		info: {
			title: "Accountants API",
			version: "1.0.0",
			description: "Accountants application API",
		},
	},
});

openapi.get("/api/health", (c) => {
	return c.json({
		ok: true,
		message: "API is working",
	});
});

openapi.post("/api/auth/login", async (c) => {
	let body: LoginBody;

	try {
		body = (await c.req.json()) as LoginBody;
	} catch {
		return c.json(
			{
				success: false,
				error: "Request body must be valid JSON.",
			},
			400,
		);
	}

	const email = body.email?.toLowerCase().trim();
	const password = body.password;

	if (!email || !password) {
		return c.json(
			{
				success: false,
				error: "Email and password are required.",
			},
			400,
		);
	}

	if (!c.env.DB) {
		return c.json(
			{
				success: false,
				error: "Database is not configured for this environment.",
			},
			500,
		);
	}

	const user = (await c.env.DB.prepare(
		`SELECT user_id, username, email, first_name, last_name, status
		 FROM users
		 WHERE LOWER(email) = ?
		 LIMIT 1`,
	).bind(email).first()) as UserRecord | null;

	if (!user) {
		await c.env.DB.prepare(
			`INSERT INTO login_attempts (username, success, ip_address, user_agent)
			 VALUES (?, 0, ?, ?)`,
		)
			.bind(email, c.req.header("CF-Connecting-IP") ?? "unknown", c.req.header("User-Agent") ?? "unknown")
			.run();

		return c.json(
			{
				success: false,
				error: "Invalid email or password.",
			},
			401,
		);
	}

	if (user.status !== "active") {
		await c.env.DB.prepare(
			`INSERT INTO login_attempts (user_id, username, success, ip_address, user_agent)
			 VALUES (?, ?, 0, ?, ?)`,
		)
			.bind(user.user_id, user.username, c.req.header("CF-Connecting-IP") ?? "unknown", c.req.header("User-Agent") ?? "unknown")
			.run();

		return c.json(
			{
				success: false,
				error: "This account is not active.",
			},
			403,
		);
	}

	const passwordRecord = (await c.env.DB.prepare(
		`SELECT encrypted_password
		 FROM passwords
		 WHERE user_id = ?
		 AND is_current = 1
		 AND expires_at > datetime('now')
		 ORDER BY created_at DESC
		 LIMIT 1`,
	).bind(user.user_id).first()) as { encrypted_password: string } | null;

	const passwordHash = await hashPassword(password);
	const passwordMatches = passwordRecord?.encrypted_password === passwordHash;

	await c.env.DB.prepare(
		`INSERT INTO login_attempts (user_id, username, success, ip_address, user_agent)
		 VALUES (?, ?, ?, ?, ?)`,
	)
		.bind(
			user.user_id,
			user.username,
			passwordMatches ? 1 : 0,
			c.req.header("CF-Connecting-IP") ?? "unknown",
			c.req.header("User-Agent") ?? "unknown",
		)
		.run();

	if (!passwordMatches || !passwordRecord) {
		return c.json(
			{
				success: false,
				error: "Invalid email or password.",
			},
			401,
		);
	}

	const sessionId = crypto.randomUUID();
	const cookie = [
		`session=${sessionId}`,
		"HttpOnly",
		"Secure",
		"SameSite=Lax",
		"Path=/",
		"Max-Age=604800",
	].join("; ");

	return c.json(
		{
			success: true,
			user: {
				id: String(user.user_id),
				email: user.email,
				firstName: user.first_name,
				lastName: user.last_name,
			},
		},
		200,
		{
			"Set-Cookie": cookie,
		},
	);
});

export default app;
