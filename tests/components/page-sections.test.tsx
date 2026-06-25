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

it("renders all six landing sections in cinematic order", () => {
  const { container } = render(<Home />)

  const sectionIdentifiers = Array.from(
    container.querySelectorAll("main > section"),
  ).map((section) => section.id || section.className)

  expect(sectionIdentifiers).toEqual([
    "hero-section",
    "capabilities-section",
    "process",
    "gallery",
    "membership",
    "final-cta-section",
  ])
})

it("renders hero actions, frame label, and core capabilities", () => {
  render(<Home />)

  const generationLinks = screen.getAllByRole("link", {
    name: /开始创作|开始生成你的第一张作品/,
  })

  expect(generationLinks.length).toBeGreaterThan(0)
  generationLinks.forEach((link) => {
    expect(link).toHaveAttribute("href", "/generate")
  })
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

it("renders the five-shot creation process section", () => {
  const { container } = render(<Home />)

  expect(container.querySelector("#process")).toBeInTheDocument()
  expect(
    screen.getByRole("heading", {
      name: /从想法到大片，\s*只需五个镜头/,
    }),
  ).toBeInTheDocument()
  expect(screen.getAllByText(/STEP 0[1-5]/)).toHaveLength(5)
  expect(
    screen.getByRole("heading", { name: "生成高清图片" }),
  ).toBeInTheDocument()
})

it("renders the final CTA for the preview creation studio", () => {
  render(<Home />)

  expect(screen.getByText("FRAME 06 / FINAL CUT")).toBeInTheDocument()
  expect(
    screen.getByRole("heading", { name: /每一次生成，都是一帧电影/ }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole("link", { name: "开始生成你的第一张作品" }),
  ).toHaveAttribute("href", "/generate")
})

it("renders the generate preview placeholder route", async () => {
  const routeSpecifier = "../../app/generate/page"
  const { default: GeneratePage } = await import(routeSpecifier)

  render(<GeneratePage />)

  expect(screen.getByText("CREATION STUDIO / PREVIEW")).toBeInTheDocument()
  expect(
    screen.getByRole("heading", {
      name: "创作工作台将在下一阶段接入",
    }),
  ).toBeInTheDocument()
  expect(
    screen.getByText(
      "营销首页已经准备好。真实生图、积分和历史记录将沿用绘境 AI MVP 规格继续实现。",
    ),
  ).toBeInTheDocument()
  expect(screen.getByRole("link", { name: "返回暗光剧场" })).toHaveAttribute(
    "href",
    "/",
  )
})
