import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, expect, it } from "vitest"
import Home from "@/app/page"

afterEach(() => {
  cleanup()
})

it("renders the cinematic landing page shell", () => {
  render(<Home />)

  expect(
    screen.getByRole("heading", { name: /像导演一样\s*生成你的视觉大片/ }),
  ).toBeInTheDocument()
})

it("renders hero actions, frame label, and core capabilities", () => {
  render(<Home />)

  expect(
    screen.getAllByRole("link", { name: "开始创作" }).some(
      (link) => link.getAttribute("href") === "/generate",
    ),
  ).toBe(true)
  expect(screen.getByRole("link", { name: "查看示例" })).toHaveAttribute(
    "href",
    "#gallery",
  )
  expect(
    screen.getByText("FRAME 01 / VISUAL ENGINE / AI IMAGE STUDIO"),
  ).toBeInTheDocument()
  expect(
    screen.getByRole("heading", {
      name: /不是输入提示词，\s*而是构建一场视觉叙事/,
    }),
  ).toBeInTheDocument()

  expect(
    screen.getByRole("heading", { name: "选择图片类型" }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole("heading", { name: "输入主体与需求" }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole("heading", { name: "自动生成专业提示词" }),
  ).toBeInTheDocument()
})
