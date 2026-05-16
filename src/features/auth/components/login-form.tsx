"use client";

import { useState } from "react";
import Link from "next/link";

import { login } from "@/features/auth/actions";

export function LoginForm() {
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(formData: FormData) {
		setError(null);
		const result = await login(formData);
		if (result?.error) {
			setError(result.error);
		}
	}

	return (
		<form action={handleSubmit} className="w-full max-w-sm space-y-4">
			<h1 className="text-2xl font-semibold">ログイン</h1>
			<div>
				<label htmlFor="email" className="block text-sm font-medium">
					メールアドレス
				</label>
				<input
					id="email"
					name="email"
					type="email"
					required
					className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2"
				/>
			</div>
			<div>
				<label htmlFor="password" className="block text-sm font-medium">
					パスワード
				</label>
				<input
					id="password"
					name="password"
					type="password"
					required
					minLength={6}
					className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2"
				/>
			</div>
			{error && <p className="text-sm text-red-600">{error}</p>}
			<button
				type="submit"
				className="w-full rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white"
			>
				ログイン
			</button>
			<p className="text-center text-sm">
				アカウントをお持ちでないですか？{" "}
				<Link href="/signup" className="underline">
					サインアップ
				</Link>
			</p>
		</form>
	);
}
