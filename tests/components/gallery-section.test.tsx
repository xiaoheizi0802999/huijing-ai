import { readFileSync } from "node:fs"
import path from "node:path"
import { cleanup, render, screen, within } from "@testing-library/react"
import { afterEach, expect, it } from "vitest"
import { galleryItems } from "@/lib/landing-content"

const expectedGalleryTitles = [
  "Cinematic Portrait",
  "Luxury Product Shot",
  "Dark Fantasy Scene",
  "Editorial Fashion",
  "Architectural Vision",
  "Cinematic Car Scene",
] as const

function getNarrowMobileGalleryCss() {
  const globalsCss = readFileSync(
    path.join(process.cwd(), "app", "globals.css"),
    "utf8",
  )
  const mediaQueryStart = globalsCss.indexOf("@media (max-width: 520px)")

  expect(mediaQueryStart).toBeGreaterThanOrEqual(0)

  return globalsCss.slice(mediaQueryStart)
}

afterEach(() => {
  cleanup()
})

it("renders every editorial AI gallery work accessibly", async () => {
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

  expect(galleryItems.map((item) => item.title)).toEqual(expectedGalleryTitles)
  expect(figures).toHaveLength(galleryItems.length)

  for (const item of galleryItems) {
    const figure = screen.getByRole("figure", { name: item.title })

    expect(within(figure).getByRole("heading", { name: item.title }))
      .toBeInTheDocument()
    expect(within(figure).getByText(item.description)).toBeInTheDocument()
    expect(figure.parentElement).toHaveClass(item.className)
    expect(item.alt).not.toHaveLength(0)
    expect(screen.getByAltText(item.alt)).toBeInTheDocument()
  }
})

it("keeps the narrow mobile gallery as an editorial two-column collage", () => {
  const narrowMobileGalleryCss = getNarrowMobileGalleryCss()

  expect(narrowMobileGalleryCss).toContain(
    "grid-template-columns: repeat(2, minmax(0, 1fr));",
  )
  expect(narrowMobileGalleryCss).not.toContain("grid-template-columns: 1fr;")
  expect(narrowMobileGalleryCss).toMatch(
    /\.gallery-frame\.gallery-item--product[\s\S]*grid-column: span 2;/,
  )
  expect(narrowMobileGalleryCss).toMatch(
    /\.gallery-frame\.gallery-item--architecture[\s\S]*grid-column: span 2;/,
  )
  expect(narrowMobileGalleryCss).toMatch(
    /\.gallery-frame\.gallery-item--car[\s\S]*grid-column: span 2;/,
  )
})
