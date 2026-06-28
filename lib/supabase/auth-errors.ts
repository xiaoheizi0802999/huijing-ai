export const emailRateLimitMessage =
  "邮件发送频率已达到 Supabase 限制。请先等待 60 秒再试；如果仍然出现，需要配置自定义 SMTP 或稍后再试。"

export const smtpUnknownErrorMessage =
  "SMTP 邮件发送失败。请检查 SMTP 密码/API Key、Brevo 发件人是否已验证，以及 Supabase 发件人邮箱是否与 Brevo 允许的 sender 一致。"

export function isEmptySmtpError(message: string) {
  const normalizedMessage = message.trim()

  return (
    normalizedMessage === "{}" ||
    normalizedMessage === "" ||
    normalizedMessage === "[object Object]"
  )
}

export function isSupabaseEmailRateLimit(message: string) {
  const normalizedMessage = message.toLowerCase()

  return (
    normalizedMessage.includes("email rate limit exceeded") ||
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("too many requests")
  )
}

export function formatSupabaseAuthError(message: string) {
  if (isEmptySmtpError(message)) {
    return smtpUnknownErrorMessage
  }

  return isSupabaseEmailRateLimit(message) ? emailRateLimitMessage : message
}
