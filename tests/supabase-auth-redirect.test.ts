import { afterEach, expect, it, vi } from "vitest"
import { getSupabaseEmailRedirectTo } from "@/lib/supabase/auth-redirect"

afterEach(() => {
  vi.unstubAllEnvs()
})

it("does not send mobile email login links back to loopback hosts", () => {
  vi.stubEnv("NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN", "")
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "")
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://127.0.0.1:3000")

  expect(getSupabaseEmailRedirectTo("/generate")).toBe(
    "https://huijing-ai.vercel.app/generate",
  )
})

it("uses an explicit public auth redirect origin when configured", () => {
  vi.stubEnv("NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN", "http://192.168.1.8:3000")

  expect(getSupabaseEmailRedirectTo("/generate/history")).toBe(
    "http://192.168.1.8:3000/generate/history",
  )
})

it("uses a public app URL before falling back to the default production site", () => {
  vi.stubEnv("NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN", "")
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "")
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.com")

  expect(getSupabaseEmailRedirectTo("generate")).toBe(
    "https://example.com/generate",
  )
})
