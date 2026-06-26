import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import { GenerateStudio } from "@/components/cinematic/generate-studio"
import { GenerationHistoryPage } from "@/components/cinematic/generation-history-page"

const historyKey = "huijing.seedream.history.v1"

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  vi.restoreAllMocks()
})

it("records successful generations so the history page can show them", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        imageUrl: "https://example.com/generated-history-frame.png",
        prompt: "cinematic history prompt",
      }),
    ),
  )

  render(<GenerateStudio />)
  fireEvent.change(screen.getByLabelText("主体描述"), {
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
    expect(window.localStorage.getItem(historyKey)).toContain(
      "generated-history-frame.png",
    )
  })

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
