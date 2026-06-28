import { expect, it } from "vitest"
import { formatSupabaseAuthError } from "@/lib/supabase/auth-errors"

it("explains empty SMTP errors returned by Supabase", () => {
  expect(formatSupabaseAuthError("{}")).toBe(
    "SMTP 邮件发送失败。请检查 SMTP 密码/API Key、Brevo 发件人是否已验证，以及 Supabase 发件人邮箱是否与 Brevo 允许的 sender 一致。",
  )
})

it("explains Supabase email rate limits", () => {
  expect(formatSupabaseAuthError("email rate limit exceeded")).toContain(
    "邮件发送频率已达到 Supabase 限制",
  )
})
