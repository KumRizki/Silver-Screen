import { createClient } from '@supabase/supabase-js';

// The publishable key is safe to ship: row-level security only lets it read
// public listings and insert submissions. Env vars override the defaults.
const url = import.meta.env.PUBLIC_SUPABASE_URL || 'https://gliosrfvzzgicfpalyxk.supabase.co';
const key = import.meta.env.PUBLIC_SUPABASE_KEY || 'sb_publishable_X6mxyQ7_HWcPnxwyZiVMZw_PBcDQDqO';

export const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
