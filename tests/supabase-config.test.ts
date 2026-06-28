import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import {
  cleanSupabaseEnvValue,
  getSupabasePublicConfig,
  getSupabaseServerConfig,
} from "@/lib/supabase/config"

describe("supabase config", () => {
  it("removes invisible copy artifacts from Supabase env values", () => {
    expect(cleanSupabaseEnvValue("\uFEFF sb_publishable_test \n")).toBe(
      "sb_publishable_test",
    )
  })

  it("returns null when public Supabase config is incomplete", () => {
    expect(
      getSupabasePublicConfig({
        NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
      }),
    ).toBeNull()
  })

  it("returns cleaned public Supabase config when URL and publishable key exist", () => {
    expect(
      getSupabasePublicConfig({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "\uFEFFsb_publishable_test\n",
        NEXT_PUBLIC_SUPABASE_URL: " https://project.supabase.co ",
      }),
    ).toEqual({
      publishableKey: "sb_publishable_test",
      url: "https://project.supabase.co",
    })
  })

  it("accepts the legacy public anon key name as a browser-compatible fallback", () => {
    expect(
      getSupabasePublicConfig({
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "\uFEFFsb_publishable_test\n",
        NEXT_PUBLIC_SUPABASE_URL: " https://project.supabase.co ",
      }),
    ).toEqual({
      publishableKey: "sb_publishable_test",
      url: "https://project.supabase.co",
    })
  })

  it("reads default public env values through direct NEXT_PUBLIC references for client bundles", () => {
    const source = readFileSync("lib/supabase/config.ts", "utf8")

    expect(source).toContain("defaultPublicEnv")
    expect(source).not.toContain("env: SupabaseEnv = process.env")
  })

  it("returns null when server Supabase config is missing a secret key", () => {
    expect(
      getSupabaseServerConfig({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
        NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
      }),
    ).toBeNull()
  })

  it("returns cleaned server Supabase config when all server values exist", () => {
    expect(
      getSupabaseServerConfig({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
        NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
        SUPABASE_SECRET_KEY: "\uFEFFsb_secret_test\n",
      }),
    ).toEqual({
      publishableKey: "sb_publishable_test",
      secretKey: "sb_secret_test",
      url: "https://project.supabase.co",
    })
  })
})
