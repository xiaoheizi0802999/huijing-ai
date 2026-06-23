import { readFileSync } from "node:fs"
import path from "node:path"
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react"
import { expect, it, vi } from "vitest"
import { CinematicButton } from "@/components/cinematic/cinematic-button"
import { FilmGrain } from "@/components/cinematic/film-grain"
import { Reveal } from "@/components/cinematic/reveal"

it("keeps the cinematic CSS motion and button contracts", () => {
  const css = readFileSync(
    path.resolve(process.cwd(), "app/globals.css"),
    "utf8",
  )

  expect(css).toContain("min-height: 48px")
  expect(css).toContain("grain-shift 0.24s steps(2) infinite")
  expect(css).toContain("cubic-bezier(0.22, 1, 0.36, 1)")
  expect(css).toContain(
    ".cinematic-button--outline:hover,\n.cinematic-button--outline:focus-visible",
  )
})

it("renders solid and outline cinematic links", () => {
  render(
    <>
      <CinematicButton href="/generate">开始生成</CinematicButton>
      <CinematicButton href="/gallery" variant="outline">
        查看作品
      </CinematicButton>
    </>,
  )

  expect(screen.getByRole("link", { name: "开始生成" })).toHaveAttribute(
    "href",
    "/generate",
  )
  expect(screen.getByRole("link", { name: "开始生成" })).toHaveClass(
    "cinematic-button",
    "cinematic-button--solid",
  )
  expect(screen.getByRole("link", { name: "查看作品" })).toHaveClass(
    "cinematic-button--outline",
  )
})

it("renders a clickable button when href is omitted", () => {
  const onClick = vi.fn()

  render(<CinematicButton onClick={onClick}>播放影片</CinematicButton>)
  fireEvent.click(screen.getByRole("button", { name: "播放影片" }))

  expect(onClick).toHaveBeenCalledOnce()
})

it("renders film grain as hidden decoration", () => {
  const { container } = render(<FilmGrain />)
  const grain = container.querySelector(".film-grain")

  expect(grain).toHaveAttribute("aria-hidden", "true")
})

it("reveals once intersecting and applies its delay", () => {
  const originalIntersectionObserver = window.IntersectionObserver
  let observerCallback: IntersectionObserverCallback | undefined
  let observerOptions: IntersectionObserverInit | undefined
  const disconnect = vi.fn()

  class TriggerableIntersectionObserver implements IntersectionObserver {
    readonly root = null
    readonly rootMargin = "0px"
    readonly scrollMargin = "0px"
    readonly thresholds = [0.18]
    disconnect = disconnect
    observe = vi.fn()
    takeRecords = vi.fn(() => [])
    unobserve = vi.fn()

    constructor(
      callback: IntersectionObserverCallback,
      options?: IntersectionObserverInit,
    ) {
      observerCallback = callback
      observerOptions = options
    }
  }

  window.IntersectionObserver = TriggerableIntersectionObserver

  try {
    render(
      <Reveal className="feature-reveal" delay={120}>
        <p>逐帧呈现</p>
      </Reveal>,
    )

    const reveal = screen.getByText("逐帧呈现").parentElement

    if (!reveal) {
      throw new Error("Reveal wrapper was not rendered")
    }

    expect(reveal).toHaveClass("reveal", "feature-reveal")
    expect(reveal).not.toHaveClass("reveal--visible")
    expect(reveal).toHaveStyle("--reveal-delay: 120ms")
    expect(observerOptions?.threshold).toBe(0.18)
    expect(observerCallback).toBeTypeOf("function")

    act(() => {
      const bounds = reveal.getBoundingClientRect()

      observerCallback?.(
        [
          {
            boundingClientRect: bounds,
            intersectionRatio: 1,
            intersectionRect: bounds,
            isIntersecting: true,
            rootBounds: null,
            target: reveal,
            time: 0,
          },
        ],
        {} as IntersectionObserver,
      )
    })

    expect(reveal).toHaveClass("reveal--visible")
    expect(disconnect).toHaveBeenCalledOnce()
  } finally {
    cleanup()
    window.IntersectionObserver = originalIntersectionObserver
  }
})
