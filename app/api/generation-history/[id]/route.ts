import { NextResponse } from "next/server"
import {
  authenticateSupabaseRequest,
  deleteCloudGenerationHistoryItem,
} from "@/lib/supabase/server"

type DeleteRouteContext = {
  params: Promise<{ id: string }> | { id: string }
}

export async function DELETE(request: Request, context: DeleteRouteContext) {
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

  const params = await context.params

  try {
    const deleted = await deleteCloudGenerationHistoryItem(
      auth.client,
      auth.user.id,
      params.id,
    )

    return NextResponse.json({ deleted })
  } catch {
    return NextResponse.json(
      {
        code: "cloud_history_delete_failed",
        message: "暂时无法删除云端历史，请稍后再试。",
      },
      { status: 502 },
    )
  }
}

