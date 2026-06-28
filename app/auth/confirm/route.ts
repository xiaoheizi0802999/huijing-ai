import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { getSupabasePublicConfig } from "@/lib/supabase/config"

function readSafeNextPath(value: string | null, requestUrl: URL) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    try {
      const nextUrl = new URL(value ?? "")

      if (nextUrl.origin === requestUrl.origin) {
        return `${nextUrl.pathname}${nextUrl.search}`
      }
    } catch {
      return "/generate"
    }

    return "/generate"
  }

  return value
}

function redirectWithAuthError(request: Request, nextPath: string, message: string) {
  const targetUrl = new URL(nextPath, request.url)
  targetUrl.searchParams.set("auth_error", message)

  return NextResponse.redirect(targetUrl)
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const tokenHash = requestUrl.searchParams.get("token_hash")
  const type =
    requestUrl.searchParams.get("type") === "magiclink" ? "magiclink" : "email"
  const nextPath = readSafeNextPath(requestUrl.searchParams.get("next"), requestUrl)

  if (!tokenHash) {
    return redirectWithAuthError(request, nextPath, "missing_token_hash")
  }

  const config = getSupabasePublicConfig()

  if (!config) {
    return redirectWithAuthError(request, nextPath, "supabase_config_missing")
  }

  const supabaseClient = createClient(config.url, config.publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  const { data, error } = await supabaseClient.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  })
  const session = data.session

  if (error || !session?.access_token || !session.refresh_token) {
    return redirectWithAuthError(
      request,
      nextPath,
      error?.message ?? "auth_confirmation_failed",
    )
  }

  const targetUrl = new URL(nextPath, request.url)
  targetUrl.hash = new URLSearchParams({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  }).toString()

  return NextResponse.redirect(targetUrl)
}
