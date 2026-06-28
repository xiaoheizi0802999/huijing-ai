import { afterEach, describe, expect, it, vi } from "vitest"

const supabaseMock = vi.hoisted(() => ({
  verifyOtp: vi.fn(),
}))

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: {
      verifyOtp: supabaseMock.verifyOtp,
    },
  })),
}))

describe("/auth/confirm", () => {
  afterEach(() => {
    supabaseMock.verifyOtp.mockReset()
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  it("verifies a token hash and redirects back with a short-lived session hash", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key")
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co")
    supabaseMock.verifyOtp.mockResolvedValue({
      data: {
        session: {
          access_token: "access-1",
          refresh_token: "refresh-1",
        },
      },
      error: null,
    })
    const { GET } = await import("@/app/auth/confirm/route")

    const response = await GET(
      new Request(
        "http://localhost/auth/confirm?token_hash=hash-1&type=email&next=/generate/history",
      ),
    )

    expect(supabaseMock.verifyOtp).toHaveBeenCalledWith({
      token_hash: "hash-1",
      type: "email",
    })
    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toBe(
      "http://localhost/generate/history#access_token=access-1&refresh_token=refresh-1",
    )
  })

  it("keeps confirmation redirects inside the site", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key")
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co")
    supabaseMock.verifyOtp.mockResolvedValue({
      data: {
        session: {
          access_token: "access-2",
          refresh_token: "refresh-2",
        },
      },
      error: null,
    })
    const { GET } = await import("@/app/auth/confirm/route")

    const response = await GET(
      new Request(
        "http://localhost/auth/confirm?token_hash=hash-2&type=email&next=https://evil.example",
      ),
    )

    expect(response.headers.get("location")).toBe(
      "http://localhost/generate#access_token=access-2&refresh_token=refresh-2",
    )
  })

  it("accepts same-origin absolute next URLs from Supabase email templates", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key")
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co")
    supabaseMock.verifyOtp.mockResolvedValue({
      data: {
        session: {
          access_token: "access-3",
          refresh_token: "refresh-3",
        },
      },
      error: null,
    })
    const { GET } = await import("@/app/auth/confirm/route")

    const response = await GET(
      new Request(
        "http://localhost/auth/confirm?token_hash=hash-3&type=email&next=http%3A%2F%2Flocalhost%2Fgenerate%2Fhistory",
      ),
    )

    expect(response.headers.get("location")).toBe(
      "http://localhost/generate/history#access_token=access-3&refresh_token=refresh-3",
    )
  })
})
