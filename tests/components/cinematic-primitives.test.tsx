import { readFileSync } from "node:fs"
import path from "node:path"
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react"
import { renderToStaticMarkup } from "react-dom/server"
import { afterEach, expect, it, vi } from "vitest"
import { CinematicButton } from "@/components/cinematic/cinematic-button"
import { FilmGrain } from "@/components/cinematic/film-grain"
import { Reveal } from "@/components/cinematic/reveal"

const originalIntersectionObserverDescriptor =
  Object.getOwnPropertyDescriptor(window, "IntersectionObserver")

afterEach(() => {
  cleanup()

  if (originalIntersectionObserverDescriptor) {
    Object.defineProperty(
      window,
      "IntersectionObserver",
      originalIntersectionObserverDescriptor,
    )
  } else {
    Reflect.deleteProperty(window, "IntersectionObserver")
  }
})

function setIntersectionObserver(
  value: typeof window.IntersectionObserver | undefined,
) {
  Object.defineProperty(window, "IntersectionObserver", {
    value,
  })
}

function extractCssBlock(source: string, selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = new RegExp(`(?:^|\\n)\\s*${escapedSelector}\\s*\\{`, "m").exec(
    source,
  )

  if (!match) {
    throw new Error(`CSS block not found: ${selector}`)
  }

  const blockStart = source.indexOf("{", match.index)
  let depth = 0

  for (let index = blockStart; index < source.length; index += 1) {
    if (source[index] === "{") {
      depth += 1
    } else if (source[index] === "}") {
      depth -= 1

      if (depth === 0) {
        return source.slice(blockStart + 1, index)
      }
    }
  }

  throw new Error(`CSS block is not closed: ${selector}`)
}

function createIntersectionObserverHarness() {
  let callback: IntersectionObserverCallback | undefined
  let options: IntersectionObserverInit | undefined
  const instances: IntersectionObserver[] = []
  const disconnect = vi.fn()
  const observe = vi.fn()

  class TriggerableIntersectionObserver implements IntersectionObserver {
    readonly root = null
    readonly rootMargin = "0px"
    readonly scrollMargin = "0px"
    readonly thresholds = [0.18]
    disconnect = disconnect
    observe = observe
    takeRecords = vi.fn(() => [])
    unobserve = vi.fn()

    constructor(
      observerCallback: IntersectionObserverCallback,
      observerOptions?: IntersectionObserverInit,
    ) {
      callback = observerCallback
      options = observerOptions
      instances.push(this)
    }
  }

  setIntersectionObserver(TriggerableIntersectionObserver)

  return {
    disconnect,
    observe,
    trigger(entry: IntersectionObserverEntry) {
      const instance = instances.at(-1)

      if (!callback || !instance) {
        throw new Error("IntersectionObserver was not constructed")
      }

      callback([entry], instance)
    },
    getOptions: () => options,
  }
}

function createIntersectionEntry(
  target: Element,
  isIntersecting: boolean,
): IntersectionObserverEntry {
  const bounds = target.getBoundingClientRect()

  return {
    boundingClientRect: bounds,
    intersectionRatio: isIntersecting ? 1 : 0,
    intersectionRect: bounds,
    isIntersecting,
    rootBounds: null,
    target,
    time: 0,
  }
}

it("keeps cinematic CSS contracts scoped to the intended rules", () => {
  const css = readFileSync(
    path.resolve(process.cwd(), "app/globals.css"),
    "utf8",
  )
  const theme = extractCssBlock(css, "@theme")
  const button = extractCssBlock(css, ".cinematic-button")
  const grain = extractCssBlock(css, ".film-grain")
  const reveal = extractCssBlock(css, ".reveal")
  const reducedMotion = extractCssBlock(
    css,
    "@media (prefers-reduced-motion: reduce)",
  )
  const reducedHtml = extractCssBlock(reducedMotion, "html")
  const reducedGrain = extractCssBlock(reducedMotion, ".film-grain")
  const reducedReveal = extractCssBlock(reducedMotion, ".reveal")
  const themeColors = Array.from(
    theme.matchAll(/(--color-[\w-]+):\s*(#[\da-f]{6});/gi),
    ([, name, value]) => [name, value],
  )

  expect(themeColors).toEqual([
    ["--color-canvas", "#030405"],
    ["--color-stage", "#07090b"],
    ["--color-graphite", "#111419"],
    ["--color-ink", "#f2f3f1"],
    ["--color-muted", "#9a9fa7"],
    ["--color-cold", "#b9e2f8"],
    ["--color-cold-deep", "#7cbbd8"],
  ])
  expect(button).toMatch(/min-height:\s*48px/)
  expect(button).toMatch(/color:\s*var\(--color-ink\)/)
  expect(css).not.toMatch(/\.cinematic-button:active\s*\{/)
  expect(grain).toMatch(/inset:\s*-12%/)
  expect(grain).toMatch(/background-size:\s*256px 256px/)
  expect(grain).toMatch(/will-change:\s*transform/)
  expect(grain).toMatch(/animation:\s*grain-shift 0\.24s steps\(2\) infinite/)
  expect(css).not.toMatch(
    /@media\s*\(max-width:\s*767px\)\s*\{\s*\.film-grain\s*\{[^}]*opacity:/,
  )
  expect(reducedHtml).toMatch(/scroll-behavior:\s*auto/)
  expect(reducedGrain).toMatch(/animation:\s*none/)
  expect(reducedReveal).toMatch(/opacity:\s*1/)
  expect(reducedReveal).toMatch(/transform:\s*none/)
  expect(reducedReveal).toMatch(/transition-duration:\s*120ms/)
  expect(reveal).toMatch(/cubic-bezier\(0\.22,\s*1,\s*0\.36,\s*1\)/)
})

it("keeps the cinematic noise asset compact and decodable", () => {
  const noise = readFileSync(
    path.resolve(process.cwd(), "public/cinematic/noise.png"),
  )

  expect(noise.subarray(0, 8)).toEqual(
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  )

  const width = noise.readUInt32BE(16)
  const height = noise.readUInt32BE(20)
  const colorType = noise[25]

  expect(width).toBe(256)
  expect(height).toBe(256)
  expect([0, 3]).toContain(colorType)
  expect(noise.byteLength).toBeLessThan(50_000)
})

it("renders solid and outline cinematic links with anchor props", () => {
  render(
    <>
      <CinematicButton
        ariaLabel="Generate"
        className="hero-link"
        href="/generate"
      >
        Generate artwork
      </CinematicButton>
      <CinematicButton
        href="/gallery"
        rel="noreferrer"
        target="_blank"
        variant="outline"
      >
        查看作品
      </CinematicButton>
    </>,
  )

  const generateLink = screen.getByRole("link", { name: "Generate" })

  expect(generateLink.tagName).toBe("A")
  expect(generateLink).toHaveAttribute("href", "/generate")
  expect(generateLink).toHaveClass(
    "cinematic-button",
    "cinematic-button--solid",
    "hero-link",
  )
  expect(screen.getByRole("link", { name: "查看作品" })).toHaveClass(
    "cinematic-button--outline",
  )
  expect(screen.getByRole("link", { name: "查看作品" })).toHaveAttribute(
    "target",
    "_blank",
  )
  expect(screen.getByRole("link", { name: "查看作品" })).toHaveAttribute(
    "rel",
    "noreferrer",
  )
})

it("renders a clickable button when href is omitted", () => {
  const onClick = vi.fn()

  render(<CinematicButton onClick={onClick}>播放影片</CinematicButton>)
  fireEvent.click(screen.getByRole("button", { name: "播放影片" }))

  expect(onClick).toHaveBeenCalledOnce()
  expect(screen.getByRole("button")).not.toHaveAttribute("target")
})

it("forwards native button props and defaults type to button", () => {
  render(
    <CinematicButton
      aria-expanded={false}
      ariaLabel="Pause"
      className="player-button"
      disabled
      form="player-controls"
    >
      Pause film
    </CinematicButton>,
  )

  const button = screen.getByRole("button", { name: "Pause" })

  expect(button).toBeDisabled()
  expect(button).toHaveAttribute("aria-expanded", "false")
  expect(button).toHaveAttribute("form", "player-controls")
  expect(button).toHaveAttribute("type", "button")
  expect(button).toHaveClass(
    "cinematic-button",
    "cinematic-button--solid",
    "player-button",
  )
})

it("renders film grain as hidden decoration", () => {
  const { container } = render(<FilmGrain />)
  const grain = container.querySelector(".film-grain")

  expect(grain).toHaveAttribute("aria-hidden", "true")
})

it("renders Reveal as visible in server markup", () => {
  const markup = renderToStaticMarkup(
    <Reveal>
      <p>Server-visible content</p>
    </Reveal>,
  )

  expect(markup).toContain('class="reveal reveal--visible"')
})

it("reveals immediately when IntersectionObserver is unavailable", () => {
  setIntersectionObserver(undefined)

  expect(() =>
    render(
      <Reveal>
        <p>兼容呈现</p>
      </Reveal>,
    ),
  ).not.toThrow()

  expect(screen.getByText("兼容呈现").parentElement).toHaveClass(
    "reveal--visible",
  )
})

it("observes the rendered Reveal node", () => {
  const observer = createIntersectionObserverHarness()

  render(
    <Reveal className="feature-reveal" delay={120}>
      <p>逐帧呈现</p>
    </Reveal>,
  )

  const reveal = screen.getByText("逐帧呈现").parentElement

  expect(reveal).not.toBeNull()
  expect(observer.observe).toHaveBeenCalledWith(reveal)
  expect(observer.getOptions()?.threshold).toBe(0.18)
  expect(reveal).toHaveStyle("--reveal-delay: 120ms")
  expect(reveal).not.toHaveClass("reveal--visible")
})

it("does not reveal for a non-intersecting entry", () => {
  const observer = createIntersectionObserverHarness()

  render(
    <Reveal>
      <p>等待入场</p>
    </Reveal>,
  )

  const reveal = screen.getByText("等待入场").parentElement

  if (!reveal) {
    throw new Error("Reveal wrapper was not rendered")
  }

  act(() => {
    observer.trigger(createIntersectionEntry(reveal, false))
  })

  expect(reveal).not.toHaveClass("reveal--visible")
  expect(observer.disconnect).not.toHaveBeenCalled()
})

it("reveals once intersecting", () => {
  const observer = createIntersectionObserverHarness()

  render(
    <Reveal>
      <p>进入画面</p>
    </Reveal>,
  )

  const reveal = screen.getByText("进入画面").parentElement

  if (!reveal) {
    throw new Error("Reveal wrapper was not rendered")
  }

  act(() => {
    observer.trigger(createIntersectionEntry(reveal, true))
  })

  expect(reveal).toHaveClass("reveal--visible")
  expect(observer.disconnect).toHaveBeenCalledOnce()
})

it("disconnects its observer when unmounted", () => {
  const observer = createIntersectionObserverHarness()
  const { unmount } = render(
    <Reveal>
      <p>离开画面</p>
    </Reveal>,
  )

  unmount()

  expect(observer.disconnect).toHaveBeenCalledOnce()
})
