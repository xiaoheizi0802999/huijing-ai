import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { renderToString } from "react-dom/server"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { GenerateStudio } from "@/components/cinematic/generate-studio"

const supabaseMock = vi.hoisted(() => ({
  client: null as unknown,
}))

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => supabaseMock.client,
}))

beforeEach(() => {
  cleanup()
  supabaseMock.client = null
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it("renders a deterministic syncing account state on the server", () => {
  supabaseMock.client = null

  const html = renderToString(<GenerateStudio />)

  expect(html).toContain("同步账户中")
  expect(html).not.toContain("登录未连接")
})

it("shows signed-in credits and sends the bearer token when generating", async () => {
  const supabaseClient = {
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
  supabaseMock.client = supabaseClient
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
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
      imageUrl: "https://example.com/generated-auth-frame.png",
      prompt: "authenticated cinematic prompt",
    })
  })
  vi.stubGlobal("fetch", fetchMock)

  render(<GenerateStudio />)

  expect(await screen.findByText("剩余 5 积分")).toBeInTheDocument()
  expect(screen.getByText("director@example.com")).toBeInTheDocument()

  fireEvent.change(screen.getByLabelText("主体描述"), {
    target: { value: "黑色摄影棚中的银色概念跑车" },
  })
  fireEvent.click(screen.getByRole("button", { name: "生成图片" }))

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/generate-image",
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: "Bearer token-1",
        }),
      }),
    )
  })
  expect(await screen.findByText("剩余 4 积分")).toBeInTheDocument()
})

it("verifies an email code in the original browser", async () => {
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
  const supabaseClient = {
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
      signOut: vi.fn(),
      verifyOtp,
    },
  }
  supabaseMock.client = supabaseClient
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        credits: 5,
        granted: 0,
        user: {
          email: "director@example.com",
          id: "user-1",
        },
      }),
    ),
  )

  render(<GenerateStudio />)

  const emailInputs = await screen.findAllByPlaceholderText("director@example.com")
  fireEvent.change(emailInputs[0], {
    target: { value: "director@example.com" },
  })
  fireEvent.change(screen.getByPlaceholderText("000000"), {
    target: { value: "123 456" },
  })
  fireEvent.click(screen.getByRole("button", { name: "验证登录码" }))

  await waitFor(() => {
    expect(verifyOtp).toHaveBeenCalledWith({
      email: "director@example.com",
      token: "123456",
      type: "email",
    })
  })
  expect(await screen.findByText("剩余 5 积分")).toBeInTheDocument()
})

it("restores a session from a pasted magic link in the original browser", async () => {
  const setSession = vi.fn(async () => ({
    data: {
      session: {
        access_token: "token-3",
        user: {
          email: "director@example.com",
          id: "user-1",
        },
      },
    },
    error: null,
  }))
  const supabaseClient = {
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
      setSession,
      signInWithOtp: vi.fn(),
      signOut: vi.fn(),
      verifyOtp: vi.fn(),
    },
  }
  supabaseMock.client = supabaseClient
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        credits: 5,
        granted: 0,
        user: {
          email: "director@example.com",
          id: "user-1",
        },
      }),
    ),
  )

  render(<GenerateStudio />)

  const linkInput = await screen.findByPlaceholderText(/access_token=token/)
  fireEvent.change(linkInput, {
    target: {
      value:
        "http://127.0.0.1:3000/generate#access_token=token-3&refresh_token=refresh-3",
    },
  })
  fireEvent.click(screen.getByRole("button", { name: "使用登录链接" }))

  await waitFor(() => {
    expect(setSession).toHaveBeenCalledWith({
      access_token: "token-3",
      refresh_token: "refresh-3",
    })
  })
  expect(await screen.findByText("剩余 5 积分")).toBeInTheDocument()
})

it("shows immediate feedback while sending a login link", async () => {
  const signInWithOtp = vi.fn(() => new Promise(() => {}))
  const supabaseClient = {
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
      signOut: vi.fn(),
    },
  }
  supabaseMock.client = supabaseClient

  render(<GenerateStudio />)

  const emailInputs = await screen.findAllByLabelText("登录邮箱")
  fireEvent.change(emailInputs[0], {
    target: { value: "director@example.com" },
  })
  fireEvent.click(screen.getAllByRole("button", { name: "发送登录链接" })[0])

  expect(screen.getByText("正在发送登录链接，请稍候。")).toBeInTheDocument()
  expect(signInWithOtp).toHaveBeenCalled()
})

it("shows a visible error if sending a login link fails", async () => {
  const signInWithOtp = vi.fn(async () => {
    throw new Error("Network request failed")
  })
  const supabaseClient = {
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
      signOut: vi.fn(),
    },
  }
  supabaseMock.client = supabaseClient

  render(<GenerateStudio />)

  const emailInputs = await screen.findAllByLabelText("登录邮箱")
  fireEvent.change(emailInputs[0], {
    target: { value: "director@example.com" },
  })
  fireEvent.click(screen.getAllByRole("button", { name: "发送登录链接" })[0])

  expect(
    await screen.findByText("登录链接发送失败：Network request failed"),
  ).toBeInTheDocument()
})

it("explains Supabase email rate limits and temporarily disables resending", async () => {
  const signInWithOtp = vi.fn(async () => ({
    error: {
      message: "email rate limit exceeded",
    },
  }))
  const supabaseClient = {
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
      signOut: vi.fn(),
    },
  }
  supabaseMock.client = supabaseClient

  render(<GenerateStudio />)

  const emailInputs = await screen.findAllByLabelText("登录邮箱")
  fireEvent.change(emailInputs[0], {
    target: { value: "director@example.com" },
  })
  fireEvent.click(screen.getAllByRole("button", { name: "发送登录链接" })[0])

  expect(
    await screen.findByText(
      "登录链接发送失败：邮件发送频率已达到 Supabase 限制。请先等待 60 秒再试；如果仍然出现，需要配置自定义 SMTP 或稍后再试。",
    ),
  ).toBeInTheDocument()
  expect(screen.getByRole("button", { name: /60 秒后重试/ })).toBeDisabled()
})

it("renders a cinematic email login panel for guests", async () => {
  const signInWithOtp = vi.fn(async () => ({ error: null }))
  const supabaseClient = {
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
      signOut: vi.fn(),
    },
  }
  supabaseMock.client = supabaseClient

  render(<GenerateStudio />)

  const emailInputs = await screen.findAllByLabelText("登录邮箱")

  expect(screen.queryByRole("button", { name: "生成图片" })).not.toBeInTheDocument()
  expect(screen.queryByLabelText("主体描述")).not.toBeInTheDocument()
  expect(
    screen.getByText("登录后才可以使用生图与云端历史。"),
  ).toBeInTheDocument()

  fireEvent.change(emailInputs[0], {
    target: { value: "director@example.com" },
  })
  fireEvent.click(screen.getAllByRole("button", { name: "发送登录链接" })[0])

  await waitFor(() => {
    expect(signInWithOtp).toHaveBeenCalledWith({
      email: "director@example.com",
      options: {
        emailRedirectTo: "http://localhost:3000/generate",
      },
    })
  })
  expect(screen.getByText("登录链接已发送，请查看邮箱。")).toBeInTheDocument()
})
