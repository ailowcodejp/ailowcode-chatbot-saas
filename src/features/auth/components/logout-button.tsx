"use client";

import { logout } from "@/features/auth/actions";

export function LogoutButton() {
	return (
		<form action={logout}>
			<button
				type="submit"
				className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium"
			>
				ログアウト
			</button>
		</form>
	);
}
