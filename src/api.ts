type LoginResponse = {
	success: boolean;
	user?: {
		id: string;
		email: string;
	};
	error?: string;
};

async function parseJsonResponse<T>(response: Response): Promise<T> {
	const text = await response.text();

	if (!text) {
		return {} as T;
	}

	const trimmed = text.trim();
	if (
		response.headers.get("content-type")?.includes("application/json") ||
		trimmed.startsWith("{") ||
		trimmed.startsWith("[")
	) {
		return JSON.parse(trimmed) as T;
	}

	throw new Error(trimmed || "Unable to sign in.");
}

export async function login(
	email: string,
	password: string,
): Promise<LoginResponse> {
	const response = await fetch("/api/auth/login", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		credentials: "include",
		body: JSON.stringify({
			email,
			password,
		}),
	});

	let data: LoginResponse;

	try {
		data = await parseJsonResponse<LoginResponse>(response);
	} catch (error) {
		if (error instanceof Error) {
			throw error;
		}
		throw new Error("Unable to sign in.");
	}

	if (!response.ok) {
		throw new Error(data.error ?? "Unable to sign in.");
	}

	return data;
}

export async function getCurrentUser() {
	const response = await fetch("/api/auth/me", {
		method: "GET",
		credentials: "include",
	});

	if (response.status === 401) {
		return null;
	}

	if (!response.ok) {
		throw new Error("Unable to load the current user.");
	}

	return response.json();
}

export async function logout() {
	const response = await fetch("/api/auth/logout", {
		method: "POST",
		credentials: "include",
	});

	if (!response.ok) {
		throw new Error("Unable to log out.");
	}
}
