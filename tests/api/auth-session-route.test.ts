import { afterEach, describe, expect, it, vi } from "vitest"

describe("/api/auth/session", () => {
  afterEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
  })

  it("returns a readable error when the bearer token is missing", async () => {
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
    const { GET } = await import("@/app/api/auth/session/route")

    const response = await GET(new Request("http://localhost/api/auth/session"))
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body).toEqual({
      code: "missing_auth_token",
      message: "请先登录后再继续创作。",
    })
  })

  it("returns the signed-in user and current credits", async () => {
    const claimDailyCredits = vi.fn(async () => ({
      credits: 5,
      granted: 0,
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
    const { GET } = await import("@/app/api/auth/session/route")

    const response = await GET(
      new Request("http://localhost/api/auth/session", {
        headers: {
          authorization: "Bearer token-1",
        },
      }),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(claimDailyCredits).toHaveBeenCalledWith({}, "user-1")
    expect(body).toEqual({
      credits: 5,
      granted: 0,
      user: {
        email: "director@example.com",
        id: "user-1",
      },
    })
  })
})
