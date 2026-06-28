import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import { GenerateStudio } from "@/components/cinematic/generate-studio"

const supabaseMock = vi.hoisted(() => ({
  client: null as unknown,
}))

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => supabaseMock.client,
}))

afterEach(() => {
  cleanup()
  supabaseMock.client = null
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it("shows a readable inline error when the API returns an empty response", async () => {
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

      return new Response("", { status: 502 })
    }),
  )

  render(<GenerateStudio />)
  fireEvent.change(await screen.findByLabelText("主体描述"), {
    target: { value: "一组黑色香水瓶在银色冷光中排列" },
  })
  fireEvent.click(screen.getByRole("button", { name: "生成图片" }))

  expect(
    await screen.findByText(
      "生成失败，服务暂时没有返回可读信息，请稍后再试。",
    ),
  ).toBeInTheDocument()
  expect(
    screen.queryByText(/Unexpected end of JSON input/),
  ).not.toBeInTheDocument()
})
