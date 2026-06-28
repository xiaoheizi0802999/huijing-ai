import { NextResponse } from "next/server"
import {
  authenticateSupabaseRequest,
  listCloudGenerationHistory,
} from "@/lib/supabase/server"

export async function GET(request: Request) {
  const auth = await authenticateSupabaseRequest(request)

  if ("error" in auth) {
    return NextResponse.json(
      {
        code: auth.error.code,
        message:
          auth.error.code === "missing_auth_token"
            ? "请先登录后再查看云端历史。"
            : auth.error.message,
      },
      { status: auth.error.status },
    )
  }

  try {
    const history = await listCloudGenerationHistory(auth.client, auth.user.id)

    return NextResponse.json({ history })
  } catch {
    return NextResponse.json(
      {
        code: "cloud_history_unavailable",
        message: "暂时无法读取云端历史，请稍后再试。",
      },
      { status: 502 },
    )
  }
}

