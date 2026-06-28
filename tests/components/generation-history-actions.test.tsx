import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import { GenerationHistoryPage } from "@/components/cinematic/generation-history-page"

const historyKey = "huijing.seedream.history.v1"

function writeLocalHistory() {
  window.localStorage.setItem(
    historyKey,
    JSON.stringify([
      {
        aspectRatio: "16:9",
        createdAt: "2026-06-25T09:30:00.000Z",
        id: "history-frame-01",
        imageType: "产品摄影",
        imageUrl: "data:image/png;base64,aGlzdG9yeS1mcmFtZQ==",
        mood: "奢侈品牌广告片",
        prompt: "history prompt",
        quality: "4K",
        subject: "黑色水面上的银白香水瓶",
      },
    ]),
  )
}

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
  vi.unstubAllGlobals()
})

it("downloads the selected local history frame", async () => {
  writeLocalHistory()
  const { anchor, click } = mockAnchorDownload()

  render(<GenerationHistoryPage />)

  fireEvent.click(screen.getByRole("button", { name: "下载图片" }))

  await waitFor(() => {
    expect(click).toHaveBeenCalledOnce()
  })
  expect(anchor.href).toContain("data:image/png;base64")
  expect(anchor.download).toContain("huijing-ai-")
})

it("deletes the selected local history frame without calling an API", () => {
  writeLocalHistory()
  const fetchMock = vi.fn()
  vi.stubGlobal("fetch", fetchMock)

  render(<GenerationHistoryPage />)

  fireEvent.click(screen.getByRole("button", { name: "删除记录" }))

  expect(fetchMock).not.toHaveBeenCalled()
  expect(window.localStorage.getItem(historyKey)).toBe("[]")
  expect(screen.getByText("暂无生成记录")).toBeInTheDocument()
})
