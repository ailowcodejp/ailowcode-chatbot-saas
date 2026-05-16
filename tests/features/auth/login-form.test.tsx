import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LoginForm } from "@/features/auth/components/login-form";

const loginMock = vi.fn();

vi.mock("@/features/auth/actions", () => ({
	login: (formData: FormData) => loginMock(formData),
}));

describe("LoginForm", () => {
	beforeEach(() => {
		loginMock.mockClear();
	});

	it("renders email and password inputs", () => {
		render(<LoginForm />);
		expect(screen.getByLabelText("メールアドレス")).toBeInTheDocument();
		expect(screen.getByLabelText("パスワード")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "ログイン" }),
		).toBeInTheDocument();
	});

	it("submits form with user input", async () => {
		const user = userEvent.setup();
		loginMock.mockResolvedValueOnce(undefined);

		render(<LoginForm />);

		await user.type(
			screen.getByLabelText("メールアドレス"),
			"test@example.com",
		);
		await user.type(screen.getByLabelText("パスワード"), "password123");
		await user.click(screen.getByRole("button", { name: "ログイン" }));

		await waitFor(() => {
			expect(loginMock).toHaveBeenCalledOnce();
		});

		const formData = loginMock.mock.calls[0][0] as FormData;
		expect(formData.get("email")).toBe("test@example.com");
		expect(formData.get("password")).toBe("password123");
	});

	it("displays error message on login failure", async () => {
		const user = userEvent.setup();
		loginMock.mockResolvedValueOnce({ error: "Invalid credentials" });

		render(<LoginForm />);

		await user.type(
			screen.getByLabelText("メールアドレス"),
			"test@example.com",
		);
		await user.type(screen.getByLabelText("パスワード"), "wrongpass");
		await user.click(screen.getByRole("button", { name: "ログイン" }));

		await waitFor(() => {
			expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
		});
	});
});
