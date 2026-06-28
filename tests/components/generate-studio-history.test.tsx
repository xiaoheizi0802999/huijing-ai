import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import { GenerateStudio } from "@/components/cinematic/generate-studio"
import { GenerationHistoryPage } from "@/components/cinematic/generation-history-page"

const historyKey = "huijing.seedream.history.v1"
const supabaseMock = vi.hoisted(() => ({
  client: null as unknown,
}))

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => supabaseMock.client,
}))

function mockSignedInClient() {
  supabaseMock.client = {
    auth: {
      getSession: vi.fn(async () => ({
        data: {
          session: {
            access_token: "token-1",
            user: {
              email: "director@example.com",
              id: "user-1",
            },
          },
        },
      })),
      onAuthStateChange: vi.fn(() => ({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      })),
      signInWithOtp: vi.fn(),
      signOut: vi.fn(),
    },
  }
}

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  supabaseMock.client = null
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it("stores successful signed-in generations in cloud history instead of local guest history", async () => {
  mockSignedInClient()
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)

      if (url.includes("/api/auth/session")) {
        return Response.json({
          credits: 5,
          granted: 0,
          user: {
            email: "director@example.com",
            id: "user-1",
          },
        })
      }

      if (url.includes("/api/generation-history")) {
        return Response.json({
          history: [
            {
              aspectRatio: "16:9",
              cloudId: "cloud-generation-1",
              createdAt: "2026-06-27T02:00:00.000Z",
              id: "cloud-generation-1",
              imageType: "产品摄影",
              imageUrl: "https://example.com/generated-history-frame.png",
              mood: "奢侈品牌广告片",
              prompt: "cinematic history prompt",
              quality: "4K",
              subject: "一组银白色香水瓶在黑色水面形成倒影",
            },
          ],
        })
      }

      return Response.json({
        credits: 4,
        generationId: "cloud-generation-1",
        imageUrl: "https://example.com/generated-history-frame.png",
        prompt: "cinematic history prompt",
      })
    }),
  )

  render(<GenerateStudio />)
  fireEvent.change(await screen.findByLabelText("主体描述"), {
    target: { value: "一组银白色香水瓶在黑色水面形成倒影" },
  })
  fireEvent.change(screen.getByLabelText("图片类型"), {
    target: { value: "产品摄影" },
  })
  fireEvent.change(screen.getByLabelText("风格气质"), {
    target: { value: "奢侈品牌广告片" },
  })
  fireEvent.change(screen.getByLabelText("清晰度"), {
    target: { value: "4K" },
  })
  fireEvent.click(screen.getByRole("button", { name: "生成图片" }))

  await waitFor(() => {
    expect(screen.getByAltText("AI 生成结果")).toHaveAttribute(
      "src",
      "https://example.com/generated-history-frame.png",
    )
  })
  expect(window.localStorage.getItem(historyKey)).toBeNull()

  cleanup()
  render(<GenerationHistoryPage />)

  expect(
    await screen.findByAltText("历史作品：一组银白色香水瓶在黑色水面形成倒影"),
  ).toHaveAttribute("src", "https://example.com/generated-history-frame.png")
  expect(screen.getByText("cinematic history prompt")).toBeInTheDocument()
  expect(
    screen.getByText("产品摄影 / 奢侈品牌广告片 / 16:9 / 4K"),
  ).toBeInTheDocument()
})
