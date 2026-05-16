-- ============================================================================
-- Initial Schema: AILowcode AI Chat SaaS
-- ============================================================================
-- This migration creates the core tables for the AI Chat SaaS application.
--
-- Tables:
--   1. profiles           - User profiles extending auth.users
--   2. credit_transactions - Audit trail for credit changes
--   3. subscriptions      - Subscription status synced from Stripe
--   4. chat_sessions      - Chat conversation groupings
--   5. chat_messages      - Individual messages in a chat session
--
-- All user-data tables have Row Level Security (RLS) enabled.
-- ============================================================================

-- ============================================================================
-- 1. profiles
-- ============================================================================
-- Extends the built-in auth.users with application-specific profile data.
-- Automatically created via trigger on auth.users insert.
-- ============================================================================

CREATE TABLE public.profiles (
    id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       TEXT        NOT NULL,
    display_name TEXT,
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 2. credit_transactions
-- ============================================================================
-- Records every credit change (grant, consumption, refund, expiration).
-- The current credit balance for a user is computed as SUM(amount).
--
-- amount > 0  → credit granted
-- amount < 0  → credit consumed
-- ============================================================================

CREATE TYPE public.credit_transaction_type AS ENUM (
    'grant',       -- Credits granted (signup bonus, monthly top-up, manual)
    'consumption', -- Credits consumed by a chat
    'refund',      -- Credits refunded (e.g. on LLM error)
    'expiration'   -- Credits expired
);

CREATE TABLE public.credit_transactions (
    id              BIGINT                      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id         UUID                        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount          INTEGER                     NOT NULL,
    transaction_type public.credit_transaction_type NOT NULL,
    description     TEXT,
    reference_id    TEXT,           -- e.g. Stripe subscription ID, chat message ID
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions(user_id);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credit transactions"
    ON public.credit_transactions
    FOR SELECT
    USING (auth.uid() = user_id);

-- ============================================================================
-- 3. subscriptions
-- ============================================================================
-- Mirrors the essential subscription state from Stripe so that
-- authorisation and rate-limiting can be enforced without calling Stripe.
-- Updated by Stripe webhook (checkout.session.completed, invoice.paid,
-- customer.subscription.updated, customer.subscription.deleted).
-- ============================================================================

CREATE TYPE public.subscription_plan AS ENUM (
    'free',
    'pro_monthly',
    'pro_yearly'
);

CREATE TYPE public.subscription_status AS ENUM (
    'active',
    'canceled',
    'incomplete',
    'incomplete_expired',
    'past_due',
    'paused',
    'trialing',
    'unpaid'
);

CREATE TABLE public.subscriptions (
    id                  UUID                        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID                        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT                    UNIQUE,
    stripe_customer_id  TEXT,
    plan                public.subscription_plan    NOT NULL DEFAULT 'free',
    status              public.subscription_status  NOT NULL DEFAULT 'active',
    current_period_start TIMESTAMPTZ,
    current_period_end  TIMESTAMPTZ,
    credits_granted_this_period INTEGER             NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ                 NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ                 NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
    ON public.subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Auto-create free subscription on signup
CREATE OR REPLACE FUNCTION public.handle_new_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.subscriptions (user_id, plan, status)
    VALUES (NEW.id, 'free', 'active');
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created_subscription
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_subscription();

-- Grant signup bonus credits (10 credits on first registration)
CREATE OR REPLACE FUNCTION public.grant_signup_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.credit_transactions (user_id, amount, transaction_type, description)
    VALUES (NEW.id, 10, 'grant', 'Signup bonus credits');
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created_credits
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.grant_signup_credits();

-- ============================================================================
-- 4. chat_sessions
-- ============================================================================
-- Groups related messages into a single conversation session.
-- ============================================================================

CREATE TABLE public.chat_sessions (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID            NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title       TEXT            NOT NULL DEFAULT 'New Chat',
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_updated_at ON public.chat_sessions(updated_at DESC);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat sessions"
    ON public.chat_sessions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat sessions"
    ON public.chat_sessions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions"
    ON public.chat_sessions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat sessions"
    ON public.chat_sessions
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- 5. chat_messages
-- ============================================================================
-- Stores individual messages (user input & AI response) in a chat session.
-- ============================================================================

CREATE TYPE public.message_role AS ENUM (
    'user',
    'assistant',
    'system'
);

CREATE TABLE public.chat_messages (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID            NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role            public.message_role NOT NULL,
    content         TEXT            NOT NULL,
    token_count     INTEGER,        -- Number of tokens used (for billing / logging)
    metadata        JSONB,          -- Flexible field for future extensions
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat messages"
    ON public.chat_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in own sessions"
    ON public.chat_messages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chat_sessions
            WHERE chat_sessions.id = session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- ============================================================================
-- Helper: get_credit_balance(user_id)
-- ============================================================================
-- Returns the current credit balance for a user by summing all transactions.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_credit_balance(target_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    balance INTEGER;
BEGIN
    SELECT COALESCE(SUM(amount), 0) INTO balance
    FROM public.credit_transactions
    WHERE user_id = target_user_id;
    RETURN balance;
END;
$$;

-- ============================================================================
-- Helper: updated_at trigger function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER set_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER set_chat_sessions_updated_at
    BEFORE UPDATE ON public.chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
