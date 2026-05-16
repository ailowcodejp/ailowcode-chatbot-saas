import { SignupForm } from "@/features/auth/components/signup-form";

export const dynamic = "force-dynamic";

export default function SignupPage() {
	return (
		<main className="bg-background text-foreground flex min-h-screen items-center justify-center px-6">
			<SignupForm />
		</main>
	);
}
