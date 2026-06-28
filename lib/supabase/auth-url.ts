export type SupabaseAuthUrlParams = {
  accessToken?: string
  authError?: string
  refreshToken?: string
  code?: string
  tokenHash?: string
  type?: "email" | "magiclink"
}

type SupabaseAuthSession = {
  access_token?: string
  user?: {
    email?: string | null
    id?: string | null
  }
} | null

type SupabaseAuthClient = {
  auth: {
    exchangeCodeForSession: (code: string) => Promise<{
      data: { session: SupabaseAuthSession }
      error: { message: string } | null
    }>
    setSession: (session: {
      access_token: string
      refresh_token: string
    }) => Promise<{
      data: { session: SupabaseAuthSession }
      error: { message: string } | null
    }>
    verifyOtp: (params: {
      token_hash: string
      type: "email" | "magiclink"
    }) => Promise<{
      data: { session: SupabaseAuthSession }
      error: { message: string } | null
    }>
  }
}

export type SupabaseAuthCompletionResult =
  | {
      session: SupabaseAuthSession
      status: "completed"
    }
  | {
      message: string
      status: "failed"
    }
  | {
      status: "skipped"
    }

function readParam(search: URLSearchParams, key: string) {
  return search.get(key) || undefined
}

async function verifyEmailTokenHash({
  supabaseClient,
  tokenHash,
  type,
}: {
  supabaseClient: SupabaseAuthClient
  tokenHash: string
  type: "email" | "magiclink"
}) {
  const verificationTypes: Array<"email" | "magiclink"> =
    type === "magiclink" ? ["magiclink", "email"] : ["email", "magiclink"]
  let lastResult: Awaited<
    ReturnType<SupabaseAuthClient["auth"]["verifyOtp"]>
  > | null = null

  for (const verificationType of verificationTypes) {
    const result = await supabaseClient.auth.verifyOtp({
      token_hash: tokenHash,
      type: verificationType,
    })
    lastResult = result

    if (result.data.session?.access_token) {
      return result
    }
  }

  return lastResult
}

export function parseSupabaseAuthUrl(value: string) {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return null
  }

  try {
    const url = new URL(trimmedValue)
    const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""))
    const type = readParam(url.searchParams, "type")

    return {
      accessToken: readParam(hashParams, "access_token"),
      authError: readParam(url.searchParams, "auth_error"),
      refreshToken: readParam(hashParams, "refresh_token"),
      code: readParam(url.searchParams, "code"),
      tokenHash:
        readParam(url.searchParams, "token_hash") ??
        readParam(url.searchParams, "token"),
      type: type === "magiclink" ? "magiclink" : type === "email" ? "email" : undefined,
    } satisfies SupabaseAuthUrlParams
  } catch {
    return null
  }
}

export async function completeSupabaseAuthFromUrl(
  supabaseClient: SupabaseAuthClient,
  value: string,
): Promise<SupabaseAuthCompletionResult> {
  const authParams = parseSupabaseAuthUrl(value)

  if (!authParams) {
    return { status: "skipped" }
  }

  if (authParams.authError) {
    return {
      message: authParams.authError,
      status: "failed",
    }
  }

  if (authParams.accessToken && authParams.refreshToken) {
    const { data, error } = await supabaseClient.auth.setSession({
      access_token: authParams.accessToken,
      refresh_token: authParams.refreshToken,
    })

    return error
      ? { message: error.message, status: "failed" }
      : { session: data.session, status: "completed" }
  }

  if (authParams.code) {
    const { data, error } =
      await supabaseClient.auth.exchangeCodeForSession(authParams.code)

    return error
      ? { message: error.message, status: "failed" }
      : { session: data.session, status: "completed" }
  }

  if (authParams.tokenHash) {
    const verificationResult = await verifyEmailTokenHash({
      supabaseClient,
      tokenHash: authParams.tokenHash,
      type: authParams.type === "magiclink" ? "magiclink" : "email",
    })
    const { data, error } = verificationResult ?? {
      data: {
        session: null,
      },
      error: {
        message: "auth_confirmation_failed",
      },
    }

    return error || !data.session?.access_token
      ? { message: error?.message ?? "auth_confirmation_failed", status: "failed" }
      : { session: data.session, status: "completed" }
  }

  if (/\/auth\/v1\/verify/i.test(value)) {
    return {
      message: "这是一条 Supabase 默认确认链接，但里面没有可回填的 token_hash。请直接点击邮件按钮，或把邮件模板改为使用 {{ .TokenHash }}。",
      status: "failed",
    }
  }

  return { status: "skipped" }
}

export function removeSupabaseAuthParamsFromUrl(value: string) {
  try {
    const url = new URL(value)
    const authSearchParams = [
      "auth_error",
      "code",
      "error",
      "error_code",
      "error_description",
      "token",
      "token_hash",
      "type",
    ]

    authSearchParams.forEach((key) => {
      url.searchParams.delete(key)
    })
    url.hash = ""

    return `${url.pathname}${url.search}`
  } catch {
    return "/"
  }
}
