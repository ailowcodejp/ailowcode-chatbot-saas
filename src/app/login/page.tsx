import { redirect } from "next/navigation";

import { AuthPageShell } from "@/features/auth/components/auth-page-shell";
import { signInWithPassword } from "@/features/auth/actions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type LoginPageProps = Readonly<{
	searchParams: Promise<{ error?: string; next?: string }>;
}>;

export default async function LoginPage({ searchParams }: LoginPageProps) {
	const supabase = await createClient();
	const {
		data: { session },
	} = await supabase.auth.getSession();

	if (session) {
		redirect("/chat");
	}

	const { error, next } = await searchParams;

	return (
		<AuthPageShell
			mode="login"
			error={error}
			next={next}
			action={signInWithPassword}
		/>
	);
}
