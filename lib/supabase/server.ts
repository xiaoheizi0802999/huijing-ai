import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { getSupabaseServerConfig } from "@/lib/supabase/config"
import type {
  AuthenticatedUser,
  CloudGenerationInput,
  CloudGenerationRecord,
  CloudGenerationRow,
  CreditProfile,
} from "@/lib/supabase/types"

export type SupabaseServiceClient = SupabaseClient

export type SupabaseRouteError = {
  code: string
  message: string
  status: number
}

type UserProfileRow = {
  credits: number
  last_daily_credit_date: string | null
  user_id: string
}

type GenerationReservation =
  | {
      credits: number
      requestId: string
      state: "reserved"
    }
  | {
      credits: number
      state: "insufficient"
    }

export type AuthenticatedSupabaseRequest =
  | {
      client: SupabaseServiceClient
      token: string
      user: AuthenticatedUser
    }
  | {
      error: SupabaseRouteError
    }

function getTodayInShanghai() {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Shanghai",
    year: "numeric",
  }).format(new Date())
}

export function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization")

  if (!authorization?.toLowerCase().startsWith("bearer ")) {
    return null
  }

  const token = authorization.slice("bearer ".length).trim()

  return token.length > 0 ? token : null
}

export function createSupabaseServiceClient() {
  const config = getSupabaseServerConfig()

  if (!config) {
    return null
  }

  return createClient(config.url, config.secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function authenticateSupabaseRequest(
  request: Request,
): Promise<AuthenticatedSupabaseRequest> {
  const token = getBearerToken(request)

  if (!token) {
    return {
      error: {
        code: "missing_auth_token",
        message: "请先登录后再继续创作。",
        status: 401,
      },
    }
  }

  const client = createSupabaseServiceClient()

  if (!client) {
    return {
      error: {
        code: "supabase_config_missing",
        message: "Supabase 服务端配置缺失，暂时无法读取账户信息。",
        status: 503,
      },
    }
  }

  const { data, error } = await client.auth.getUser(token)

  if (error || !data.user) {
    return {
      error: {
        code: "invalid_auth_token",
        message: "登录状态已失效，请重新登录。",
        status: 401,
      },
    }
  }

  return {
    client,
    token,
    user: {
      email: data.user.email ?? null,
      id: data.user.id,
    },
  }
}

async function readProfile(
  client: SupabaseServiceClient,
  userId: string,
): Promise<UserProfileRow | null> {
  const { data, error } = await client
    .from("users_profile")
    .select("user_id, credits, last_daily_credit_date")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return (data as UserProfileRow | null) ?? null
}

async function createProfile(
  client: SupabaseServiceClient,
  userId: string,
  today: string,
) {
  const { data, error } = await client
    .from("users_profile")
    .insert({
      credits: 5,
      last_daily_credit_date: today,
      user_id: userId,
    })
    .select("user_id, credits, last_daily_credit_date")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  await client.from("credit_logs").insert({
    change_amount: 5,
    reason: "daily_grant",
    user_id: userId,
  })

  return data as UserProfileRow
}

export async function claimDailyCredits(
  client: SupabaseServiceClient,
  userId: string,
): Promise<CreditProfile> {
  const today = getTodayInShanghai()
  const existingProfile = await readProfile(client, userId)

  if (!existingProfile) {
    const profile = await createProfile(client, userId, today)

    return {
      credits: profile.credits,
      granted: 5,
      userId,
    }
  }

  if (
    existingProfile.last_daily_credit_date &&
    existingProfile.last_daily_credit_date >= today
  ) {
    return {
      credits: existingProfile.credits,
      granted: 0,
      userId,
    }
  }

  const nextCredits = existingProfile.credits + 5
  const { data, error } = await client
    .from("users_profile")
    .update({
      credits: nextCredits,
      last_daily_credit_date: today,
    })
    .eq("user_id", userId)
    .select("user_id, credits, last_daily_credit_date")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  await client.from("credit_logs").insert({
    change_amount: 5,
    reason: "daily_grant",
    user_id: userId,
  })

  return {
    credits: (data as UserProfileRow).credits,
    granted: 5,
    userId,
  }
}

export async function reserveGenerationCredit(
  client: SupabaseServiceClient,
  userId: string,
): Promise<GenerationReservation> {
  const profile = await claimDailyCredits(client, userId)

  if (profile.credits < 1) {
    return {
      credits: profile.credits,
      state: "insufficient",
    }
  }

  const requestId = crypto.randomUUID()
  const nextCredits = profile.credits - 1
  const { data, error } = await client
    .from("users_profile")
    .update({ credits: nextCredits })
    .eq("user_id", userId)
    .eq("credits", profile.credits)
    .select("credits")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  await client.from("generation_requests").insert({
    request_id: requestId,
    reserved_credits: 1,
    status: "processing",
    user_id: userId,
  })
  await client.from("credit_logs").insert({
    change_amount: -1,
    reason: "generation_reserve",
    request_id: requestId,
    user_id: userId,
  })

  return {
    credits: Number((data as { credits: number }).credits),
    requestId,
    state: "reserved",
  }
}

export async function completeCloudGeneration({
  client,
  imageUrl,
  input,
  prompt,
  requestId,
  userId,
}: {
  client: SupabaseServiceClient
  imageUrl: string
  input: CloudGenerationInput
  prompt: string
  requestId: string
  userId: string
}) {
  const generationId = crypto.randomUUID()
  const { error } = await client.from("generation_history").insert({
    aspect_ratio: input.aspectRatio,
    id: generationId,
    image_type: input.imageType,
    image_url: imageUrl,
    optimized_prompt: prompt,
    original_input: input,
    request_id: requestId,
    storage_path: `external:${generationId}`,
    style: input.mood,
    user_id: userId,
  })

  if (error) {
    throw new Error(error.message)
  }

  await client
    .from("credit_logs")
    .update({
      reason: "generation_charge",
      related_generation_id: generationId,
    })
    .eq("user_id", userId)
    .eq("request_id", requestId)
    .eq("reason", "generation_reserve")
    .is("related_generation_id", null)

  await client
    .from("generation_requests")
    .update({
      generation_id: generationId,
      reserved_credits: 0,
      status: "succeeded",
    })
    .eq("request_id", requestId)
    .eq("user_id", userId)

  return generationId
}

export async function refundGenerationCredit({
  client,
  errorCode,
  requestId,
  userId,
}: {
  client: SupabaseServiceClient
  errorCode: string
  requestId: string
  userId: string
}) {
  const profile = await readProfile(client, userId)

  if (!profile) {
    return 0
  }

  const nextCredits = profile.credits + 1

  await client
    .from("users_profile")
    .update({ credits: nextCredits })
    .eq("user_id", userId)
  await client.from("credit_logs").insert({
    change_amount: 1,
    reason: "generation_refund",
    request_id: requestId,
    user_id: userId,
  })
  await client
    .from("generation_requests")
    .update({
      error_code: errorCode.slice(0, 80),
      reserved_credits: 0,
      status: "failed",
    })
    .eq("request_id", requestId)
    .eq("user_id", userId)

  return nextCredits
}

export function mapCloudGenerationRow(
  row: CloudGenerationRow,
): CloudGenerationRecord {
  const originalInput =
    row.original_input && typeof row.original_input === "object"
      ? (row.original_input as Partial<CloudGenerationInput>)
      : {}

  return {
    aspectRatio: row.aspect_ratio,
    cloudId: row.id,
    createdAt: row.created_at,
    id: row.id,
    imageType: row.image_type,
    imageUrl: row.image_url,
    mood: row.style,
    prompt: row.optimized_prompt,
    quality:
      typeof originalInput.quality === "string" ? originalInput.quality : "2K",
    subject:
      typeof originalInput.subject === "string"
        ? originalInput.subject
        : "未命名影像",
  }
}

export async function listCloudGenerationHistory(
  client: SupabaseServiceClient,
  userId: string,
) {
  const { data, error } = await client
    .from("generation_history")
    .select(
      "id, user_id, original_input, optimized_prompt, image_url, storage_path, image_type, style, aspect_ratio, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(48)

  if (error) {
    throw new Error(error.message)
  }

  return ((data as CloudGenerationRow[] | null) ?? []).map(mapCloudGenerationRow)
}

export async function deleteCloudGenerationHistoryItem(
  client: SupabaseServiceClient,
  userId: string,
  id: string,
) {
  const { data, error } = await client
    .from("generation_history")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return Boolean(data)
}

