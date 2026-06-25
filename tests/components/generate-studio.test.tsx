import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import { GenerateStudio } from "@/components/cinematic/generate-studio"

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

it("renders a Seedream creation studio that visually belongs to the cinematic system", () => {
  const { container } = render(<GenerateStudio />)

  expect(
    screen.getByRole("heading", { name: "像导演一样调度" }),
  ).toBeInTheDocument()
  expect(screen.getByLabelText("主体描述")).toBeInTheDocument()
  expect(screen.getByLabelText("图片类型")).toBeInTheDocument()
  expect(screen.getByLabelText("风格气质")).toBeInTheDocument()
  expect(screen.getByLabelText("画幅")).toBeInTheDocument()
  expect(screen.getByLabelText("清晰度")).toBeInTheDocument()
  expect(screen.getByRole("button", { name: "生成图片" })).toBeInTheDocument()
  expect(screen.getByText("FRAME OUTPUT / WAITING FOR LIGHT")).toBeInTheDocument()
  expect(container.querySelector(".seedream-studio")).toBeInTheDocument()
})

it("submits the creative brief and renders the generated image", async () => {
  const fetchMock = vi.fn(async () =>
    Response.json({
      imageUrl: "https://example.com/final-frame.png",
      prompt: "cinematic prompt",
    }),
  )
  vi.stubGlobal("fetch", fetchMock)

  render(<GenerateStudio />)
  fireEvent.change(screen.getByLabelText("主体描述"), {
    target: { value: "一位站在雨夜高楼边缘的未来城市导演" },
  })
  fireEvent.click(screen.getByRole("button", { name: "生成图片" }))

  await waitFor(() => {
    expect(screen.getByAltText("Doubao-Seedream-4.5 生成结果")).toHaveAttribute(
      "src",
      "https://example.com/final-frame.png",
    )
  })
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/generate-image",
    expect.objectContaining({
      method: "POST",
    }),
  )
  expect(screen.getByText("PROMPT / PROFESSIONAL VISUAL LANGUAGE")).toBeInTheDocument()
})

it("shows a cinematic inline error when the provider cannot generate", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json(
        {
          code: "missing_api_key",
          message: "缺少 ARK_API_KEY，暂时无法连接 Doubao-Seedream-4.5。",
        },
        { status: 503 },
      ),
    ),
  )

  render(<GenerateStudio />)
  fireEvent.change(screen.getByLabelText("主体描述"), {
    target: { value: "一组黑色香水瓶在银色冷光中排列" },
  })
  fireEvent.click(screen.getByRole("button", { name: "生成图片" }))

  expect(
    await screen.findByText("缺少 ARK_API_KEY，暂时无法连接 Doubao-Seedream-4.5。"),
  ).toBeInTheDocument()
})
