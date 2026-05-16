"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function getStringValue(formData: FormData, key: string) {
	const value = formData.get(key);

	return typeof value === "string" ? value.trim() : "";
}

function sanitizeRedirectPath(value: string) {
	return value.startsWith("/") && !value.startsWith("//") ? value : "/chat";
}

function buildErrorRedirect(path: "/login" | "/signup", code: string) {
	return `${path}?error=${encodeURIComponent(code)}`;
}

async function getSiteOrigin() {
	const headerStore = await headers();
	const host = headerStore.get("host");
	const proto = headerStore.get("x-forwarded-proto") ?? "http";

	return host ? `${proto}://${host}` : "http://127.0.0.1:3000";
}

export async function signInWithPassword(formData: FormData) {
	const email = getStringValue(formData, "email");
	const password = getStringValue(formData, "password");
	const next = sanitizeRedirectPath(getStringValue(formData, "next"));

	if (!email || !password) {
		redirect(buildErrorRedirect("/login", "missing_fields"));
	}

	const supabase = await createClient();
	const { error } = await supabase.auth.signInWithPassword({
		email,
		password,
	});

	if (error) {
		redirect(buildErrorRedirect("/login", "invalid_credentials"));
	}

	redirect(next);
}

export async function signUpWithPassword(formData: FormData) {
	const email = getStringValue(formData, "email");
	const password = getStringValue(formData, "password");
	const confirmPassword = getStringValue(formData, "confirmPassword");
	const next = sanitizeRedirectPath(getStringValue(formData, "next"));

	if (!email || !password || !confirmPassword) {
		redirect(buildErrorRedirect("/signup", "missing_fields"));
	}

	if (password.length < 6) {
		redirect(buildErrorRedirect("/signup", "weak_password"));
	}

	if (password !== confirmPassword) {
		redirect(buildErrorRedirect("/signup", "password_mismatch"));
	}

	const origin = await getSiteOrigin();
	const supabase = await createClient();
	const { error } = await supabase.auth.signUp({
		email,
		password,
		options: {
			emailRedirectTo: `${origin}${next}`,
		},
	});

	if (error) {
		redirect(buildErrorRedirect("/signup", "signup_failed"));
	}

	redirect(next);
}

export async function signOut() {
	const supabase = await createClient();
	await supabase.auth.signOut();

	redirect("/login");
}
