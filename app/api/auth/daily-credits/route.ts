import { NextResponse } from "next/server"
import {
  authenticateSupabaseRequest,
  claimDailyCredits,
} from "@/lib/supabase/server"

export async function POST(request: Request) {
  const auth = await authenticateSupabaseRequest(request)

  if ("error" in auth) {
    return NextResponse.json(
      {
        code: auth.error.code,
        message: auth.error.message,
      },
      { status: auth.error.status },
    )
  }

  try {
    const profile = await claimDailyCredits(auth.client, auth.user.id)

    return NextResponse.json({
      credits: profile.credits,
      granted: profile.granted ?? 0,
    })
  } catch {
    return NextResponse.json(
      {
        code: "daily_credits_unavailable",
        message: "暂时无法领取每日积分，请稍后再试。",
      },
      { status: 502 },
    )
  }
}

