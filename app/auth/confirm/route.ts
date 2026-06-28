import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { getSupabasePublicConfig } from "@/lib/supabase/config"

type EmailVerificationType = "email" | "magiclink"

type SupabaseEmailVerifier = {
  auth: {
    verifyOtp: (params: {
      token_hash: string
      type: EmailVerificationType
    }) => Promise<{
      data: {
        session: {
          access_token?: string
          refresh_token?: string
        } | null
      }
      error: {
        message: string
      } | null
    }>
  }
}

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

async function verifyEmailTokenHash({
  supabaseClient,
  tokenHash,
  type,
}: {
  supabaseClient: SupabaseEmailVerifier
  tokenHash: string
  type: EmailVerificationType
}) {
  const verificationTypes: EmailVerificationType[] =
    type === "magiclink" ? ["magiclink", "email"] : ["email", "magiclink"]
  let lastResult: Awaited<
    ReturnType<typeof supabaseClient.auth.verifyOtp>
  > | null = null

  for (const verificationType of verificationTypes) {
    const result = await supabaseClient.auth.verifyOtp({
      token_hash: tokenHash,
      type: verificationType,
    })
    lastResult = result

    if (result.data.session?.access_token && result.data.session.refresh_token) {
      return result
    }
  }

  return lastResult
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
  const verificationResult = await verifyEmailTokenHash({
    supabaseClient,
    tokenHash,
    type,
  })
  const { data, error } = verificationResult ?? {
    data: {
      session: null,
    },
    error: {
      message: "auth_confirmation_failed",
    },
  }
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
