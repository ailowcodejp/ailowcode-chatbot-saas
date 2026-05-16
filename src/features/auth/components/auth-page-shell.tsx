import Link from "next/link";

import { getAuthErrorMessage } from "@/features/auth/messages";

type AuthMode = "login" | "signup";

type AuthPageShellProps = Readonly<{
	mode: AuthMode;
	error?: string;
	next?: string;
	action: (formData: FormData) => Promise<void>;
}>;

const content = {
	login: {
		title: "Welcome back",
		description: "Welcome back! Please enter your details.",
		buttonLabel: "Sign in",
		alternateText: "Don’t have an account?",
		alternateLabel: "Sign up",
		alternateHref: "/signup",
	},
	signup: {
		title: "Create an account",
		description: "Start using AI LowCode Chatbot SaaS today.",
		buttonLabel: "Sign up",
		alternateText: "Already have an account?",
		alternateLabel: "Sign in",
		alternateHref: "/login",
	},
} as const;

function GoogleIcon() {
	return (
		<svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
			<path
				fill="#4285F4"
				d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
			/>
			<path
				fill="#34A853"
				d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
			/>
			<path
				fill="#FBBC05"
				d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
			/>
			<path
				fill="#EA4335"
				d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z"
			/>
		</svg>
	);
}

function BrandMark() {
	return (
		<div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-[#eaecf0] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
			<div className="size-7 rounded-full bg-[#7f56d9] shadow-[0_0_0_8px_rgba(127,86,217,0.12)]" />
		</div>
	);
}

export function AuthPageShell({
	mode,
	error,
	next,
	action,
}: AuthPageShellProps) {
	const current = content[mode];
	const errorMessage = getAuthErrorMessage(error);

	return (
		<main className="grid min-h-screen bg-white text-[#101828] lg:grid-cols-2">
			<section className="relative flex min-h-screen flex-col overflow-hidden px-6 py-8 sm:px-10 lg:px-12">
				<div className="pointer-events-none absolute inset-0 bg-[linear-gradient(#eaecf0_1px,transparent_1px),linear-gradient(90deg,#eaecf0_1px,transparent_1px)] [mask-image:radial-gradient(circle_at_center,black_0%,transparent_72%)] bg-[size:32px_32px] opacity-55" />

				<div className="relative z-10 flex flex-1 items-center justify-center py-10">
					<div className="w-full max-w-[392px]">
						<BrandMark />
						<div className="mt-8 text-center">
							<h1 className="text-3xl leading-[38px] font-semibold tracking-[-0.02em] text-[#101828]">
								{current.title}
							</h1>
							<p className="mt-3 text-base leading-6 text-[#667085]">
								{current.description}
							</p>
						</div>

						{errorMessage ? (
							<div className="mt-6 rounded-lg border border-[#fecdca] bg-[#fef3f2] px-4 py-3 text-sm font-medium text-[#b42318]">
								{errorMessage}
							</div>
						) : null}

						<form action={action} className="mt-8 space-y-5">
							{next ? <input type="hidden" name="next" value={next} /> : null}

							<label className="block">
								<span className="text-sm font-medium text-[#344054]">
									Email
								</span>
								<input
									type="email"
									name="email"
									autoComplete="email"
									required
									placeholder="Enter your email"
									className="mt-1.5 h-12 w-full rounded-lg border border-[#d0d5dd] bg-white px-4 text-base text-[#101828] shadow-[0_1px_2px_rgba(16,24,40,0.05)] outline-none placeholder:text-[#667085] focus:border-[#7f56d9] focus:ring-4 focus:ring-[#f4ebff]"
								/>
							</label>

							<label className="block">
								<span className="text-sm font-medium text-[#344054]">
									Password
								</span>
								<input
									type="password"
									name="password"
									autoComplete={
										mode === "login" ? "current-password" : "new-password"
									}
									required
									minLength={6}
									placeholder="••••••••"
									className="mt-1.5 h-12 w-full rounded-lg border border-[#d0d5dd] bg-white px-4 text-base text-[#101828] shadow-[0_1px_2px_rgba(16,24,40,0.05)] outline-none placeholder:text-[#667085] focus:border-[#7f56d9] focus:ring-4 focus:ring-[#f4ebff]"
								/>
							</label>

							{mode === "signup" ? (
								<label className="block">
									<span className="text-sm font-medium text-[#344054]">
										Confirm password
									</span>
									<input
										type="password"
										name="confirmPassword"
										autoComplete="new-password"
										required
										minLength={6}
										placeholder="••••••••"
										className="mt-1.5 h-12 w-full rounded-lg border border-[#d0d5dd] bg-white px-4 text-base text-[#101828] shadow-[0_1px_2px_rgba(16,24,40,0.05)] outline-none placeholder:text-[#667085] focus:border-[#7f56d9] focus:ring-4 focus:ring-[#f4ebff]"
									/>
								</label>
							) : null}

							{mode === "login" ? (
								<div className="flex items-center justify-between gap-4">
									<label className="flex items-center gap-2 text-sm font-medium text-[#344054]">
										<input
											type="checkbox"
											name="remember"
											className="size-4 rounded border-[#d0d5dd] text-[#7f56d9] focus:ring-[#d6bbfb]"
										/>
										Remember for 30 days
									</label>
									<Link
										href="/login"
										className="text-sm font-semibold text-[#7f56d9] hover:text-[#6941c6]"
									>
										Forgot password
									</Link>
								</div>
							) : null}

							<button
								type="submit"
								className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#7f56d9] px-4 text-base font-semibold text-white shadow-[0_1px_2px_rgba(16,24,40,0.05)] hover:bg-[#6941c6] focus:ring-4 focus:ring-[#f4ebff] focus:outline-none"
							>
								{current.buttonLabel}
							</button>
						</form>

						<button
							type="button"
							disabled
							className="mt-4 inline-flex h-12 w-full cursor-not-allowed items-center justify-center gap-3 rounded-lg border border-[#d0d5dd] bg-white px-4 text-base font-semibold text-[#344054] opacity-70 shadow-[0_1px_2px_rgba(16,24,40,0.05)]"
							title="Google OAuth はプロバイダー設定後に有効化します"
						>
							<GoogleIcon />
							{mode === "login" ? "Sign in" : "Sign up"} with Google
						</button>

						<p className="mt-8 text-center text-sm text-[#667085]">
							{current.alternateText}{" "}
							<Link
								href={current.alternateHref}
								className="font-semibold text-[#7f56d9] hover:text-[#6941c6]"
							>
								{current.alternateLabel}
							</Link>
						</p>
					</div>
				</div>

				<p className="relative z-10 text-sm font-medium text-[#667085]">
					© AI LowCode Chatbot SaaS
				</p>
			</section>

			<section className="relative hidden min-h-screen overflow-hidden bg-[#f2f4f7] lg:block">
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_18%,rgba(127,86,217,0.36),transparent_24%),radial-gradient(circle_at_78%_84%,rgba(127,86,217,0.24),transparent_30%)]" />
				<div className="absolute top-[-12%] left-[8%] h-[760px] w-[340px] rotate-[18deg] rounded-[999px] border border-white/70 bg-white/35 shadow-[inset_0_0_36px_rgba(255,255,255,0.7),0_24px_72px_rgba(16,24,40,0.16)] backdrop-blur-sm" />
				<div className="absolute top-[18%] right-[-10%] h-[620px] w-[280px] rotate-[32deg] rounded-[999px] border border-white/70 bg-white/40 shadow-[inset_0_0_34px_rgba(255,255,255,0.8),0_20px_64px_rgba(16,24,40,0.14)] backdrop-blur-sm" />
				<div className="absolute bottom-[-18%] left-[4%] h-[420px] w-[620px] rotate-[-9deg] rounded-[999px] border border-white/70 bg-white/30 shadow-[inset_0_0_34px_rgba(255,255,255,0.72),0_20px_64px_rgba(16,24,40,0.12)] backdrop-blur-sm" />
			</section>
		</main>
	);
}
