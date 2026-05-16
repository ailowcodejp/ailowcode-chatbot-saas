import { LoginForm } from "@/features/auth/components/login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
	return (
		<main className="bg-background text-foreground flex min-h-screen items-center justify-center px-6">
			<LoginForm />
		</main>
	);
}
