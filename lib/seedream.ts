export const SEEDREAM_MODEL = "doubao-seedream-4-5-251128"

export const SEEDREAM_ENDPOINT =
  "https://ark.cn-beijing.volces.com/api/v3/images/generations"

export type SeedreamQuality = "2K" | "4K"

export type SeedreamAspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4"

export type SeedreamInput = {
  aspectRatio: SeedreamAspectRatio
  imageType: string
  mood: string
  quality: SeedreamQuality
  subject: string
}

export type SeedreamPayload = {
  aspect_ratio: SeedreamAspectRatio
  model: typeof SEEDREAM_MODEL
  prompt: string
  response_format: "url"
  size: SeedreamQuality
  watermark: false
}

type ProviderImage = {
  b64_json?: unknown
  url?: unknown
}

type ProviderResponse = {
  data?: unknown
  error?: unknown
}

export function buildSeedreamPrompt(input: SeedreamInput) {
  const subject = input.subject.trim()
  const imageType = input.imageType.trim()
  const mood = input.mood.trim()

  return [
    subject,
    `Image type: ${imageType}. Mood: ${mood}. Aspect ratio: ${input.aspectRatio}.`,
    "Create a cinematic, premium editorial composition with black, graphite, silver-white, and restrained cold highlights.",
    "Use luxury brand film lighting, strong contrast, controlled negative space, fine grain, subtle depth of field, and poster-level composition.",
    "Make it feel like a still frame from a high-end film campaign, not a generic SaaS illustration.",
    "Avoid cartoon style, candy colors, busy gradients, cheap glow effects, distorted hands, unreadable text, and low-quality artifacts.",
    "no cheap gradients, no playful illustration, cinematic realism, art magazine cover quality.",
  ].join("\n")
}

export function buildSeedreamPayload(input: SeedreamInput): SeedreamPayload {
  return {
    aspect_ratio: input.aspectRatio,
    model: SEEDREAM_MODEL,
    prompt: buildSeedreamPrompt(input),
    response_format: "url",
    size: input.quality,
    watermark: false,
  }
}

export function extractSeedreamImage(response: ProviderResponse) {
  if (!Array.isArray(response.data)) {
    return null
  }

  const firstImage = response.data[0] as ProviderImage | undefined

  if (typeof firstImage?.url === "string" && firstImage.url.length > 0) {
    return { imageUrl: firstImage.url }
  }

  if (
    typeof firstImage?.b64_json === "string" &&
    firstImage.b64_json.length > 0
  ) {
    return { imageUrl: `data:image/png;base64,${firstImage.b64_json}` }
  }

  return null
}
