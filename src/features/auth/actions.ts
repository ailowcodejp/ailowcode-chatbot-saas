"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { routes } from "@/config/routes";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, signupSchema } from "@/features/auth/validations";

export async function login(formData: FormData) {
	const data = Object.fromEntries(formData);
	const parsed = loginSchema.safeParse(data);

	if (!parsed.success) {
		return { error: "メールアドレスまたはパスワードの形式が正しくありません" };
	}

	const supabase = await createClient();
	const { error } = await supabase.auth.signInWithPassword({
		email: parsed.data.email,
		password: parsed.data.password,
	});

	if (error) {
		return { error: error.message };
	}

	revalidatePath(routes.home, "layout");
	redirect(routes.chat);
}

export async function signup(formData: FormData) {
	const data = Object.fromEntries(formData);
	const parsed = signupSchema.safeParse(data);

	if (!parsed.success) {
		return { error: "メールアドレスまたはパスワードの形式が正しくありません" };
	}

	const supabase = await createClient();
	const { error } = await supabase.auth.signUp({
		email: parsed.data.email,
		password: parsed.data.password,
	});

	if (error) {
		return { error: error.message };
	}

	revalidatePath(routes.home, "layout");
	redirect(routes.chat);
}

export async function logout() {
	const supabase = await createClient();
	await supabase.auth.signOut();
	redirect(routes.login);
}
