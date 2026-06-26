import { NextResponse } from "next/server"
import {
  SEEDREAM_ENDPOINT,
  SEEDREAM_MODEL,
  type SeedreamAspectRatio,
  type SeedreamInput,
  type SeedreamQuality,
  buildSeedreamPayload,
  extractSeedreamImage,
} from "@/lib/seedream"

const defaultInput: Omit<SeedreamInput, "subject"> = {
  aspectRatio: "16:9",
  imageType: "电影海报",
  mood: "黑色电影",
  quality: "2K",
}

function isAspectRatio(value: unknown): value is SeedreamAspectRatio {
  return ["1:1", "16:9", "9:16", "4:3", "3:4"].includes(String(value))
}

function isQuality(value: unknown): value is SeedreamQuality {
  return value === "2K" || value === "4K"
}

function normalizeInput(body: unknown): SeedreamInput | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "请先填写主体描述，再生成画面。" }
  }

  const record = body as Record<string, unknown>
  const aspectRatio = record.aspectRatio
  const quality = record.quality
  const subject =
    typeof record.subject === "string" ? record.subject.trim() : ""

  if (subject.length < 6) {
    return { error: "主体描述再具体一点，至少写下 6 个字。" }
  }

  return {
    aspectRatio: isAspectRatio(aspectRatio)
      ? aspectRatio
      : defaultInput.aspectRatio,
    imageType:
      typeof record.imageType === "string" && record.imageType.trim()
        ? record.imageType.trim()
        : defaultInput.imageType,
    mood:
      typeof record.mood === "string" && record.mood.trim()
        ? record.mood.trim()
        : defaultInput.mood,
    quality: isQuality(quality) ? quality : defaultInput.quality,
    subject,
  }
}

export async function POST(request: Request) {
  const apiKey = process.env.VOLCENGINE_API_KEY ?? process.env.ARK_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      {
        code: "missing_api_key",
        message:
          "缺少 VOLCENGINE_API_KEY 或 ARK_API_KEY，暂时无法连接 Doubao-Seedream-4.5。",
      },
      { status: 503 },
    )
  }

  const body = await request.json().catch(() => null)
  const input = normalizeInput(body)

  if ("error" in input) {
    return NextResponse.json(
      {
        code: "invalid_request",
        message: input.error,
      },
      { status: 400 },
    )
  }

  const payload = buildSeedreamPayload(input)
  let providerResponse: Response

  try {
    providerResponse = await fetch(SEEDREAM_ENDPOINT, {
      body: JSON.stringify(payload),
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      method: "POST",
    })
  } catch {
    return NextResponse.json(
      {
        code: "provider_network_error",
        message:
          "无法连接 Doubao-Seedream-4.5，请检查本地网络、代理或防火墙后重试。",
      },
      { status: 502 },
    )
  }

  const providerJson = await providerResponse.json().catch(() => null)

  if (!providerResponse.ok) {
    return NextResponse.json(
      {
        code: "provider_error",
        message: "Doubao-Seedream-4.5 暂时没有返回可用画面，请稍后再试。",
      },
      { status: providerResponse.status || 502 },
    )
  }

  const image = extractSeedreamImage(providerJson ?? {})

  if (!image) {
    return NextResponse.json(
      {
        code: "empty_generation",
        message: "Doubao-Seedream-4.5 已响应，但没有返回图片。",
      },
      { status: 502 },
    )
  }

  return NextResponse.json({
    ...image,
    model: SEEDREAM_MODEL,
    prompt: payload.prompt,
    provider: "Doubao-Seedream-4.5",
  })
}
