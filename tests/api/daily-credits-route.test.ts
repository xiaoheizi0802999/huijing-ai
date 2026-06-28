import { afterEach, describe, expect, it, vi } from "vitest"

describe("/api/auth/daily-credits", () => {
  afterEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
  })

  it("requires a signed-in user before claiming daily credits", async () => {
    vi.doMock("@/lib/supabase/server", () => ({
      authenticateSupabaseRequest: vi.fn(async () => ({
        error: {
          code: "missing_auth_token",
          message: "请先登录后再继续创作。",
          status: 401,
        },
      })),
      claimDailyCredits: vi.fn(),
    }))
    const { POST } = await import("@/app/api/auth/daily-credits/route")

    const response = await POST(
      new Request("http://localhost/api/auth/daily-credits", {
        method: "POST",
      }),
    )
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.code).toBe("missing_auth_token")
  })

  it("claims daily credits through Supabase and returns the grant result", async () => {
    const claimDailyCredits = vi.fn(async () => ({
      credits: 10,
      granted: 5,
      userId: "user-1",
    }))
    vi.doMock("@/lib/supabase/server", () => ({
      authenticateSupabaseRequest: vi.fn(async () => ({
        client: {},
        token: "token-1",
        user: {
          email: "director@example.com",
          id: "user-1",
        },
      })),
      claimDailyCredits,
    }))
    const { POST } = await import("@/app/api/auth/daily-credits/route")

    const response = await POST(
      new Request("http://localhost/api/auth/daily-credits", {
        headers: {
          authorization: "Bearer token-1",
        },
        method: "POST",
      }),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(claimDailyCredits).toHaveBeenCalledWith({}, "user-1")
    expect(body).toEqual({
      credits: 10,
      granted: 5,
    })
  })
})
