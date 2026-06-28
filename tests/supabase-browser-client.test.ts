import { afterEach, describe, expect, it, vi } from "vitest"

const supabaseJsMock = vi.hoisted(() => ({
  createClient: vi.fn(() => ({ auth: {} })),
}))

vi.mock("@supabase/supabase-js", () => ({
  createClient: supabaseJsMock.createClient,
}))

describe("Supabase browser client", () => {
  afterEach(() => {
    supabaseJsMock.createClient.mockClear()
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  it("uses implicit email auth so magic links can open in email browsers", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key")
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co")
    const { createSupabaseBrowserClient } = await import("@/lib/supabase/client")

    createSupabaseBrowserClient()

    expect(supabaseJsMock.createClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "publishable-key",
      expect.objectContaining({
        auth: expect.objectContaining({
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: "implicit",
          persistSession: true,
        }),
      }),
    )
  })
})
