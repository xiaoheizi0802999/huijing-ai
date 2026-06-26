import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import { GenerateStudio } from "@/components/cinematic/generate-studio"

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
  window.localStorage.clear()
  vi.restoreAllMocks()
})

it("downloads the current generated image from the studio", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        imageUrl: "data:image/png;base64,ZmFrZS1pbWFnZQ==",
        prompt: "downloadable prompt",
      }),
    ),
  )
  const { anchor, click } = mockAnchorDownload()

  render(<GenerateStudio />)
  fireEvent.change(screen.getByLabelText("主体描述"), {
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
