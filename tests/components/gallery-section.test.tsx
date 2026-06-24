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

const expectedImageSizes = {
  portrait: "(max-width: 767px) 50vw, 34vw",
  product: "(max-width: 767px) 100vw, 42vw",
  fantasy: "(max-width: 767px) 50vw, 25vw",
  fashion: "(max-width: 767px) 50vw, 25vw",
  architecture: "(max-width: 767px) 100vw, 42vw",
  car: "(max-width: 767px) 100vw, 34vw",
} satisfies Record<(typeof galleryItems)[number]["slug"], string>

function getNarrowMobileGalleryCss() {
  const globalsCss = readFileSync(
    path.join(process.cwd(), "app", "globals.css"),
    "utf8",
  )
  const mediaQueryStart = globalsCss.indexOf("@media (max-width: 520px)")

  expect(mediaQueryStart).toBeGreaterThanOrEqual(0)

  return globalsCss.slice(mediaQueryStart)
}

function getDeclarationBlock(css: string, selector: string) {
  const selectorStart = css.indexOf(selector)

  expect(selectorStart).toBeGreaterThanOrEqual(0)

  const blockStart = css.indexOf("{", selectorStart)
  const blockEnd = css.indexOf("}", blockStart)

  expect(blockStart).toBeGreaterThan(selectorStart)
  expect(blockEnd).toBeGreaterThan(blockStart)

  return css.slice(blockStart + 1, blockEnd)
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

    const image = screen.getByAltText(item.alt)

    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute("sizes", expectedImageSizes[item.slug])
  }
})

it("keeps the narrow mobile gallery as an editorial two-column collage", () => {
  const narrowMobileGalleryCss = getNarrowMobileGalleryCss()

  expect(narrowMobileGalleryCss).toContain(
    "grid-template-columns: repeat(2, minmax(0, 1fr));",
  )
  expect(narrowMobileGalleryCss).not.toContain("grid-template-columns: 1fr;")

  for (const selector of [
    ".gallery-frame.gallery-item--product",
    ".gallery-frame.gallery-item--architecture",
    ".gallery-frame.gallery-item--car",
  ]) {
    expect(getDeclarationBlock(narrowMobileGalleryCss, selector)).toContain(
      "grid-column: span 2;",
    )
  }
})
