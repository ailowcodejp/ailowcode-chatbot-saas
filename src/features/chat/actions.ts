"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type ChatSession = Database["public"]["Tables"]["chat_sessions"]["Row"];
export type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];

export async function getChatSessions(): Promise<ChatSession[]> {
	const supabase = await createClient();
	const {
		data: { session },
	} = await supabase.auth.getSession();

	if (!session) {
		return [];
	}

	const { data, error } = await supabase
		.from("chat_sessions")
		.select("*")
		.eq("user_id", session.user.id)
		.is("deleted_at", null)
		.order("updated_at", { ascending: false });

	if (error) {
		console.error("Failed to fetch chat sessions:", error);
		return [];
	}

	return data ?? [];
}

export async function getChatSessionWithMessages(sessionId: string): Promise<{
	session: ChatSession;
	messages: ChatMessage[];
} | null> {
	const supabase = await createClient();
	const {
		data: { session },
	} = await supabase.auth.getSession();

	if (!session) {
		return null;
	}

	const { data: chatSession, error: sessionError } = await supabase
		.from("chat_sessions")
		.select("*")
		.eq("id", sessionId)
		.eq("user_id", session.user.id)
		.is("deleted_at", null)
		.single();

	if (sessionError || !chatSession) {
		return null;
	}

	const { data: messages, error: messagesError } = await supabase
		.from("chat_messages")
		.select("*")
		.eq("session_id", sessionId)
		.order("created_at", { ascending: true });

	if (messagesError) {
		console.error("Failed to fetch chat messages:", messagesError);
		return { session: chatSession, messages: [] };
	}

	return { session: chatSession, messages: messages ?? [] };
}
