import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const originalArkApiKey = process.env.ARK_API_KEY
const originalVolcengineApiKey = process.env.VOLCENGINE_API_KEY
const supabaseServerMock = vi.hoisted(() => ({
  authenticateSupabaseRequest: vi.fn(),
  completeCloudGeneration: vi.fn(),
  refundGenerationCredit: vi.fn(),
  reserveGenerationCredit: vi.fn(),
}))

vi.mock("@/lib/supabase/server", () => supabaseServerMock)

function createRequest(body: unknown) {
  return new Request("http://localhost/api/generate-image", {
    body: JSON.stringify(body),
    headers: {
      authorization: "Bearer token-1",
      "content-type": "application/json",
    },
    method: "POST",
  })
}

function createGuestRequest(body: unknown) {
  return new Request("http://localhost/api/generate-image", {
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  })
}

describe("/api/generate-image", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
    process.env.ARK_API_KEY = "test-ark-key"
    delete process.env.VOLCENGINE_API_KEY
    supabaseServerMock.authenticateSupabaseRequest.mockReset()
    supabaseServerMock.completeCloudGeneration.mockReset()
    supabaseServerMock.refundGenerationCredit.mockReset()
    supabaseServerMock.reserveGenerationCredit.mockReset()
    supabaseServerMock.authenticateSupabaseRequest.mockImplementation(
      async (request: Request) =>
        request.headers.get("authorization")
          ? {
              client: {},
              token: "token-1",
              user: {
                email: "director@example.com",
                id: "user-1",
              },
            }
          : {
              error: {
                code: "missing_auth_token",
                message: "请先登录后再继续创作。",
                status: 401,
              },
            },
    )
    supabaseServerMock.completeCloudGeneration.mockResolvedValue(
      "cloud-generation-1",
    )
    supabaseServerMock.refundGenerationCredit.mockResolvedValue(5)
    supabaseServerMock.reserveGenerationCredit.mockResolvedValue({
      credits: 4,
      requestId: "request-1",
      state: "reserved",
    })
  })

  afterEach(() => {
    process.env.ARK_API_KEY = originalArkApiKey
    process.env.VOLCENGINE_API_KEY = originalVolcengineApiKey
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it("requires login before image generation starts", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    const { POST } = await import("@/app/api/generate-image/route")

    const response = await POST(
      createGuestRequest({
        subject: "黑色摄影棚中的银色概念跑车",
      }),
    )
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(body).toEqual({
      code: "missing_auth_token",
      message: "请先登录后再生成图片。",
    })
  })

  it("returns a polished missing-key error when ARK_API_KEY is absent", async () => {
    delete process.env.ARK_API_KEY
    const { POST } = await import("@/app/api/generate-image/route")

    const response = await POST(
      createRequest({
        subject: "雨夜中的银色跑车",
      }),
    )
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body).toEqual({
      code: "missing_api_key",
      message:
        "缺少 VOLCENGINE_API_KEY 或 ARK_API_KEY，暂时无法连接 Doubao-Seedream-4.5。",
    })
  })

  it("uses VOLCENGINE_API_KEY when ARK_API_KEY is absent", async () => {
    delete process.env.ARK_API_KEY
    process.env.VOLCENGINE_API_KEY = "test-volcengine-key"
    const fetchMock = vi.fn(async () =>
      Response.json({
        data: [{ url: "https://example.com/volcengine-generated.png" }],
      }),
    )
    vi.stubGlobal("fetch", fetchMock)
    const { POST } = await import("@/app/api/generate-image/route")

    const response = await POST(
      createRequest({
        subject: "黑色水面上的银白香水瓶广告大片",
      }),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledWith(
      "https://ark.cn-beijing.volces.com/api/v3/images/generations",
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: "Bearer test-volcengine-key",
        }),
      }),
    )
    expect(body.imageUrl).toBe("https://example.com/volcengine-generated.png")
  })

  it("removes invisible copy artifacts from VOLCENGINE_API_KEY before sending it", async () => {
    delete process.env.ARK_API_KEY
    process.env.VOLCENGINE_API_KEY = "\uFEFFtest-volcengine-key \n"
    const fetchMock = vi.fn(async () =>
      Response.json({
        data: [{ url: "https://example.com/clean-key-generated.png" }],
      }),
    )
    vi.stubGlobal("fetch", fetchMock)
    const { POST } = await import("@/app/api/generate-image/route")

    const response = await POST(
      createRequest({
        subject: "黑色水面上的银白香水瓶广告大片",
      }),
    )

    expect(response.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledWith(
      "https://ark.cn-beijing.volces.com/api/v3/images/generations",
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: "Bearer test-volcengine-key",
        }),
      }),
    )
  })

  it("validates that the subject brief is meaningful", async () => {
    const { POST } = await import("@/app/api/generate-image/route")

    const response = await POST(createRequest({ subject: "雨" }))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.code).toBe("invalid_request")
    expect(body.message).toContain("主体描述")
  })

  it("calls Ark with Seedream 4.5 and returns the generated image URL", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        data: [{ url: "https://example.com/generated.png" }],
      }),
    )
    vi.stubGlobal("fetch", fetchMock)
    const { POST } = await import("@/app/api/generate-image/route")

    const response = await POST(
      createRequest({
        aspectRatio: "16:9",
        colorPalette: "深红剧场",
        imageType: "电影海报",
        mood: "黑色电影",
        quality: "2K",
        subject: "一位站在雨夜高楼边缘的未来城市导演",
      }),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock).toHaveBeenCalledWith(
      "https://ark.cn-beijing.volces.com/api/v3/images/generations",
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: "Bearer test-ark-key",
          "content-type": "application/json",
        }),
        method: "POST",
      }),
    )
    const requestInit = (
      fetchMock.mock.calls as unknown as [string, RequestInit][]
    )[0]?.[1]

    expect(requestInit).toBeDefined()
    expect(JSON.parse(requestInit?.body as string)).toMatchObject({
      model: "doubao-seedream-4-5-251128",
      prompt: expect.stringContaining("deep crimson"),
      response_format: "url",
      size: "2K",
      watermark: false,
    })
    expect(body).toMatchObject({
      imageUrl: "https://example.com/generated.png",
      model: "doubao-seedream-4-5-251128",
      provider: "Doubao-Seedream-4.5",
    })
  })

  it("reserves one credit and stores cloud history for signed-in generations", async () => {
    const reserveGenerationCredit = vi.fn(async () => ({
      credits: 4,
      requestId: "request-1",
      state: "reserved",
    }))
    const completeCloudGeneration = vi.fn(async () => "cloud-generation-1")
    const refundGenerationCredit = vi.fn()
    supabaseServerMock.authenticateSupabaseRequest.mockResolvedValue({
        client: { service: true },
        token: "token-1",
        user: {
          email: "director@example.com",
          id: "user-1",
        },
      })
    supabaseServerMock.completeCloudGeneration.mockImplementation(
      completeCloudGeneration,
    )
    supabaseServerMock.refundGenerationCredit.mockImplementation(
      refundGenerationCredit,
    )
    supabaseServerMock.reserveGenerationCredit.mockImplementation(
      reserveGenerationCredit,
    )
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          data: [{ url: "https://example.com/cloud-generated.png" }],
        }),
      ),
    )
    const { POST } = await import("@/app/api/generate-image/route")

    const response = await POST(
      new Request("http://localhost/api/generate-image", {
        body: JSON.stringify({
          aspectRatio: "16:9",
          imageType: "电影海报",
          mood: "黑色电影",
          quality: "2K",
          subject: "黑色摄影棚中的银色概念跑车",
        }),
        headers: {
          authorization: "Bearer token-1",
          "content-type": "application/json",
        },
        method: "POST",
      }),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(reserveGenerationCredit).toHaveBeenCalledWith(
      { service: true },
      "user-1",
    )
    expect(completeCloudGeneration).toHaveBeenCalledWith(
      expect.objectContaining({
        client: { service: true },
        imageUrl: "https://example.com/cloud-generated.png",
        requestId: "request-1",
        userId: "user-1",
      }),
    )
    expect(refundGenerationCredit).not.toHaveBeenCalled()
    expect(body).toMatchObject({
      credits: 4,
      generationId: "cloud-generation-1",
      imageUrl: "https://example.com/cloud-generated.png",
    })
  })

  it("does not call the image provider when signed-in users have no credits", async () => {
    supabaseServerMock.authenticateSupabaseRequest.mockResolvedValue({
        client: {},
        token: "token-1",
        user: {
          email: "director@example.com",
          id: "user-1",
        },
      })
    supabaseServerMock.completeCloudGeneration.mockReset()
    supabaseServerMock.refundGenerationCredit.mockReset()
    supabaseServerMock.reserveGenerationCredit.mockResolvedValue({
      credits: 0,
      state: "insufficient",
    })
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    const { POST } = await import("@/app/api/generate-image/route")

    const response = await POST(
      new Request("http://localhost/api/generate-image", {
        body: JSON.stringify({
          subject: "黑色摄影棚中的银色概念跑车",
        }),
        headers: {
          authorization: "Bearer token-1",
          "content-type": "application/json",
        },
        method: "POST",
      }),
    )
    const body = await response.json()

    expect(response.status).toBe(402)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(body).toEqual({
      code: "insufficient_credits",
      credits: 0,
      message: "积分不足，升级后可解锁更多创作次数。",
    })
  })

  it("refunds the reserved credit when the provider request fails", async () => {
    const refundGenerationCredit = vi.fn(async () => 5)
    supabaseServerMock.authenticateSupabaseRequest.mockResolvedValue({
        client: {},
        token: "token-1",
        user: {
          email: "director@example.com",
          id: "user-1",
        },
      })
    supabaseServerMock.completeCloudGeneration.mockReset()
    supabaseServerMock.refundGenerationCredit.mockImplementation(
      refundGenerationCredit,
    )
    supabaseServerMock.reserveGenerationCredit.mockResolvedValue({
      credits: 4,
      requestId: "request-1",
      state: "reserved",
    })
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed")
      }),
    )
    const { POST } = await import("@/app/api/generate-image/route")

    const response = await POST(
      new Request("http://localhost/api/generate-image", {
        body: JSON.stringify({
          subject: "黑色摄影棚中的银色概念跑车",
        }),
        headers: {
          authorization: "Bearer token-1",
          "content-type": "application/json",
        },
        method: "POST",
      }),
    )

    expect(response.status).toBe(502)
    expect(refundGenerationCredit).toHaveBeenCalledWith({
      client: {},
      errorCode: "provider_network_error",
      requestId: "request-1",
      userId: "user-1",
    })
  })

  it("returns a readable JSON error when the provider network request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed")
      }),
    )
    const { POST } = await import("@/app/api/generate-image/route")

    const response = await POST(
      createRequest({
        aspectRatio: "16:9",
        imageType: "电影海报",
        mood: "黑色电影",
        quality: "2K",
        subject: "一位站在雨夜高楼边缘的未来城市导演",
      }),
    )
    const body = await response.json()

    expect(response.status).toBe(502)
    expect(body).toEqual({
      code: "provider_network_error",
      message:
        "无法连接 Doubao-Seedream-4.5，请检查本地网络、代理或防火墙后重试。",
    })
  })

  it("returns a clear auth error when Ark rejects the API key", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          {
            error: {
              code: "Unauthorized",
              message: "Unauthorized",
            },
          },
          { status: 401 },
        ),
      ),
    )
    const { POST } = await import("@/app/api/generate-image/route")

    const response = await POST(
      createRequest({
        aspectRatio: "16:9",
        imageType: "电影海报",
        mood: "黑色电影",
        quality: "2K",
        subject: "一位站在雨夜高楼边缘的未来城市导演",
      }),
    )
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body).toEqual({
      code: "provider_auth_error",
      message:
        "火山方舟 API Key 无效或没有开通 Doubao-Seedream-4.5，请检查 VOLCENGINE_API_KEY。",
    })
  })
})
