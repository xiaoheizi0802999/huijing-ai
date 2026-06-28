import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import { GenerateStudio } from "@/components/cinematic/generate-studio"

const supabaseMock = vi.hoisted(() => ({
  client: null as unknown,
}))

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => supabaseMock.client,
}))

function mockSignedInStudio(
  fetchMock = vi.fn(async (input: RequestInfo | URL) => {
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
      imageUrl: "https://example.com/final-frame.png",
      prompt: "cinematic prompt",
    })
  }),
) {
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
  vi.stubGlobal("fetch", fetchMock)

  return fetchMock
}

afterEach(() => {
  cleanup()
  supabaseMock.client = null
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it("renders a signed-in Seedream creation studio that visually belongs to the cinematic system", async () => {
  mockSignedInStudio()
  const { container } = render(<GenerateStudio />)

  expect(
    screen.getByRole("heading", { name: "像导演一样调度" }),
  ).toBeInTheDocument()
  expect(await screen.findByLabelText("主体描述")).toBeInTheDocument()
  expect(screen.getByLabelText("图片类型")).toBeInTheDocument()
  expect(screen.getByLabelText("风格气质")).toBeInTheDocument()
  expect(screen.getByLabelText("色彩与光线")).toBeInTheDocument()
  expect(screen.getByLabelText("画幅")).toBeInTheDocument()
  expect(screen.getByLabelText("清晰度")).toBeInTheDocument()
  expect(screen.getByRole("button", { name: "生成图片" })).toBeInTheDocument()
  expect(screen.getByRole("link", { name: "历史影像" })).toHaveAttribute(
    "href",
    "/generate/history",
  )
  expect(screen.getByText("FRAME OUTPUT / WAITING FOR LIGHT")).toBeInTheDocument()
  expect(container.querySelector(".seedream-studio")).toBeInTheDocument()
})

it("submits the creative brief and renders the generated image", async () => {
  const fetchMock = mockSignedInStudio()

  render(<GenerateStudio />)
  fireEvent.change(await screen.findByLabelText("主体描述"), {
    target: { value: "一位站在雨夜高楼边缘的未来城市导演" },
  })
  fireEvent.change(screen.getByLabelText("色彩与光线"), {
    target: { value: "暖金胶片" },
  })
  fireEvent.click(screen.getByRole("button", { name: "生成图片" }))

  await waitFor(() => {
    expect(screen.getByAltText("AI 生成结果")).toHaveAttribute(
      "src",
      "https://example.com/final-frame.png",
    )
  })
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/generate-image",
    expect.objectContaining({
      body: expect.stringContaining('"colorPalette":"暖金胶片"'),
      method: "POST",
    }),
  )
  expect(screen.getByText("PROMPT / PROFESSIONAL VISUAL LANGUAGE")).toBeInTheDocument()
})

it("shows a cinematic inline error when the provider cannot generate", async () => {
  mockSignedInStudio(
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

      return Response.json(
        {
          code: "missing_api_key",
          message: "缺少 ARK_API_KEY，暂时无法连接 Doubao-Seedream-4.5。",
        },
        { status: 503 },
      )
    }),
  )

  render(<GenerateStudio />)
  fireEvent.change(await screen.findByLabelText("主体描述"), {
    target: { value: "一组黑色香水瓶在银色冷光中排列" },
  })
  fireEvent.click(screen.getByRole("button", { name: "生成图片" }))

  expect(
    await screen.findByText("缺少 ARK_API_KEY，暂时无法连接 Doubao-Seedream-4.5。"),
  ).toBeInTheDocument()
})
