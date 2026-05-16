import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { LogoutButton } from "@/features/auth/components/logout-button";

const logoutMock = vi.fn();

vi.mock("@/features/auth/actions", () => ({
	logout: () => logoutMock(),
}));

describe("LogoutButton", () => {
	it("renders logout button", () => {
		render(<LogoutButton />);
		expect(
			screen.getByRole("button", { name: "ログアウト" }),
		).toBeInTheDocument();
	});
});
