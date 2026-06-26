import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, expect, it } from "vitest"
import { GenerationHistoryPage } from "@/components/cinematic/generation-history-page"

const historyKey = "huijing.seedream.history.v1"

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

it("renders an independent cinematic history page with a premium empty state", () => {
  render(<GenerationHistoryPage />)

  expect(
    screen.getByRole("heading", { name: "历史影像档案" }),
  ).toBeInTheDocument()
  expect(screen.getByText("FRAME ARCHIVE / LOCAL HISTORY")).toBeInTheDocument()
  expect(screen.getByText("暂无生成记录")).toBeInTheDocument()
  expect(screen.getByRole("link", { name: "返回生图工作台" })).toHaveAttribute(
    "href",
    "/generate",
  )
  expect(screen.getByRole("link", { name: "返回首页" })).toHaveAttribute(
    "href",
    "/",
  )
})

it("loads local generation history and lets users inspect frames like a film archive", async () => {
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
      {
        id: "frame-02",
        createdAt: "2026-06-25T10:15:00.000Z",
        imageUrl: "https://example.com/second-frame.png",
        prompt: "second editorial prompt",
        subject: "银白香水瓶在黑色水面形成倒影",
        imageType: "产品摄影",
        mood: "奢侈品牌广告片",
        aspectRatio: "1:1",
        quality: "2K",
      },
    ]),
  )

  render(<GenerationHistoryPage />)

  await waitFor(() => {
    expect(screen.getByAltText("历史作品：雨夜高楼边缘的未来城市导演")).toHaveAttribute(
      "src",
      "https://example.com/first-frame.png",
    )
  })

  expect(screen.getByText("共 2 帧")).toBeInTheDocument()
  expect(screen.getByText("first cinematic prompt")).toBeInTheDocument()
  expect(screen.getByText("电影海报 / 黑色电影 / 16:9 / 4K")).toBeInTheDocument()

  fireEvent.click(
    screen.getByRole("button", { name: /银白香水瓶在黑色水面形成倒影/ }),
  )

  expect(screen.getByAltText("历史作品：银白香水瓶在黑色水面形成倒影")).toHaveAttribute(
    "src",
    "https://example.com/second-frame.png",
  )
  expect(screen.getByText("second editorial prompt")).toBeInTheDocument()
  expect(
    screen.getByText("产品摄影 / 奢侈品牌广告片 / 1:1 / 2K"),
  ).toBeInTheDocument()
})

it("exposes the history page through a dedicated route without touching the generate page", async () => {
  const { default: HistoryRoute } = await import("../../app/generate/history/page")

  render(<HistoryRoute />)

  expect(
    screen.getByRole("heading", { name: "历史影像档案" }),
  ).toBeInTheDocument()
})
