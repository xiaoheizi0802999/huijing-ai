import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import { GenerationHistoryPage } from "@/components/cinematic/generation-history-page"

const historyKey = "huijing.seedream.history.v1"

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

function seedHistory() {
  window.localStorage.setItem(
    historyKey,
    JSON.stringify([
      {
        id: "history-frame-01",
        createdAt: "2026-06-25T09:30:00.000Z",
        imageUrl: "data:image/png;base64,aGlzdG9yeS1mcmFtZQ==",
        prompt: "history prompt",
        subject: "黑色水面上的银白香水瓶",
        imageType: "产品摄影",
        mood: "奢侈品牌广告片",
        aspectRatio: "16:9",
        quality: "4K",
      },
    ]),
  )
}

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  vi.restoreAllMocks()
})

it("downloads the selected history frame", async () => {
  seedHistory()
  const { anchor, click } = mockAnchorDownload()

  render(<GenerationHistoryPage />)

  fireEvent.click(await screen.findByRole("button", { name: "下载图片" }))

  await waitFor(() => {
    expect(click).toHaveBeenCalledOnce()
  })
  expect(anchor.href).toContain("data:image/png;base64")
  expect(anchor.download).toContain("huijing-ai-")
})

it("deletes the selected history frame from local history", async () => {
  seedHistory()

  render(<GenerationHistoryPage />)

  fireEvent.click(await screen.findByRole("button", { name: "删除记录" }))

  await waitFor(() => {
    expect(window.localStorage.getItem(historyKey)).not.toContain(
      "history-frame-01",
    )
  })
  expect(screen.getByText("暂无生成记录")).toBeInTheDocument()
})
