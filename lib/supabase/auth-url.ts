export type SupabaseAuthUrlParams = {
  accessToken?: string
  refreshToken?: string
  code?: string
  tokenHash?: string
  type?: "email" | "magiclink"
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
