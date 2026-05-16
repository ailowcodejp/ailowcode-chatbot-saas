/// <reference lib="deno.ns" />

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.4";

type ChatRole = "system" | "user" | "assistant";

type ChatMessage = {
	role: ChatRole;
	content: string;
};

type ChatCompletionRequest = {
	message?: unknown;
	sessionId?: unknown;
	model?: unknown;
};

type LlmGatewayResponse = {
	id?: string;
	choices?: Array<{
		message?: {
			content?: string;
		};
	}>;
	usage?: {
		total_tokens?: number;
	};
};

type RpcClient = {
	rpc: (
		functionName: string,
		args: Record<string, unknown>,
	) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
};

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
};

const maxMessageLength = 4000;
const defaultModel = Deno.env.get("LLM_GATEWAY_MODEL") ?? "zai/glm-4.6v-flash";
const llmGatewayUrl =
	Deno.env.get("LLM_GATEWAY_CHAT_COMPLETIONS_URL") ??
	"https://api.llmgateway.io/v1/chat/completions";

function jsonResponse(body: unknown, status = 200): Response {
	return Response.json(body, {
		status,
		headers: corsHeaders,
	});
}

function getRequiredEnv(name: string): string {
	const value = Deno.env.get(name);

	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}

	return value;
}

function getSupabasePublishableKey(): string {
	const singleKey =
		Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
		Deno.env.get("SUPABASE_ANON_KEY");

	if (singleKey) {
		return singleKey;
	}

	const keyedJson = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
	if (keyedJson) {
		const keys = JSON.parse(keyedJson) as Record<string, string>;
		if (keys.default) {
			return keys.default;
		}
	}

	throw new Error("Missing Supabase publishable key");
}

function getSupabaseSecretKey(): string {
	const singleKey =
		Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
		Deno.env.get("SUPABASE_SECRET_KEY");

	if (singleKey) {
		return singleKey;
	}

	const keyedJson = Deno.env.get("SUPABASE_SECRET_KEYS");
	if (keyedJson) {
		const keys = JSON.parse(keyedJson) as Record<string, string>;
		if (keys.default) {
			return keys.default;
		}
	}

	throw new Error("Missing Supabase service role key");
}

function isUuid(value: string): boolean {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
		value,
	);
}

function makeSessionTitle(message: string): string {
	const normalized = message.replace(/\s+/g, " ").trim();
	return normalized.length > 40 ? `${normalized.slice(0, 40)}...` : normalized;
}

function normalizeRequest(body: ChatCompletionRequest) {
	const message = typeof body.message === "string" ? body.message.trim() : "";
	const sessionId = typeof body.sessionId === "string" ? body.sessionId : null;
	const model =
		typeof body.model === "string" ? body.model.trim() : defaultModel;

	if (!message) {
		return { error: "message is required" };
	}

	if (message.length > maxMessageLength) {
		return { error: `message must be ${maxMessageLength} characters or less` };
	}

	if (sessionId && !isUuid(sessionId)) {
		return { error: "sessionId must be a valid UUID" };
	}

	if (!model || model.length > 120) {
		return { error: "model is invalid" };
	}

	return {
		message,
		sessionId,
		model,
	};
}

async function refundCredit(
	adminClient: unknown,
	userId: string,
	messageId: string,
	reason: string,
) {
	const { error } = await (adminClient as RpcClient).rpc("refund_credit", {
		p_user_id: userId,
		p_amount: 1,
		p_idempotency_key: `chat:${messageId}:refund`,
		p_description: "AI chat message refund",
		p_related_entity_type: "chat_message",
		p_related_entity_id: messageId,
		p_metadata: { reason },
	});

	if (error) {
		console.error("Failed to refund credit", error);
	}
}

Deno.serve(async (request: Request) => {
	if (request.method === "OPTIONS") {
		return new Response("ok", { headers: corsHeaders });
	}

	if (request.method !== "POST") {
		return jsonResponse({ error: "method_not_allowed" }, 405);
	}

	try {
		const authorization = request.headers.get("Authorization");
		if (!authorization) {
			return jsonResponse({ error: "not_authenticated" }, 401);
		}

		const normalized = normalizeRequest(
			(await request.json()) as ChatCompletionRequest,
		);
		if ("error" in normalized) {
			return jsonResponse({ error: normalized.error }, 400);
		}

		const supabaseUrl = getRequiredEnv("SUPABASE_URL");
		const llmGatewayApiKey = getRequiredEnv("LLM_GATEWAY_API_KEY");
		const userClient = createClient(supabaseUrl, getSupabasePublishableKey(), {
			global: {
				headers: { Authorization: authorization },
			},
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
		});
		const adminClient = createClient(supabaseUrl, getSupabaseSecretKey(), {
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
		});

		const {
			data: { user },
			error: userError,
		} = await userClient.auth.getUser();

		if (userError || !user) {
			return jsonResponse({ error: "not_authenticated" }, 401);
		}

		let sessionId = normalized.sessionId;
		let history: ChatMessage[] = [];

		if (sessionId) {
			const { data: session, error: sessionError } = await userClient
				.from("chat_sessions")
				.select("id")
				.eq("id", sessionId)
				.eq("user_id", user.id)
				.single();

			if (sessionError || !session) {
				return jsonResponse({ error: "chat_session_not_found" }, 404);
			}

			const { data: previousMessages, error: historyError } = await userClient
				.from("chat_messages")
				.select("role, content")
				.eq("session_id", sessionId)
				.eq("user_id", user.id)
				.order("created_at", { ascending: false })
				.limit(10);

			if (historyError) {
				console.error("Failed to load chat history", historyError);
				return jsonResponse({ error: "failed_to_load_chat_history" }, 500);
			}

			history = (previousMessages ?? [])
				.reverse()
				.map((message) => ({
					role: message.role,
					content: message.content,
				}))
				.filter((message): message is ChatMessage =>
					["system", "user", "assistant"].includes(message.role),
				);
		} else {
			const { data: session, error: sessionError } = await userClient
				.from("chat_sessions")
				.insert({
					user_id: user.id,
					title: makeSessionTitle(normalized.message),
					metadata: { source: "llm_gateway_edge_function" },
				})
				.select("id")
				.single();

			if (sessionError || !session) {
				console.error("Failed to create chat session", sessionError);
				return jsonResponse({ error: "failed_to_create_chat_session" }, 500);
			}

			sessionId = session.id;
		}

		const { data: userMessage, error: userMessageError } = await userClient
			.from("chat_messages")
			.insert({
				session_id: sessionId,
				user_id: user.id,
				role: "user",
				content: normalized.message,
				model: normalized.model,
				metadata: { source: "llm_gateway_edge_function" },
			})
			.select("id")
			.single();

		if (userMessageError || !userMessage) {
			console.error("Failed to save user message", userMessageError);
			return jsonResponse({ error: "failed_to_save_user_message" }, 500);
		}

		const { data: creditResult, error: creditError } = await (
			userClient as unknown as RpcClient
		).rpc("consume_credit", {
			p_amount: 1,
			p_idempotency_key: `chat:${userMessage.id}:credit`,
			p_description: "AI chat message",
			p_related_entity_type: "chat_message",
			p_related_entity_id: userMessage.id,
			p_metadata: { session_id: sessionId, model: normalized.model },
		});

		if (creditError) {
			const isInsufficientCredits = creditError.message.includes(
				"insufficient_credits",
			);

			return jsonResponse(
				{
					error: isInsufficientCredits
						? "insufficient_credits"
						: "credit_error",
				},
				isInsufficientCredits ? 402 : 500,
			);
		}

		const llmResponse = await fetch(llmGatewayUrl, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${llmGatewayApiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: normalized.model,
				stream: false,
				messages: [
					{
						role: "system",
						content:
							"You are a concise, helpful AI assistant for a Japanese AI chatbot SaaS learning product.",
					},
					...history,
					{ role: "user", content: normalized.message },
				],
			}),
		});

		if (!llmResponse.ok) {
			const body = await llmResponse.text();
			console.error("LLM Gateway API error", {
				status: llmResponse.status,
				body,
			});
			await refundCredit(
				adminClient,
				user.id,
				userMessage.id,
				"llm_gateway_error",
			);
			return jsonResponse({ error: "llm_gateway_error" }, 502);
		}

		const llmData = (await llmResponse.json()) as LlmGatewayResponse;
		const assistantMessage = llmData.choices?.[0]?.message?.content?.trim();

		if (!assistantMessage) {
			await refundCredit(
				adminClient,
				user.id,
				userMessage.id,
				"empty_llm_response",
			);
			return jsonResponse({ error: "empty_llm_response" }, 502);
		}

		const requestId =
			llmResponse.headers.get("x-request-id") ??
			llmResponse.headers.get("x-llm-gateway-request-id") ??
			llmData.id ??
			null;

		const { data: savedAssistantMessage, error: assistantMessageError } =
			await userClient
				.from("chat_messages")
				.insert({
					session_id: sessionId,
					user_id: user.id,
					role: "assistant",
					content: assistantMessage,
					model: normalized.model,
					token_count: llmData.usage?.total_tokens ?? null,
					llm_gateway_request_id: requestId,
					metadata: {
						source: "llm_gateway_edge_function",
						user_message_id: userMessage.id,
					},
				})
				.select("id, content, created_at")
				.single();

		if (assistantMessageError || !savedAssistantMessage) {
			console.error("Failed to save assistant message", assistantMessageError);
			await refundCredit(
				adminClient,
				user.id,
				userMessage.id,
				"assistant_message_save_failed",
			);
			return jsonResponse({ error: "failed_to_save_assistant_message" }, 500);
		}

		return jsonResponse({
			sessionId,
			message: savedAssistantMessage.content,
			assistantMessageId: savedAssistantMessage.id,
			userMessageId: userMessage.id,
			model: normalized.model,
			requestId,
			usage: llmData.usage ?? null,
			credit: creditResult,
		});
	} catch (error) {
		console.error("chat-completion unexpected error", error);
		return jsonResponse({ error: "internal_error" }, 500);
	}
});
