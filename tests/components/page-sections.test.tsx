import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, expect, it } from "vitest"
import Home from "@/app/page"

afterEach(() => {
  cleanup()
})

it("renders the cinematic landing page shell", () => {
  render(<Home />)

  expect(screen.getByText("FRAME 01 / VISUAL ENGINE / AI IMAGE STUDIO")).toBeInTheDocument()
  expect(screen.getByRole("link", { name: "查看示例" })).toHaveAttribute(
    "href",
    "#gallery",
  )
})

it("keeps all six landing sections in cinematic order", () => {
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

it("keeps homepage creation links pointed at the generate route", () => {
  render(<Home />)

  const generationLinks = screen.getAllByRole("link", {
    name: /开始创作|开始生成你的第一张作品/,
  })

  expect(generationLinks.length).toBeGreaterThan(0)
  generationLinks.forEach((link) => {
    expect(link).toHaveAttribute("href", "/generate")
  })
})

it("surfaces the generation history route from the homepage navigation", () => {
  render(<Home />)

  expect(screen.getByRole("link", { name: "历史影像" })).toHaveAttribute(
    "href",
    "/generate/history",
  )
})

it("renders the creation process and gallery anchors", () => {
  const { container } = render(<Home />)

  expect(container.querySelector("#process")).toBeInTheDocument()
  expect(container.querySelector("#gallery")).toBeInTheDocument()
  expect(container.querySelector("#membership")).toBeInTheDocument()
  expect(screen.getAllByText(/STEP 0[1-5]/)).toHaveLength(5)
})

it("renders the final CTA frame", () => {
  render(<Home />)

  expect(screen.getByText("FRAME 06 / FINAL CUT")).toBeInTheDocument()
  expect(
    screen.getByRole("link", { name: "开始生成你的第一张作品" }),
  ).toHaveAttribute("href", "/generate")
})

it("renders the Seedream generation studio route without changing the homepage", async () => {
  const routeSpecifier = "../../app/generate/page"
  const { default: GeneratePage } = await import(routeSpecifier)

  render(<GeneratePage />)

  expect(
    screen.getByText("FRAME 07 / SEEDREAM GENERATION STUDIO"),
  ).toBeInTheDocument()
  expect(
    screen.getByRole("heading", {
      name: "像导演一样调度",
    }),
  ).toBeInTheDocument()
  expect(screen.getByLabelText("主体描述")).toBeInTheDocument()
  expect(screen.getByRole("link", { name: "返回首页" })).toHaveAttribute("href", "/")
})
