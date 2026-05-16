"use client";

import { useState } from "react";
import Link from "next/link";

import { signup } from "@/features/auth/actions";

export function SignupForm() {
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(formData: FormData) {
		setError(null);
		const result = await signup(formData);
		if (result?.error) {
			setError(result.error);
		}
	}

	return (
		<form action={handleSubmit} className="w-full max-w-sm space-y-4">
			<h1 className="text-2xl font-semibold">サインアップ</h1>
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
				アカウント作成
			</button>
			<p className="text-center text-sm">
				既にアカウントをお持ちですか？{" "}
				<Link href="/login" className="underline">
					ログイン
				</Link>
			</p>
		</form>
	);
}
