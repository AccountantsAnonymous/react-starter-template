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
	id: string;
	email: string;
	password_hash: string;
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

	const query = c.env.DB.prepare(
		`SELECT id, email, password_hash
		 FROM users
		 WHERE email = ?`,
	).bind(email);

	const user = (await query.first()) as UserRecord | null;

	if (!user) {
		return c.json(
			{
				success: false,
				error: "Invalid email or password.",
			},
			401,
		);
	}

	// Temporary comparison only.
	// Replace with bcrypt, Argon2id, scrypt, or an auth provider.
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
				id: user.id,
				email: user.email,
			},
		},
		200,
		{
			"Set-Cookie": cookie,
		},
	);
});

export default app;
