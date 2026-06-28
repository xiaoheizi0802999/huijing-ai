"use client"

import { createClient } from "@supabase/supabase-js"
import { getSupabasePublicConfig } from "@/lib/supabase/config"

export function createSupabaseBrowserClient() {
  const config = getSupabasePublicConfig()

  if (!config) {
    return null
  }

  return createClient(config.url, config.publishableKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "implicit",
      persistSession: true,
    },
  })
}
