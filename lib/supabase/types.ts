import type { GenerationHistoryItem } from "@/lib/generation-history"

export type AuthenticatedUser = {
  email: string | null
  id: string
}

export type CreditProfile = {
  credits: number
  granted?: number
  userId: string
}

export type CloudGenerationInput = {
  aspectRatio: string
  imageType: string
  mood: string
  quality: string
  subject: string
}

export type CloudGenerationRecord = GenerationHistoryItem & {
  cloudId: string
}

export type CloudGenerationRow = {
  aspect_ratio: string
  created_at: string
  id: string
  image_type: string
  image_url: string
  optimized_prompt: string
  original_input: unknown
  storage_path: string
  style: string
  user_id: string
}

