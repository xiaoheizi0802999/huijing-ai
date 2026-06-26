import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import { GenerateStudio } from "@/components/cinematic/generate-studio"

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

it("shows a readable inline error when the API returns an empty response", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("", { status: 502 })),
  )

  render(<GenerateStudio />)
  fireEvent.change(screen.getByLabelText("主体描述"), {
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
