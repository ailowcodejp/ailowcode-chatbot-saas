import { describe, it, expect } from "vitest";

import { loginSchema, signupSchema } from "@/features/auth/validations";

describe("auth validations", () => {
	describe("loginSchema", () => {
		it("accepts valid email and password", () => {
			const result = loginSchema.safeParse({
				email: "user@example.com",
				password: "password123",
			});
			expect(result.success).toBe(true);
		});

		it("rejects invalid email", () => {
			const result = loginSchema.safeParse({
				email: "not-an-email",
				password: "password123",
			});
			expect(result.success).toBe(false);
		});

		it("rejects short password", () => {
			const result = loginSchema.safeParse({
				email: "user@example.com",
				password: "12345",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("signupSchema", () => {
		it("accepts valid email and password", () => {
			const result = signupSchema.safeParse({
				email: "user@example.com",
				password: "password123",
			});
			expect(result.success).toBe(true);
		});

		it("rejects invalid email", () => {
			const result = signupSchema.safeParse({
				email: "bad-email",
				password: "password123",
			});
			expect(result.success).toBe(false);
		});

		it("rejects short password", () => {
			const result = signupSchema.safeParse({
				email: "user@example.com",
				password: "short",
			});
			expect(result.success).toBe(false);
		});
	});
});
