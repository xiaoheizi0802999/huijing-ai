import { expect, it } from "vitest"
import nextConfig from "@/next.config"

it("sets the exact cinematic asset cache policy", async () => {
  const headers = await nextConfig.headers?.()

  expect(headers).toEqual([
    {
      source: "/cinematic/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=86400, stale-while-revalidate=604800",
        },
      ],
    },
  ])
})
