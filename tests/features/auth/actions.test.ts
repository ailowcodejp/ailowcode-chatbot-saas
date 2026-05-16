import { describe, it, expect, vi } from "vitest";

import { login, signup, logout } from "@/features/auth/actions";

const signInWithPasswordMock = vi.fn();
const signUpMock = vi.fn();
const signOutMock = vi.fn();
const getSessionMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(() =>
		Promise.resolve({
			auth: {
				signInWithPassword: signInWithPasswordMock,
				signUp: signUpMock,
				signOut: signOutMock,
				getSession: getSessionMock,
			},
		}),
	),
}));

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	redirect: vi.fn(),
}));

describe("auth actions", () => {
	it("login redirects to chat on success", async () => {
		signInWithPasswordMock.mockResolvedValueOnce({ error: null });

		const formData = new FormData();
		formData.set("email", "test@example.com");
		formData.set("password", "password123");

		await login(formData);

		expect(signInWithPasswordMock).toHaveBeenCalledWith({
			email: "test@example.com",
			password: "password123",
		});
	});

	it("login returns error on failure", async () => {
		signInWithPasswordMock.mockResolvedValueOnce({
			error: { message: "Invalid credentials" },
		});

		const formData = new FormData();
		formData.set("email", "test@example.com");
		formData.set("password", "wrongpass");

		const result = await login(formData);

		expect(result).toEqual({ error: "Invalid credentials" });
	});

	it("signup redirects to chat on success", async () => {
		signUpMock.mockResolvedValueOnce({ error: null });

		const formData = new FormData();
		formData.set("email", "test@example.com");
		formData.set("password", "password123");

		await signup(formData);

		expect(signUpMock).toHaveBeenCalledWith({
			email: "test@example.com",
			password: "password123",
		});
	});

	it("logout calls signOut and redirects", async () => {
		signOutMock.mockResolvedValueOnce({});

		await logout();

		expect(signOutMock).toHaveBeenCalledOnce();
	});
});
