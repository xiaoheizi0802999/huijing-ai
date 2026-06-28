import { describe, expect, it } from "vitest"
import {
  SEEDREAM_ENDPOINT,
  SEEDREAM_MODEL,
  buildSeedreamPayload,
  buildSeedreamPrompt,
  extractSeedreamImage,
} from "@/lib/seedream"

describe("Seedream request helpers", () => {
  it("uses the selected Doubao-Seedream-4.5 model and Ark endpoint", () => {
    expect(SEEDREAM_MODEL).toBe("doubao-seedream-4-5-251128")
    expect(SEEDREAM_ENDPOINT).toBe(
      "https://ark.cn-beijing.volces.com/api/v3/images/generations",
    )
  })

  it("turns a simple creative brief into cinematic visual language", () => {
    const input = {
      aspectRatio: "16:9",
      colorPalette: "暖金胶片",
      imageType: "电影海报",
      mood: "黑色电影",
      quality: "2K",
      subject: "一位站在雨夜高楼边缘的未来城市导演",
    } as const
    const prompt = buildSeedreamPrompt({
      ...input,
    })

    expect(prompt).toContain("一位站在雨夜高楼边缘的未来城市导演")
    expect(prompt).toContain("电影海报")
    expect(prompt).toContain("黑色电影")
    expect(prompt).toContain("暖金胶片")
    expect(prompt).toContain("warm amber")
    expect(prompt).toContain("cinematic")
    expect(prompt).toContain("premium editorial composition")
    expect(prompt).toContain("no cheap gradients")
  })

  it("builds an Ark image generation payload without exposing client secrets", () => {
    const payload = buildSeedreamPayload({
      aspectRatio: "1:1",
      imageType: "产品摄影",
      mood: "奢侈品牌广告片",
      quality: "4K",
      subject: "黑色香水瓶置于银色冷光之中",
    })

    expect(payload).toMatchObject({
      model: SEEDREAM_MODEL,
      response_format: "url",
      size: "4K",
      watermark: false,
    })
    expect(payload.prompt).toContain("产品摄影")
    expect(payload.prompt).toContain("1:1")
    expect(JSON.stringify(payload)).not.toContain("ARK_API_KEY")
  })

  it("extracts image URLs and base64 images from provider responses", () => {
    expect(
      extractSeedreamImage({
        data: [{ url: "https://example.com/frame.png" }],
      }),
    ).toEqual({ imageUrl: "https://example.com/frame.png" })

    expect(
      extractSeedreamImage({
        data: [{ b64_json: "abc123" }],
      }),
    ).toEqual({ imageUrl: "data:image/png;base64,abc123" })
  })

  it("returns null for provider responses without an image", () => {
    expect(extractSeedreamImage({ data: [] })).toBeNull()
    expect(extractSeedreamImage({ error: { message: "bad request" } })).toBeNull()
  })
})
