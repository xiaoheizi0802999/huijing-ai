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
import {
  authenticateSupabaseRequest,
  completeCloudGeneration,
  refundGenerationCredit,
  reserveGenerationCredit,
  type SupabaseServiceClient,
} from "@/lib/supabase/server"

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

function cleanApiKey(value: string | undefined) {
  return value?.replace(/\uFEFF/g, "").trim()
}

type ReservedGenerationContext = {
  client: SupabaseServiceClient
  credits: number
  requestId: string
  userId: string
}

async function refundReservedGeneration(
  context: ReservedGenerationContext | null,
  errorCode: string,
) {
  if (!context) {
    return
  }

  try {
    await refundGenerationCredit({
      client: context.client,
      errorCode,
      requestId: context.requestId,
      userId: context.userId,
    })
  } catch (error) {
    console.error("seedream_credit_refund_error", {
      message: error instanceof Error ? error.message : "Unknown refund error",
      requestId: context.requestId,
    })
  }
}

export async function POST(request: Request) {
  const auth = await authenticateSupabaseRequest(request)

  if ("error" in auth) {
    return NextResponse.json(
      {
        code: auth.error.code,
        message:
          auth.error.code === "missing_auth_token"
            ? "请先登录后再生成图片。"
            : auth.error.message,
      },
      { status: auth.error.status },
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

  const apiKey =
    cleanApiKey(process.env.VOLCENGINE_API_KEY) ||
    cleanApiKey(process.env.ARK_API_KEY)

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

  let reservedGeneration: ReservedGenerationContext | null = null

  try {
    const reservation = await reserveGenerationCredit(auth.client, auth.user.id)

    if (reservation.state === "insufficient") {
      return NextResponse.json(
        {
          code: "insufficient_credits",
          credits: reservation.credits,
          message: "积分不足，升级后可解锁更多创作次数。",
        },
        { status: 402 },
      )
    }

    reservedGeneration = {
      client: auth.client,
      credits: reservation.credits,
      requestId: reservation.requestId,
      userId: auth.user.id,
    }
  } catch {
    return NextResponse.json(
      {
        code: "credit_reservation_failed",
        message: "暂时无法扣除创作积分，请稍后再试。",
      },
      { status: 502 },
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
  } catch (error) {
    const providerError = error instanceof Error ? error : null

    console.error("seedream_provider_network_error", {
      cause:
        providerError && "cause" in providerError
          ? String(providerError.cause)
          : undefined,
      endpoint: SEEDREAM_ENDPOINT,
      message: providerError?.message,
      name: providerError?.name,
    })

    await refundReservedGeneration(
      reservedGeneration,
      "provider_network_error",
    )

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
    await refundReservedGeneration(reservedGeneration, "provider_error")

    if (providerResponse.status === 401 || providerResponse.status === 403) {
      return NextResponse.json(
        {
          code: "provider_auth_error",
          message:
            "火山方舟 API Key 无效或没有开通 Doubao-Seedream-4.5，请检查 VOLCENGINE_API_KEY。",
        },
        { status: providerResponse.status },
      )
    }

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
    await refundReservedGeneration(reservedGeneration, "empty_generation")

    return NextResponse.json(
      {
        code: "empty_generation",
        message: "Doubao-Seedream-4.5 已响应，但没有返回图片。",
      },
      { status: 502 },
    )
  }

  let generationId: string | undefined

  if (reservedGeneration) {
    try {
      generationId = await completeCloudGeneration({
        client: reservedGeneration.client,
        imageUrl: image.imageUrl,
        input,
        prompt: payload.prompt,
        requestId: reservedGeneration.requestId,
        userId: reservedGeneration.userId,
      })
    } catch {
      await refundReservedGeneration(
        reservedGeneration,
        "history_persist_failed",
      )

      return NextResponse.json(
        {
          code: "history_persist_failed",
          message: "图片已生成，但云端历史保存失败，请稍后重试。",
        },
        { status: 502 },
      )
    }
  }

  return NextResponse.json({
    credits: reservedGeneration?.credits,
    generationId,
    ...image,
    model: SEEDREAM_MODEL,
    prompt: payload.prompt,
    provider: "Doubao-Seedream-4.5",
  })
}
