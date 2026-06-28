import { expect, it, vi } from "vitest"
import {
  completeSupabaseAuthFromUrl,
  parseSupabaseAuthUrl,
} from "@/lib/supabase/auth-url"

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

it("reads token hashes from default Supabase confirmation URLs", () => {
  expect(
    parseSupabaseAuthUrl(
      "https://project.supabase.co/auth/v1/verify?token=hash-2&type=email&redirect_to=https%3A%2F%2Fhuijing-ai.vercel.app%2Fgenerate",
    ),
  ).toEqual({
    code: undefined,
    tokenHash: "hash-2",
    type: "email",
  })
})

it("returns a failed completion result for auth errors redirected from the confirm route", async () => {
  const supabaseClient = {
    auth: {
      exchangeCodeForSession: async () => ({
        data: { session: null },
        error: null,
      }),
      setSession: async () => ({
        data: { session: null },
        error: null,
      }),
      verifyOtp: async () => ({
        data: { session: null },
        error: null,
      }),
    },
  }

  await expect(
    completeSupabaseAuthFromUrl(
      supabaseClient,
      "https://huijing-ai.vercel.app/generate?auth_error=invalid%20token",
    ),
  ).resolves.toEqual({
    message: "invalid token",
    status: "failed",
  })
})

it("falls back to email verification when a pasted magiclink token hash fails", async () => {
  const verifyOtp = vi
    .fn()
    .mockResolvedValueOnce({
      data: { session: null },
      error: { message: "invalid token type" },
    })
    .mockResolvedValueOnce({
      data: {
        session: {
          access_token: "access-5",
          refresh_token: "refresh-5",
        },
      },
      error: null,
    })
  const supabaseClient = {
    auth: {
      exchangeCodeForSession: vi.fn(),
      setSession: vi.fn(),
      verifyOtp,
    },
  }

  await expect(
    completeSupabaseAuthFromUrl(
      supabaseClient,
      "https://huijing-ai.vercel.app/auth/confirm?token_hash=hash-5&type=magiclink&next=/generate",
    ),
  ).resolves.toEqual({
    session: {
      access_token: "access-5",
      refresh_token: "refresh-5",
    },
    status: "completed",
  })
  expect(verifyOtp).toHaveBeenNthCalledWith(1, {
    token_hash: "hash-5",
    type: "magiclink",
  })
  expect(verifyOtp).toHaveBeenNthCalledWith(2, {
    token_hash: "hash-5",
    type: "email",
  })
})
