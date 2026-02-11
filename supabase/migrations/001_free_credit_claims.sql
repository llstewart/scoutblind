-- ============================================
-- Migration: Add free_credit_claims table
-- Prevents users from deleting and recreating
-- accounts to get unlimited free credits.
--
-- Run this in your Supabase SQL Editor.
-- ============================================

-- 1. Create the claims table
CREATE TABLE IF NOT EXISTS public.free_credit_claims (
  email TEXT PRIMARY KEY,
  claimed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.free_credit_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage claims" ON public.free_credit_claims
  FOR ALL USING (auth.role() = 'service_role');

-- 2. Backfill: record all existing users who already received credits
INSERT INTO public.free_credit_claims (email, claimed_at)
SELECT LOWER(p.email), p.created_at
FROM public.profiles p
ON CONFLICT (email) DO NOTHING;

-- 3. Replace the signup trigger to check claims before granting credits
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
