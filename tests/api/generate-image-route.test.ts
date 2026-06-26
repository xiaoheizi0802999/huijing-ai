import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const originalArkApiKey = process.env.ARK_API_KEY
const originalVolcengineApiKey = process.env.VOLCENGINE_API_KEY

function createRequest(body: unknown) {
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
  })

  afterEach(() => {
    process.env.ARK_API_KEY = originalArkApiKey
    process.env.VOLCENGINE_API_KEY = originalVolcengineApiKey
    vi.restoreAllMocks()
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
