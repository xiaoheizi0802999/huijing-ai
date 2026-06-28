import { cleanup, render, screen } from "@testing-library/react"
import { renderToString } from "react-dom/server"
import { afterEach, expect, it } from "vitest"
import { GenerationHistoryPage } from "@/components/cinematic/generation-history-page"

const historyKey = "huijing.seedream.history.v1"

function writeLocalHistory() {
  window.localStorage.setItem(
    historyKey,
    JSON.stringify([
      {
        aspectRatio: "16:9",
        createdAt: "2026-06-25T09:30:00.000Z",
        id: "frame-01",
        imageType: "电影海报",
        imageUrl: "https://example.com/first-frame.png",
        mood: "黑色电影",
        prompt: "first cinematic prompt",
        quality: "4K",
        subject: "雨夜高楼边缘的未来城市导演",
      },
    ]),
  )
}

afterEach(() => {
  cleanup()
  window.history.replaceState({}, "", "/generate/history")
  window.localStorage.clear()
})

it("renders a deterministic local archive state on the server", () => {
  const html = renderToString(<GenerationHistoryPage />)

  expect(html).toContain("FRAME ARCHIVE / LOCAL HISTORY")
  expect(html).not.toContain("LOGIN REQUIRED")
})

it("renders local browser history without any login gate", () => {
  writeLocalHistory()

  render(<GenerationHistoryPage />)

  expect(screen.getByText("FRAME ARCHIVE / LOCAL HISTORY")).toBeInTheDocument()
  expect(
    screen.getByAltText("历史作品：雨夜高楼边缘的未来城市导演"),
  ).toHaveAttribute("src", "https://example.com/first-frame.png")
  expect(screen.getByText("first cinematic prompt")).toBeInTheDocument()
})

it("renders an empty local archive without entry controls", () => {
  render(<GenerationHistoryPage />)

  expect(
    screen.getByRole("heading", { name: "历史影像档案" }),
  ).toBeInTheDocument()
  expect(screen.getByText("暂无生成记录")).toBeInTheDocument()
  expect(screen.getByText("生成第一张图片后，本地历史会出现在这里。")).toBeInTheDocument()
  expect(screen.getByRole("link", { name: "返回生图工作台" })).toHaveAttribute(
    "href",
    "/generate",
  )
  expect(screen.getByRole("link", { name: "返回首页" })).toHaveAttribute(
    "href",
    "/",
  )
})

it("exposes the history page through a dedicated route", async () => {
  const { default: HistoryRoute } = await import("../../app/generate/history/page")

  render(<HistoryRoute />)

  expect(
    screen.getByRole("heading", { name: "历史影像档案" }),
  ).toBeInTheDocument()
  expect(screen.getByText("暂无生成记录")).toBeInTheDocument()
})
