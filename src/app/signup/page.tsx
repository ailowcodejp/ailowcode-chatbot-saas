import { redirect } from "next/navigation";

import { signUpWithPassword } from "@/features/auth/actions";
import { AuthPageShell } from "@/features/auth/components/auth-page-shell";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SignupPageProps = Readonly<{
	searchParams: Promise<{ error?: string; next?: string }>;
}>;

export default async function SignupPage({ searchParams }: SignupPageProps) {
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
			mode="signup"
			error={error}
			next={next}
			action={signUpWithPassword}
		/>
	);
}
