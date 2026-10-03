// workers/index.ts

import { Hono } from "hono";
import { fromHono } from "chanfana";

type Bindings = Env & {
	DB: D1Database;
};

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

/**
 * GET /api/health
 */
openapi.get("/api/health", (c) => {
	return c.json({
		ok: true,
		message: "API is working",
	});
});

/**
 * POST /api/auth/login
 */
openapi.post("/api/auth/login", async (c) => {
	let body: {
		email?: string;
		password?: string;
	};

	try {
		body = await c.req.json();
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

	const user = await c.env.DB.prepare(
		`SELECT id, email, password_hash
		 FROM users
		 WHERE email = ?`,
	)
		.bind(email)
		.first<{
			id: string;
			email: string;
			password_hash: string;
		}>();

	if (!user) {
		return c.json(
			{
				success: false,
				error: "Invalid email or password.",
			},
			401,
		);
	}

	// Replace this with real password-hash verification.
	const passwordMatches = password === user.password_hash;

	if (!passwordMatches) {
		return c.json(
			{
				success: false,
				error: "Invalid email or password.",
			},
			401,
		);
	}

	const sessionId = crypto.randomUUID();

	await c.env.DB.prepare(
		`INSERT INTO sessions (id, user_id, expires_at)
		 VALUES (?, ?, datetime('now', '+7 days'))`,
	)
		.bind(sessionId, user.id)
		.run();

	return c.json(
		{
			success: true,
			user: {
				id: user.id,
				email: user.email,
			},
		},
		200,
		{
			"Set-Cookie": [
				`session=${sessionId}`,
				"HttpOnly",
				"Secure",
				"SameSite=Lax",
				"Path=/",
				"Max-Age=604800",
			].join("; "),
		},
	);
});

export default app;
