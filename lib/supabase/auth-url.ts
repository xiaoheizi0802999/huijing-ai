export type SupabaseAuthUrlParams = {
  accessToken?: string
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
      refreshToken: readParam(hashParams, "refresh_token"),
      code: readParam(url.searchParams, "code"),
      tokenHash: readParam(url.searchParams, "token_hash"),
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
    const { data, error } = await supabaseClient.auth.verifyOtp({
      token_hash: authParams.tokenHash,
      type: authParams.type === "magiclink" ? "magiclink" : "email",
    })

    return error
      ? { message: error.message, status: "failed" }
      : { session: data.session, status: "completed" }
  }

  return { status: "skipped" }
}

export function removeSupabaseAuthParamsFromUrl(value: string) {
  try {
    const url = new URL(value)
    const authSearchParams = [
      "code",
      "error",
      "error_code",
      "error_description",
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
