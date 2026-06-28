import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import { GenerationHistoryPage } from "@/components/cinematic/generation-history-page"

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
    },
  }
}

function createCloudHistoryResponse() {
  return {
    history: [
      {
        aspectRatio: "16:9",
        cloudId: "history-frame-01",
        createdAt: "2026-06-25T09:30:00.000Z",
        id: "history-frame-01",
        imageType: "产品摄影",
        imageUrl: "data:image/png;base64,aGlzdG9yeS1mcmFtZQ==",
        mood: "奢侈品牌广告片",
        prompt: "history prompt",
        quality: "4K",
        subject: "黑色水面上的银白香水瓶",
      },
    ],
  }
}

function mockAnchorDownload() {
  const originalCreateElement = document.createElement.bind(document)
  const anchor = originalCreateElement("a")
  const click = vi.fn()

  anchor.click = click
  vi.spyOn(document, "createElement").mockImplementation(
    ((tagName: string, options?: ElementCreationOptions) => {
      if (tagName.toLowerCase() === "a") {
        return anchor
      }

      return originalCreateElement(tagName, options)
    }) as typeof document.createElement,
  )

  return { anchor, click }
}

afterEach(() => {
  cleanup()
  supabaseMock.client = null
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it("downloads the selected cloud history frame", async () => {
  mockSignedInClient()
  vi.stubGlobal("fetch", vi.fn(async () => Response.json(createCloudHistoryResponse())))
  const { anchor, click } = mockAnchorDownload()

  render(<GenerationHistoryPage />)

  fireEvent.click(await screen.findByRole("button", { name: "下载图片" }))

  await waitFor(() => {
    expect(click).toHaveBeenCalledOnce()
  })
  expect(anchor.href).toContain("data:image/png;base64")
  expect(anchor.download).toContain("huijing-ai-")
})

it("deletes the selected cloud history frame through the API", async () => {
  mockSignedInClient()
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    if (String(input).includes("/api/generation-history/history-frame-01")) {
      return Response.json({ deleted: true })
    }

    return Response.json(createCloudHistoryResponse())
  })
  vi.stubGlobal("fetch", fetchMock)

  render(<GenerationHistoryPage />)

  fireEvent.click(await screen.findByRole("button", { name: "删除记录" }))

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/generation-history/history-frame-01",
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: "Bearer token-1",
        }),
        method: "DELETE",
      }),
    )
  })
  expect(screen.getByText("暂无生成记录")).toBeInTheDocument()
})
