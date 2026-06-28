import { afterEach, describe, expect, it, vi } from "vitest"

describe("/api/generation-history", () => {
  afterEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
    vi.doUnmock("@/lib/supabase/server")
  })

  it("requires authentication before listing cloud history", async () => {
    vi.doMock("@/lib/supabase/server", () => ({
      authenticateSupabaseRequest: vi.fn(async () => ({
        error: {
          code: "missing_auth_token",
          message: "请先登录后再查看云端历史。",
          status: 401,
        },
      })),
      listCloudGenerationHistory: vi.fn(),
    }))
    const { GET } = await import("@/app/api/generation-history/route")

    const response = await GET(
      new Request("http://localhost/api/generation-history"),
    )
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.code).toBe("missing_auth_token")
  })

  it("lists signed-in user's cloud history in cinematic history format", async () => {
    const listCloudGenerationHistory = vi.fn(async () => [
      {
        aspectRatio: "16:9",
        cloudId: "cloud-1",
        createdAt: "2026-06-27T02:00:00.000Z",
        id: "cloud-1",
        imageType: "产品摄影",
        imageUrl: "https://example.com/cloud-frame.png",
        mood: "奢侈品牌广告片",
        prompt: "cloud prompt",
        quality: "2K",
        subject: "银白香水瓶",
      },
    ])
    vi.doMock("@/lib/supabase/server", () => ({
      authenticateSupabaseRequest: vi.fn(async () => ({
        client: {},
        token: "token-1",
        user: {
          email: "director@example.com",
          id: "user-1",
        },
      })),
      listCloudGenerationHistory,
    }))
    const { GET } = await import("@/app/api/generation-history/route")

    const response = await GET(
      new Request("http://localhost/api/generation-history", {
        headers: {
          authorization: "Bearer token-1",
        },
      }),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(listCloudGenerationHistory).toHaveBeenCalledWith({}, "user-1")
    expect(body.history).toHaveLength(1)
    expect(body.history[0]).toMatchObject({
      cloudId: "cloud-1",
      imageUrl: "https://example.com/cloud-frame.png",
      subject: "银白香水瓶",
    })
  })

  it("deletes a signed-in user's cloud history item", async () => {
    const deleteCloudGenerationHistoryItem = vi.fn(async () => true)
    vi.doMock("@/lib/supabase/server", () => ({
      authenticateSupabaseRequest: vi.fn(async () => ({
        client: {},
        token: "token-1",
        user: {
          email: "director@example.com",
          id: "user-1",
        },
      })),
      deleteCloudGenerationHistoryItem,
    }))
    const { DELETE } = await import("@/app/api/generation-history/[id]/route")

    const response = await DELETE(
      new Request("http://localhost/api/generation-history/cloud-1", {
        headers: {
          authorization: "Bearer token-1",
        },
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: "cloud-1" }) },
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(deleteCloudGenerationHistoryItem).toHaveBeenCalledWith(
      {},
      "user-1",
      "cloud-1",
    )
    expect(body).toEqual({ deleted: true })
  })
})
