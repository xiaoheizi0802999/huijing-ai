import { expect, it } from "vitest"
import { parseSupabaseAuthUrl } from "@/lib/supabase/auth-url"

it("reads access and refresh tokens from a copied magic link hash", () => {
  expect(
    parseSupabaseAuthUrl(
      "http://127.0.0.1:3000/generate#access_token=access-1&refresh_token=refresh-1",
    ),
  ).toEqual({
    accessToken: "access-1",
    refreshToken: "refresh-1",
  })
})

it("reads auth code and token hash values from copied email links", () => {
  expect(
    parseSupabaseAuthUrl(
      "http://127.0.0.1:3000/generate?code=code-1&token_hash=hash-1&type=email",
    ),
  ).toEqual({
    code: "code-1",
    tokenHash: "hash-1",
    type: "email",
  })
})
