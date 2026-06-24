import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, expect, it } from "vitest"

afterEach(() => {
  cleanup()
})

it("renders the editorial AI gallery section", async () => {
  const { GallerySection } = await import(
    "@/components/cinematic/gallery-section"
  )
  const { container } = render(<GallerySection />)

  const section = container.querySelector("#gallery")

  expect(section).toBeInTheDocument()
  expect(section).toHaveAttribute("aria-labelledby", "gallery-title")
  expect(screen.getByText("FRAME 04 / AI GALLERY")).toBeInTheDocument()
  expect(
    screen.getByRole("heading", {
      name: /AI 镜头库\s*\/\s*电影级作品示例/,
    }),
  ).toBeInTheDocument()

  const figures = screen.getAllByRole("figure")

  expect(figures).toHaveLength(6)
  expect(
    screen.getByRole("figure", { name: "Cinematic Portrait" }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole("figure", { name: "Luxury Product Shot" }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole("figure", { name: "Dark Fantasy Scene" }),
  ).toBeInTheDocument()
})
