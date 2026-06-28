import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import { GenerateStudio } from "@/components/cinematic/generate-studio"

const supabaseMock = vi.hoisted(() => ({
  client: null as unknown,
}))

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => supabaseMock.client,
}))

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

function mockSignedInStudio() {
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

it("downloads the current generated image from the studio", async () => {
  mockSignedInStudio()
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).includes("/api/auth/session")) {
        return Response.json({
          credits: 5,
          granted: 0,
          user: {
            email: "director@example.com",
            id: "user-1",
          },
        })
      }

      return Response.json({
        credits: 4,
        generationId: "cloud-generation-1",
        imageUrl: "data:image/png;base64,ZmFrZS1pbWFnZQ==",
        prompt: "downloadable prompt",
      })
    }),
  )
  const { anchor, click } = mockAnchorDownload()

  render(<GenerateStudio />)
  fireEvent.change(await screen.findByLabelText("主体描述"), {
    target: { value: "一张冷光照亮的黑色电影产品海报" },
  })
  fireEvent.click(screen.getByRole("button", { name: "生成图片" }))

  const downloadButton = await screen.findByRole("button", {
    name: "下载图片",
  })
  fireEvent.click(downloadButton)

  await waitFor(() => {
    expect(click).toHaveBeenCalledOnce()
  })
  expect(anchor.href).toContain("data:image/png;base64")
  expect(anchor.download).toContain("huijing-ai-")
})
