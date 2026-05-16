export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

export type Database = {
	graphql_public: {
		Tables: {
			[_ in never]: never;
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			graphql: {
				Args: {
					extensions?: Json;
					operationName?: string;
					query?: string;
					variables?: Json;
				};
				Returns: Json;
			};
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
	public: {
		Tables: {
			billing_customers: {
				Row: {
					created_at: string;
					email: string | null;
					metadata: Json;
					name: string | null;
					stripe_customer_id: string;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					created_at?: string;
					email?: string | null;
					metadata?: Json;
					name?: string | null;
					stripe_customer_id: string;
					updated_at?: string;
					user_id: string;
				};
				Update: {
					created_at?: string;
					email?: string | null;
					metadata?: Json;
					name?: string | null;
					stripe_customer_id?: string;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [];
			};
			billing_subscriptions: {
				Row: {
					cancel_at_period_end: boolean;
					canceled_at: string | null;
					created_at: string;
					current_period_end: string | null;
					current_period_start: string | null;
					id: string;
					metadata: Json;
					plan: Database["public"]["Enums"]["subscription_plan"];
					status: Database["public"]["Enums"]["billing_subscription_status"];
					stripe_customer_id: string;
					stripe_price_id: string | null;
					stripe_subscription_id: string;
					trial_end: string | null;
					trial_start: string | null;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					cancel_at_period_end?: boolean;
					canceled_at?: string | null;
					created_at?: string;
					current_period_end?: string | null;
					current_period_start?: string | null;
					id?: string;
					metadata?: Json;
					plan?: Database["public"]["Enums"]["subscription_plan"];
					status: Database["public"]["Enums"]["billing_subscription_status"];
					stripe_customer_id: string;
					stripe_price_id?: string | null;
					stripe_subscription_id: string;
					trial_end?: string | null;
					trial_start?: string | null;
					updated_at?: string;
					user_id: string;
				};
				Update: {
					cancel_at_period_end?: boolean;
					canceled_at?: string | null;
					created_at?: string;
					current_period_end?: string | null;
					current_period_start?: string | null;
					id?: string;
					metadata?: Json;
					plan?: Database["public"]["Enums"]["subscription_plan"];
					status?: Database["public"]["Enums"]["billing_subscription_status"];
					stripe_customer_id?: string;
					stripe_price_id?: string | null;
					stripe_subscription_id?: string;
					trial_end?: string | null;
					trial_start?: string | null;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "billing_subscriptions_stripe_customer_id_fkey";
						columns: ["stripe_customer_id"];
						isOneToOne: false;
						referencedRelation: "billing_customers";
						referencedColumns: ["stripe_customer_id"];
					},
				];
			};
			billing_webhook_events: {
				Row: {
					attempts: number;
					created_at: string;
					error_message: string | null;
					event_type: string;
					id: string;
					payload: Json;
					processed_at: string | null;
					status: Database["public"]["Enums"]["billing_webhook_event_status"];
					stripe_event_id: string;
					updated_at: string;
				};
				Insert: {
					attempts?: number;
					created_at?: string;
					error_message?: string | null;
					event_type: string;
					id?: string;
					payload?: Json;
					processed_at?: string | null;
					status?: Database["public"]["Enums"]["billing_webhook_event_status"];
					stripe_event_id: string;
					updated_at?: string;
				};
				Update: {
					attempts?: number;
					created_at?: string;
					error_message?: string | null;
					event_type?: string;
					id?: string;
					payload?: Json;
					processed_at?: string | null;
					status?: Database["public"]["Enums"]["billing_webhook_event_status"];
					stripe_event_id?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			chat_messages: {
				Row: {
					content: string;
					created_at: string;
					id: string;
					llm_gateway_request_id: string | null;
					metadata: Json;
					model: string | null;
					role: Database["public"]["Enums"]["message_role"];
					session_id: string;
					token_count: number | null;
					user_id: string;
				};
				Insert: {
					content: string;
					created_at?: string;
					id?: string;
					llm_gateway_request_id?: string | null;
					metadata?: Json;
					model?: string | null;
					role: Database["public"]["Enums"]["message_role"];
					session_id: string;
					token_count?: number | null;
					user_id: string;
				};
				Update: {
					content?: string;
					created_at?: string;
					id?: string;
					llm_gateway_request_id?: string | null;
					metadata?: Json;
					model?: string | null;
					role?: Database["public"]["Enums"]["message_role"];
					session_id?: string;
					token_count?: number | null;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "chat_messages_session_owner_fk";
						columns: ["session_id", "user_id"];
						isOneToOne: false;
						referencedRelation: "chat_sessions";
						referencedColumns: ["id", "user_id"];
					},
				];
			};
			chat_sessions: {
				Row: {
					created_at: string;
					deleted_at: string | null;
					id: string;
					metadata: Json;
					title: string;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					created_at?: string;
					deleted_at?: string | null;
					id?: string;
					metadata?: Json;
					title?: string;
					updated_at?: string;
					user_id: string;
				};
				Update: {
					created_at?: string;
					deleted_at?: string | null;
					id?: string;
					metadata?: Json;
					title?: string;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [];
			};
			credit_balances: {
				Row: {
					balance: number;
					created_at: string;
					total_consumed: number;
					total_granted: number;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					balance?: number;
					created_at?: string;
					total_consumed?: number;
					total_granted?: number;
					updated_at?: string;
					user_id: string;
				};
				Update: {
					balance?: number;
					created_at?: string;
					total_consumed?: number;
					total_granted?: number;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [];
			};
			credit_transactions: {
				Row: {
					amount: number;
					balance_after: number;
					created_at: string;
					description: string | null;
					id: string;
					idempotency_key: string | null;
					metadata: Json;
					related_entity_id: string | null;
					related_entity_type: string | null;
					transaction_type: Database["public"]["Enums"]["credit_transaction_type"];
					user_id: string;
				};
				Insert: {
					amount: number;
					balance_after: number;
					created_at?: string;
					description?: string | null;
					id?: string;
					idempotency_key?: string | null;
					metadata?: Json;
					related_entity_id?: string | null;
					related_entity_type?: string | null;
					transaction_type: Database["public"]["Enums"]["credit_transaction_type"];
					user_id: string;
				};
				Update: {
					amount?: number;
					balance_after?: number;
					created_at?: string;
					description?: string | null;
					id?: string;
					idempotency_key?: string | null;
					metadata?: Json;
					related_entity_id?: string | null;
					related_entity_type?: string | null;
					transaction_type?: Database["public"]["Enums"]["credit_transaction_type"];
					user_id?: string;
				};
				Relationships: [];
			};
			profiles: {
				Row: {
					avatar_url: string | null;
					created_at: string;
					deleted_at: string | null;
					display_name: string | null;
					email: string;
					id: string;
					updated_at: string;
				};
				Insert: {
					avatar_url?: string | null;
					created_at?: string;
					deleted_at?: string | null;
					display_name?: string | null;
					email: string;
					id: string;
					updated_at?: string;
				};
				Update: {
					avatar_url?: string | null;
					created_at?: string;
					deleted_at?: string | null;
					display_name?: string | null;
					email?: string;
					id?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			consume_credit: {
				Args: {
					p_amount?: number;
					p_description?: string;
					p_idempotency_key?: string;
					p_metadata?: Json;
					p_related_entity_id?: string;
					p_related_entity_type?: string;
				};
				Returns: Json;
			};
			get_credit_balance: { Args: never; Returns: number };
			get_user_id_by_stripe_customer: {
				Args: { p_stripe_customer_id: string };
				Returns: string;
			};
			grant_monthly_credits: {
				Args: {
					p_amount?: number;
					p_description?: string;
					p_idempotency_key?: string;
					p_metadata?: Json;
					p_user_id: string;
				};
				Returns: Json;
			};
			mark_billing_webhook_event_processed: {
				Args: { p_stripe_event_id: string };
				Returns: Json;
			};
			record_billing_webhook_event: {
				Args: {
					p_error_message?: string;
					p_event_type: string;
					p_payload: Json;
					p_status?: Database["public"]["Enums"]["billing_webhook_event_status"];
					p_stripe_event_id: string;
				};
				Returns: Json;
			};
			refund_credit: {
				Args: {
					p_amount: number;
					p_description?: string;
					p_idempotency_key: string;
					p_metadata?: Json;
					p_related_entity_id?: string;
					p_related_entity_type?: string;
					p_user_id: string;
				};
				Returns: Json;
			};
			soft_delete_chat_session: {
				Args: { p_session_id: string };
				Returns: Json;
			};
			upsert_billing_customer: {
				Args: {
					p_email?: string;
					p_metadata?: Json;
					p_name?: string;
					p_stripe_customer_id: string;
					p_user_id: string;
				};
				Returns: Json;
			};
			upsert_billing_subscription_from_stripe: {
				Args: {
					p_cancel_at_period_end?: boolean;
					p_canceled_at?: string;
					p_current_period_end?: string;
					p_current_period_start?: string;
					p_metadata?: Json;
					p_plan: Database["public"]["Enums"]["subscription_plan"];
					p_status: Database["public"]["Enums"]["billing_subscription_status"];
					p_stripe_customer_id: string;
					p_stripe_price_id: string;
					p_stripe_subscription_id: string;
					p_trial_end?: string;
					p_trial_start?: string;
					p_user_id: string;
				};
				Returns: Json;
			};
		};
		Enums: {
			billing_subscription_status:
				| "incomplete"
				| "incomplete_expired"
				| "trialing"
				| "active"
				| "past_due"
				| "canceled"
				| "unpaid"
				| "paused";
			billing_webhook_event_status:
				| "received"
				| "processing"
				| "processed"
				| "failed"
				| "skipped";
			credit_transaction_type:
				| "signup_bonus"
				| "monthly_grant"
				| "chat_usage"
				| "refund"
				| "manual_adjustment"
				| "expiration";
			message_role: "system" | "user" | "assistant";
			subscription_plan: "free" | "pro_monthly" | "pro_yearly";
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
	keyof Database,
	"public"
>];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
				DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
			DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
				DefaultSchema["Views"])
		? (DefaultSchema["Tables"] &
				DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema["Tables"]
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema["Tables"]
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	DefaultSchemaEnumNameOrOptions extends
		| keyof DefaultSchema["Enums"]
		| { schema: keyof DatabaseWithoutInternals },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
		: never = never,
> = DefaultSchemaEnumNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
		? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema["CompositeTypes"]
		| { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
		: never = never,
> = PublicCompositeTypeNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
		? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
		: never;

export const Constants = {
	graphql_public: {
		Enums: {},
	},
	public: {
		Enums: {
			billing_subscription_status: [
				"incomplete",
				"incomplete_expired",
				"trialing",
				"active",
				"past_due",
				"canceled",
				"unpaid",
				"paused",
			],
			billing_webhook_event_status: [
				"received",
				"processing",
				"processed",
				"failed",
				"skipped",
			],
			credit_transaction_type: [
				"signup_bonus",
				"monthly_grant",
				"chat_usage",
				"refund",
				"manual_adjustment",
				"expiration",
			],
			message_role: ["system", "user", "assistant"],
			subscription_plan: ["free", "pro_monthly", "pro_yearly"],
		},
	},
} as const;
