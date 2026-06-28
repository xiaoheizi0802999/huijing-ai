import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { renderToString } from "react-dom/server"
import { afterEach, expect, it, vi } from "vitest"
import { GenerationHistoryPage } from "@/components/cinematic/generation-history-page"

const historyKey = "huijing.seedream.history.v1"
const supabaseMock = vi.hoisted(() => ({
  client: null as unknown,
}))

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => supabaseMock.client,
}))

function mockSignedOutClient() {
  supabaseMock.client = {
    auth: {
      getSession: vi.fn(async () => ({
        data: {
          session: null,
        },
      })),
      onAuthStateChange: vi.fn(() => ({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      })),
      signInWithOtp: vi.fn(async () => ({ error: null })),
    },
  }
}

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

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  supabaseMock.client = null
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it("renders a deterministic syncing archive state on the server", () => {
  supabaseMock.client = null

  const html = renderToString(<GenerationHistoryPage />)

  expect(html).toContain("FRAME ARCHIVE / SYNCING ACCOUNT")
  expect(html).not.toContain("FRAME ARCHIVE / LOGIN REQUIRED")
})

it("verifies an email code before loading cloud history", async () => {
  const verifyOtp = vi.fn(async () => ({
    data: {
      session: {
        access_token: "token-2",
        user: {
          email: "director@example.com",
          id: "user-1",
        },
      },
    },
    error: null,
  }))
  supabaseMock.client = {
    auth: {
      getSession: vi.fn(async () => ({
        data: {
          session: null,
        },
      })),
      onAuthStateChange: vi.fn(() => ({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      })),
      exchangeCodeForSession: vi.fn(),
      setSession: vi.fn(),
      signInWithOtp: vi.fn(),
      verifyOtp,
    },
  }
  const fetchMock = vi.fn(async () =>
    Response.json({
      history: [],
    }),
  )
  vi.stubGlobal("fetch", fetchMock)

  render(<GenerationHistoryPage />)

  fireEvent.change(await screen.findByPlaceholderText("director@example.com"), {
    target: { value: "director@example.com" },
  })
  fireEvent.change(screen.getByPlaceholderText("000000"), {
    target: { value: "123456" },
  })
  fireEvent.click(screen.getByRole("button", { name: "验证登录码" }))

  await waitFor(() => {
    expect(verifyOtp).toHaveBeenCalledWith({
      email: "director@example.com",
      token: "123456",
      type: "email",
    })
  })
  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/generation-history",
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: "Bearer token-2",
        }),
      }),
    )
  })
})

it("shows immediate feedback while sending a history login link", async () => {
  const signInWithOtp = vi.fn(() => new Promise(() => {}))
  supabaseMock.client = {
    auth: {
      getSession: vi.fn(async () => ({
        data: {
          session: null,
        },
      })),
      onAuthStateChange: vi.fn(() => ({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      })),
      signInWithOtp,
    },
  }

  render(<GenerationHistoryPage />)

  fireEvent.change(await screen.findByPlaceholderText("director@example.com"), {
    target: { value: "director@example.com" },
  })
  fireEvent.click(screen.getByRole("button", { name: "发送登录链接" }))

  expect(screen.getByText("正在发送登录链接，请稍候。")).toBeInTheDocument()
  expect(signInWithOtp).toHaveBeenCalled()
})

it("explains Supabase email rate limits on the history login form", async () => {
  const signInWithOtp = vi.fn(async () => ({
    error: {
      message: "email rate limit exceeded",
    },
  }))
  supabaseMock.client = {
    auth: {
      getSession: vi.fn(async () => ({
        data: {
          session: null,
        },
      })),
      onAuthStateChange: vi.fn(() => ({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      })),
      signInWithOtp,
    },
  }

  render(<GenerationHistoryPage />)

  fireEvent.change(await screen.findByPlaceholderText("director@example.com"), {
    target: { value: "director@example.com" },
  })
  fireEvent.click(screen.getByRole("button", { name: "发送登录链接" }))

  expect(
    await screen.findByText(
      "登录链接发送失败：邮件发送频率已达到 Supabase 限制。请先等待 60 秒再试；如果仍然出现，需要配置自定义 SMTP 或稍后再试。",
    ),
  ).toBeInTheDocument()
  expect(screen.getByRole("button", { name: /60 秒后重试/ })).toBeDisabled()
})

it("renders a cinematic login gate before history can be used", async () => {
  mockSignedOutClient()

  render(<GenerationHistoryPage />)

  expect(
    screen.getByRole("heading", { name: "历史影像档案" }),
  ).toBeInTheDocument()
  expect(await screen.findByText("FRAME ARCHIVE / LOGIN REQUIRED")).toBeInTheDocument()
  expect(screen.getByText("登录后才可以查看云端历史影像。")).toBeInTheDocument()
  expect(screen.getByLabelText("登录邮箱")).toBeInTheDocument()
  expect(screen.getByRole("link", { name: "返回生图工作台" })).toHaveAttribute(
    "href",
    "/generate",
  )
  expect(screen.getByRole("link", { name: "返回首页" })).toHaveAttribute(
    "href",
    "/",
  )
})

it("does not expose local browser history before login", async () => {
  mockSignedOutClient()
  window.localStorage.setItem(
    historyKey,
    JSON.stringify([
      {
        id: "frame-01",
        createdAt: "2026-06-25T09:30:00.000Z",
        imageUrl: "https://example.com/first-frame.png",
        prompt: "first cinematic prompt",
        subject: "雨夜高楼边缘的未来城市导演",
        imageType: "电影海报",
        mood: "黑色电影",
        aspectRatio: "16:9",
        quality: "4K",
      },
    ]),
  )

  render(<GenerationHistoryPage />)

  expect(await screen.findByText("登录后才可以查看云端历史影像。")).toBeInTheDocument()
  expect(
    screen.queryByAltText("历史作品：雨夜高楼边缘的未来城市导演"),
  ).not.toBeInTheDocument()
  expect(screen.queryByText("first cinematic prompt")).not.toBeInTheDocument()
})

it("exposes the history page through a dedicated route without touching the generate page", async () => {
  mockSignedOutClient()
  const { default: HistoryRoute } = await import("../../app/generate/history/page")

  render(<HistoryRoute />)

  expect(
    screen.getByRole("heading", { name: "历史影像档案" }),
  ).toBeInTheDocument()
  expect(await screen.findByText("登录后才可以查看云端历史影像。")).toBeInTheDocument()
})

it("loads cloud history for signed-in users", async () => {
  mockSignedInClient()
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        history: [
          {
            aspectRatio: "16:9",
            cloudId: "cloud-1",
            createdAt: "2026-06-27T02:00:00.000Z",
            id: "cloud-1",
            imageType: "产品摄影",
            imageUrl: "https://example.com/cloud-frame.png",
            mood: "奢侈品牌广告片",
            prompt: "cloud prompt",
            quality: "2K",
            subject: "云端银白香水瓶",
          },
        ],
      }),
    ),
  )

  render(<GenerationHistoryPage />)

  expect(await screen.findByText("CLOUD ARCHIVE")).toBeInTheDocument()
  expect(
    await screen.findByAltText("历史作品：云端银白香水瓶"),
  ).toHaveAttribute("src", "https://example.com/cloud-frame.png")
  expect(screen.getByText("cloud prompt")).toBeInTheDocument()
})

it("deletes cloud history through the API for signed-in users", async () => {
  mockSignedInClient()
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    if (String(input).includes("/api/generation-history/cloud-1")) {
      return Response.json({ deleted: true })
    }

    return Response.json({
      history: [
        {
          aspectRatio: "16:9",
          cloudId: "cloud-1",
          createdAt: "2026-06-27T02:00:00.000Z",
          id: "cloud-1",
          imageType: "产品摄影",
          imageUrl: "https://example.com/cloud-frame.png",
          mood: "奢侈品牌广告片",
          prompt: "cloud prompt",
          quality: "2K",
          subject: "云端银白香水瓶",
        },
      ],
    })
  })
  vi.stubGlobal("fetch", fetchMock)

  render(<GenerationHistoryPage />)

  await screen.findByAltText("历史作品：云端银白香水瓶")
  fireEvent.click(screen.getByRole("button", { name: /删除记录/ }))

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/generation-history/cloud-1",
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: "Bearer token-1",
        }),
        method: "DELETE",
      }),
    )
  })
})
