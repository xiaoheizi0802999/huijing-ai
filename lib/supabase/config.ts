type SupabaseEnv = Partial<Record<string, string | undefined>>

const defaultPublicEnv: SupabaseEnv = {
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
}

const defaultServerEnv: SupabaseEnv = {
  ...defaultPublicEnv,
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
}

export type SupabasePublicConfig = {
  publishableKey: string
  url: string
}

export type SupabaseServerConfig = SupabasePublicConfig & {
  secretKey: string
}

export function cleanSupabaseEnvValue(value: string | undefined) {
  return value?.replace(/\uFEFF/g, "").trim()
}

export function getSupabasePublicConfig(
  env: SupabaseEnv = defaultPublicEnv,
): SupabasePublicConfig | null {
  const url = cleanSupabaseEnvValue(env.NEXT_PUBLIC_SUPABASE_URL)
  const publishableKey = cleanSupabaseEnvValue(
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )

  if (!url || !publishableKey) {
    return null
  }

  return {
    publishableKey,
    url,
  }
}

export function getSupabaseServerConfig(
  env: SupabaseEnv = defaultServerEnv,
): SupabaseServerConfig | null {
  const publicConfig = getSupabasePublicConfig(env)
  const secretKey = cleanSupabaseEnvValue(env.SUPABASE_SECRET_KEY)

  if (!publicConfig || !secretKey) {
    return null
  }

  return {
    ...publicConfig,
    secretKey,
  }
}
