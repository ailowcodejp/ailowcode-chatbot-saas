"use client";

import { useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database.types";

type BillingSubscription =
	Database["public"]["Tables"]["billing_subscriptions"]["Row"];
type CreditBalance = Database["public"]["Tables"]["credit_balances"]["Row"];

type BillingPlan = {
	id: string;
	name: string;
	description: string;
};

type PlansResponse = {
	plans: BillingPlan[];
};

function formatDate(value: string | null) {
	if (!value) {
		return "-";
	}

	return new Intl.DateTimeFormat("ja-JP", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(new Date(value));
}

async function readFunctionError(error: unknown) {
	if (
		typeof error !== "object" ||
		error === null ||
		!("context" in error) ||
		!(error.context instanceof Response)
	) {
		return null;
	}

	try {
		const body = (await error.context.clone().json()) as { error?: unknown };
		return typeof body.error === "string" ? body.error : null;
	} catch {
		return null;
	}
}

function getErrorMessage(error: unknown) {
	if (error instanceof Error && error.message === "not_authenticated") {
		return "ログイン後に課金機能を利用できます。";
	}

	if (
		error instanceof Error &&
		error.message === "billing_customer_not_found"
	) {
		return "先にCheckoutでサブスクリプションを開始してください。";
	}

	return "課金情報を処理できませんでした。時間をおいて再度お試しください。";
}

export function BillingPanel() {
	const [plans, setPlans] = useState<BillingPlan[]>([]);
	const [subscription, setSubscription] = useState<BillingSubscription | null>(
		null,
	);
	const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const activeSubscription = useMemo(() => {
		return subscription &&
			["active", "trialing", "past_due"].includes(subscription.status)
			? subscription
			: null;
	}, [subscription]);

	useEffect(() => {
		let isMounted = true;

		async function loadBillingState() {
			setIsLoading(true);
			setErrorMessage(null);

			try {
				const [plansResponse, supabase] = await Promise.all([
					fetch("/api/billing/plans").then((response) => {
						if (!response.ok) {
							throw new Error("plans_load_failed");
						}

						return response.json() as Promise<PlansResponse>;
					}),
					Promise.resolve(createClient()),
				]);

				const {
					data: { session },
				} = await supabase.auth.getSession();

				if (!session) {
					throw new Error("not_authenticated");
				}

				const [{ data: subscriptions }, { data: balance }] = await Promise.all([
					supabase
						.from("billing_subscriptions")
						.select("*")
						.order("created_at", { ascending: false })
						.limit(1),
					supabase.from("credit_balances").select("*").maybeSingle(),
				]);

				if (!isMounted) {
					return;
				}

				setPlans(plansResponse.plans);
				setSubscription(subscriptions?.[0] ?? null);
				setCreditBalance(balance ?? null);
			} catch (error) {
				if (isMounted) {
					setErrorMessage(getErrorMessage(error));
				}
			} finally {
				if (isMounted) {
					setIsLoading(false);
				}
			}
		}

		void loadBillingState();

		return () => {
			isMounted = false;
		};
	}, []);

	const startCheckout = async (priceId: string) => {
		setIsSubmitting(true);
		setErrorMessage(null);

		try {
			const supabase = createClient();
			const { data, error } = await supabase.functions.invoke<{ url: string }>(
				"create-billing-checkout-session",
				{
					body: {
						priceId,
						successUrl: `${window.location.origin}/billing?checkout=success`,
						cancelUrl: `${window.location.origin}/billing?checkout=cancelled`,
					},
				},
			);

			if (error) {
				throw new Error((await readFunctionError(error)) ?? "checkout_failed");
			}

			if (!data?.url) {
				throw new Error("checkout_url_missing");
			}

			window.location.assign(data.url);
		} catch (error) {
			setErrorMessage(getErrorMessage(error));
			setIsSubmitting(false);
		}
	};

	const openPortal = async () => {
		setIsSubmitting(true);
		setErrorMessage(null);

		try {
			const supabase = createClient();
			const { data, error } = await supabase.functions.invoke<{ url: string }>(
				"create-billing-portal-session",
				{
					body: {
						returnUrl: `${window.location.origin}/billing`,
					},
				},
			);

			if (error) {
				throw new Error((await readFunctionError(error)) ?? "portal_failed");
			}

			if (!data?.url) {
				throw new Error("portal_url_missing");
			}

			window.location.assign(data.url);
		} catch (error) {
			setErrorMessage(getErrorMessage(error));
			setIsSubmitting(false);
		}
	};

	return (
		<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
			<section className="border border-zinc-200 bg-white">
				<div className="border-b border-zinc-200 px-5 py-4">
					<h2 className="text-base font-semibold">サブスクリプション</h2>
				</div>
				<div className="space-y-4 p-5">
					{errorMessage ? (
						<p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
							{errorMessage}
						</p>
					) : null}
					{isLoading ? (
						<p className="text-sm text-zinc-500">
							課金情報を読み込んでいます。
						</p>
					) : (
						<>
							<div className="grid gap-3 sm:grid-cols-2">
								{plans.map((plan) => (
									<div key={plan.id} className="border border-zinc-200 p-4">
										<div className="flex min-h-9 items-start justify-between gap-3">
											<h3 className="text-sm font-semibold">{plan.name}</h3>
											<span className="text-xs text-zinc-500">
												{plan.id.slice(0, 18)}
											</span>
										</div>
										<p className="mt-2 min-h-10 text-sm leading-5 text-zinc-600">
											{plan.description}
										</p>
										<button
											type="button"
											onClick={() => void startCheckout(plan.id)}
											disabled={isSubmitting}
											className="mt-4 h-10 w-full rounded-md bg-zinc-950 px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
										>
											Checkoutへ進む
										</button>
									</div>
								))}
							</div>
							{plans.length === 0 ? (
								<p className="text-sm text-zinc-500">
									Stripe Price ID が設定されていません。
								</p>
							) : null}
						</>
					)}
				</div>
			</section>

			<aside className="space-y-6">
				<section className="border border-zinc-200 bg-white">
					<div className="border-b border-zinc-200 px-5 py-4">
						<h2 className="text-base font-semibold">現在の状態</h2>
					</div>
					<div className="space-y-3 p-5 text-sm">
						<div className="flex justify-between gap-4">
							<span className="text-zinc-500">ステータス</span>
							<span className="font-medium">
								{subscription?.status ?? "free"}
							</span>
						</div>
						<div className="flex justify-between gap-4">
							<span className="text-zinc-500">プラン</span>
							<span className="font-medium">
								{subscription?.plan ?? "free"}
							</span>
						</div>
						<div className="flex justify-between gap-4">
							<span className="text-zinc-500">更新日</span>
							<span className="font-medium">
								{formatDate(subscription?.current_period_end ?? null)}
							</span>
						</div>
						<div className="flex justify-between gap-4">
							<span className="text-zinc-500">クレジット</span>
							<span className="font-medium">{creditBalance?.balance ?? 0}</span>
						</div>
						<button
							type="button"
							onClick={() => void openPortal()}
							disabled={isSubmitting || !activeSubscription}
							className="mt-3 h-10 w-full rounded-md border border-zinc-300 px-4 text-sm font-medium disabled:cursor-not-allowed disabled:text-zinc-400"
						>
							Customer Portalを開く
						</button>
					</div>
				</section>
			</aside>
		</div>
	);
}
