-- ============================================
-- TrueSignal Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- Extends Supabase auth.users with app-specific data
-- ============================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- SUBSCRIPTIONS TABLE
-- Tracks Stripe subscriptions and credits
-- ============================================
CREATE TYPE subscription_tier AS ENUM ('free', 'starter', 'pro', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing', 'incomplete');

CREATE TABLE public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  tier subscription_tier DEFAULT 'free' NOT NULL,
  status subscription_status DEFAULT 'active' NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  credits_monthly_allowance INTEGER DEFAULT 0 NOT NULL,
  credits_remaining INTEGER DEFAULT 0 NOT NULL,
  credits_purchased INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only view their own subscription
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role can update subscriptions (via webhooks)
CREATE POLICY "Service role can manage subscriptions" ON public.subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- CREDIT TRANSACTIONS TABLE
-- Audit trail of all credit changes
-- ============================================
CREATE TYPE transaction_type AS ENUM (
  'subscription_grant',    -- Monthly credits from subscription
  'purchase',              -- One-time credit purchase
  'usage',                 -- Credit spent on analysis
  'refund',                -- Credit refunded
  'admin_adjustment',      -- Manual adjustment by admin
  'bonus'                  -- Promotional credits
);

CREATE TABLE public.credit_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL, -- Positive for credits added, negative for credits used
  type transaction_type NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  balance_after INTEGER NOT NULL, -- Credit balance after this transaction
  stripe_session_id TEXT, -- For idempotency on webhook retries
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users can only view their own transactions
CREATE POLICY "Users can view own transactions" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);
CREATE UNIQUE INDEX idx_credit_transactions_stripe_session ON public.credit_transactions(stripe_session_id) WHERE stripe_session_id IS NOT NULL;

-- ============================================
-- SAVED ANALYSES TABLE
-- Stores user's analyzed businesses
-- ============================================
CREATE TABLE public.saved_analyses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  niche TEXT NOT NULL,
  location TEXT NOT NULL,
  businesses JSONB NOT NULL DEFAULT '[]',
  business_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Unique constraint per user/niche/location
  UNIQUE(user_id, niche, location)
);

-- Enable RLS
ALTER TABLE public.saved_analyses ENABLE ROW LEVEL SECURITY;

-- Users can only access their own analyses
CREATE POLICY "Users can view own analyses" ON public.saved_analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses" ON public.saved_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analyses" ON public.saved_analyses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses" ON public.saved_analyses
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_saved_analyses_user_id ON public.saved_analyses(user_id);

-- ============================================
-- USAGE TRACKING TABLE
-- Tracks what users are searching/analyzing
-- ============================================
CREATE TABLE public.usage_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'search', 'analyze', 'export'
  metadata JSONB DEFAULT '{}',
  credits_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- Users can only view their own logs
CREATE POLICY "Users can view own usage" ON public.usage_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX idx_usage_logs_created_at ON public.usage_logs(created_at DESC);

-- ============================================
-- FREE CREDIT CLAIMS TABLE
-- Tracks which emails have received welcome credits.
-- NOT linked to auth.users — survives account deletion.
-- ============================================
CREATE TABLE public.free_credit_claims (
  email TEXT PRIMARY KEY,
  claimed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- No RLS needed — only accessed by service role via triggers/API
ALTER TABLE public.free_credit_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage claims" ON public.free_credit_claims
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_already_claimed BOOLEAN;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- Check if this email already claimed free credits
  SELECT EXISTS(
    SELECT 1 FROM public.free_credit_claims WHERE email = LOWER(NEW.email)
  ) INTO v_already_claimed;

  IF v_already_claimed THEN
    -- Returning user: create subscription with 0 credits
    INSERT INTO public.subscriptions (user_id, tier, status, credits_monthly_allowance, credits_remaining)
    VALUES (NEW.id, 'free', 'active', 0, 0);
  ELSE
    -- New user: grant welcome credits and record the claim
    INSERT INTO public.subscriptions (user_id, tier, status, credits_monthly_allowance, credits_remaining)
    VALUES (NEW.id, 'free', 'active', 5, 5);

    INSERT INTO public.credit_transactions (user_id, amount, type, description, balance_after)
    VALUES (NEW.id, 5, 'bonus', 'Welcome credits for new users', 5);

    INSERT INTO public.free_credit_claims (email)
    VALUES (LOWER(NEW.email))
    ON CONFLICT (email) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_saved_analyses_updated_at
  BEFORE UPDATE ON public.saved_analyses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Function to deduct credits
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT DEFAULT 'Analysis credit usage'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_credits INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Get current credits (remaining + purchased)
  SELECT credits_remaining + credits_purchased INTO v_current_credits
  FROM public.subscriptions
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_credits IS NULL OR v_current_credits < p_amount THEN
    RETURN FALSE;
  END IF;

  -- Deduct from remaining first, then purchased
  UPDATE public.subscriptions
  SET
    credits_remaining = GREATEST(0, credits_remaining - p_amount),
    credits_purchased = CASE
      WHEN credits_remaining >= p_amount THEN credits_purchased
      ELSE credits_purchased - (p_amount - credits_remaining)
    END
  WHERE user_id = p_user_id;

  -- Get new balance
  SELECT credits_remaining + credits_purchased INTO v_new_balance
  FROM public.subscriptions
  WHERE user_id = p_user_id;

  -- Log transaction
  INSERT INTO public.credit_transactions (user_id, amount, type, description, balance_after)
  VALUES (p_user_id, -p_amount, 'usage', p_description, v_new_balance);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add credits (for purchases)
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_type transaction_type,
  p_description TEXT DEFAULT 'Credit purchase'
)
RETURNS INTEGER AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Add to purchased credits
  UPDATE public.subscriptions
  SET credits_purchased = credits_purchased + p_amount
  WHERE user_id = p_user_id;

  -- Get new balance
  SELECT credits_remaining + credits_purchased INTO v_new_balance
  FROM public.subscriptions
  WHERE user_id = p_user_id;

  -- Log transaction
  INSERT INTO public.credit_transactions (user_id, amount, type, description, balance_after)
  VALUES (p_user_id, p_amount, p_type, p_description, v_new_balance);

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SUBSCRIPTION TIERS CONFIGURATION
-- ============================================
CREATE TABLE public.subscription_tiers (
  tier subscription_tier PRIMARY KEY,
  name TEXT NOT NULL,
  monthly_credits INTEGER NOT NULL,
  price_monthly INTEGER NOT NULL, -- in cents
  price_yearly INTEGER NOT NULL,  -- in cents
  features JSONB DEFAULT '[]',
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT
);

INSERT INTO public.subscription_tiers (tier, name, monthly_credits, price_monthly, price_yearly, features) VALUES
  ('free', 'Free', 5, 0, 0, '["5 analyses per month", "Basic signals", "CSV export"]'),
  ('starter', 'Starter', 50, 2900, 29000, '["50 analyses per month", "All signals", "Priority support"]'),
  ('pro', 'Pro', 200, 7900, 79000, '["200 analyses per month", "All signals", "API access", "Priority support"]'),
  ('enterprise', 'Enterprise', 1000, 19900, 199000, '["1000 analyses per month", "All signals", "API access", "Dedicated support", "Custom integrations"]');

-- Public read access for tiers
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view tiers" ON public.subscription_tiers FOR SELECT USING (true);

-- ============================================
-- LEADS TABLE
-- Persistent CRM for enriched businesses
-- ============================================
CREATE TABLE public.leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  canonical_id TEXT NOT NULL,
  place_id TEXT,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  rating NUMERIC(2,1),
  review_count INTEGER DEFAULT 0,
  category TEXT,
  claimed BOOLEAN DEFAULT false,

  -- Enriched fields
  owner_name TEXT,
  owner_phone TEXT,
  last_review_date TIMESTAMPTZ,
  last_owner_activity TIMESTAMPTZ,
  days_dormant INTEGER,
  search_visibility INTEGER,
  response_rate NUMERIC(5,2) DEFAULT 0,
  location_type TEXT,
  website_tech TEXT,
  seo_optimized BOOLEAN DEFAULT false,

  -- CRM fields
  lead_status TEXT DEFAULT 'new',
  lead_notes TEXT,

  -- Provenance
  source_niche TEXT,
  source_location TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(user_id, canonical_id)
);

-- RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own leads" ON public.leads
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own leads" ON public.leads
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own leads" ON public.leads
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage leads" ON public.leads
  FOR ALL USING (auth.role() = 'service_role');

-- Indexes
CREATE INDEX idx_leads_user_id ON public.leads(user_id);
CREATE INDEX idx_leads_user_status ON public.leads(user_id, lead_status);
CREATE INDEX idx_leads_canonical ON public.leads(user_id, canonical_id);

-- Auto-update timestamp
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Upsert RPC (service role only)
CREATE OR REPLACE FUNCTION public.upsert_lead(
  p_user_id UUID,
  p_canonical_id TEXT,
  p_place_id TEXT,
  p_name TEXT,
  p_address TEXT,
  p_phone TEXT,
  p_website TEXT,
  p_rating NUMERIC,
  p_review_count INTEGER,
  p_category TEXT,
  p_claimed BOOLEAN,
  p_owner_name TEXT,
  p_owner_phone TEXT,
  p_last_review_date TIMESTAMPTZ,
  p_last_owner_activity TIMESTAMPTZ,
  p_days_dormant INTEGER,
  p_search_visibility INTEGER,
  p_response_rate NUMERIC,
  p_location_type TEXT,
  p_website_tech TEXT,
  p_seo_optimized BOOLEAN,
  p_source_niche TEXT,
  p_source_location TEXT
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.leads (
    user_id, canonical_id, place_id, name, address, phone, website,
    rating, review_count, category, claimed,
    owner_name, owner_phone, last_review_date, last_owner_activity,
    days_dormant, search_visibility, response_rate, location_type,
    website_tech, seo_optimized, source_niche, source_location
  ) VALUES (
    p_user_id, p_canonical_id, p_place_id, p_name, p_address, p_phone, p_website,
    p_rating, p_review_count, p_category, p_claimed,
    p_owner_name, p_owner_phone, p_last_review_date, p_last_owner_activity,
    p_days_dormant, p_search_visibility, p_response_rate, p_location_type,
    p_website_tech, p_seo_optimized, p_source_niche, p_source_location
  )
  ON CONFLICT (user_id, canonical_id)
  DO UPDATE SET
    place_id = COALESCE(EXCLUDED.place_id, leads.place_id),
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    phone = COALESCE(EXCLUDED.phone, leads.phone),
    website = COALESCE(EXCLUDED.website, leads.website),
    rating = EXCLUDED.rating,
    review_count = EXCLUDED.review_count,
    category = EXCLUDED.category,
    claimed = EXCLUDED.claimed,
    owner_name = COALESCE(EXCLUDED.owner_name, leads.owner_name),
    owner_phone = COALESCE(EXCLUDED.owner_phone, leads.owner_phone),
    last_review_date = EXCLUDED.last_review_date,
    last_owner_activity = EXCLUDED.last_owner_activity,
    days_dormant = EXCLUDED.days_dormant,
    search_visibility = EXCLUDED.search_visibility,
    response_rate = EXCLUDED.response_rate,
    location_type = EXCLUDED.location_type,
    website_tech = EXCLUDED.website_tech,
    seo_optimized = EXCLUDED.seo_optimized,
    source_niche = EXCLUDED.source_niche,
    source_location = EXCLUDED.source_location
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
