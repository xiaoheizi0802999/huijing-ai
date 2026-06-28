const defaultPublicAuthRedirectOrigin = "https://huijing-ai.vercel.app"

function cleanRedirectValue(value: string | undefined) {
  return value?.replace(/\uFEFF/g, "").trim()
}

function normalizeOrigin(value: string | undefined) {
  const cleanedValue = cleanRedirectValue(value)

  if (!cleanedValue) {
    return null
  }

  try {
    return new URL(cleanedValue).origin
  } catch {
    return null
  }
}

function isLoopbackOrigin(origin: string) {
  try {
    const { hostname } = new URL(origin)
    const normalizedHostname = hostname.toLowerCase()

    return (
      normalizedHostname === "localhost" ||
      normalizedHostname === "127.0.0.1" ||
      normalizedHostname === "0.0.0.0" ||
      normalizedHostname === "::1" ||
      normalizedHostname === "[::1]"
    )
  } catch {
    return true
  }
}

function readBrowserOrigin() {
  if (typeof window === "undefined") {
    return undefined
  }

  return window.location.origin
}

function joinOriginAndPath(origin: string, path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`

  return new URL(normalizedPath, origin).toString()
}

export function getSupabaseEmailRedirectTo(path: string) {
  const explicitOrigin = normalizeOrigin(
    process.env.NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN,
  )

  if (explicitOrigin) {
    return joinOriginAndPath(explicitOrigin, path)
  }

  const candidateOrigins = [
    normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL),
    normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL),
    normalizeOrigin(readBrowserOrigin()),
    defaultPublicAuthRedirectOrigin,
  ].filter((origin): origin is string => Boolean(origin))

  const publicOrigin =
    candidateOrigins.find((origin) => !isLoopbackOrigin(origin)) ??
    defaultPublicAuthRedirectOrigin

  return joinOriginAndPath(publicOrigin, path)
}
