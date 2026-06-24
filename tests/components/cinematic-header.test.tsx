import { readFileSync } from "node:fs"
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react"
import { afterEach, expect, it } from "vitest"
import { CinematicHeader } from "@/components/cinematic/cinematic-header"

const originalBodyOverflow = document.body.style.overflow

function getGlobalCssRule(selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const ruleMatch = readFileSync("app/globals.css", "utf8").match(
    new RegExp(`${escapedSelector}\\s*\\{(?<declarations>[^}]*)\\}`),
  )

  return ruleMatch?.groups?.declarations ?? ""
}

afterEach(() => {
  cleanup()
  document.body.style.overflow = originalBodyOverflow
})

it("renders the brand, desktop navigation, and creation call to action", () => {
  render(<CinematicHeader />)

  expect(
    screen.getByRole("link", { name: "绘境 AI 首页" }),
  ).toHaveAttribute("href", "/")
  expect(screen.getByRole("link", { name: "作品" })).toHaveAttribute(
    "href",
    "#gallery",
  )
  expect(screen.getByRole("link", { name: "创作流程" })).toHaveAttribute(
    "href",
    "#process",
  )
  expect(screen.getByRole("link", { name: "积分与会员" })).toHaveAttribute(
    "href",
    "#membership",
  )
  expect(screen.getByRole("link", { name: "开始创作" })).toHaveAttribute(
    "href",
    "/generate",
  )
})

it("opens an accessible modal navigation and moves focus to close", () => {
  render(<CinematicHeader />)

  const trigger = screen.getByRole("button", { name: "打开导航" })
  fireEvent.click(trigger)

  const dialog = screen.getByRole("dialog", { name: "站点导航" })
  const closeButton = within(dialog).getByRole("button", {
    name: "关闭导航",
  })

  expect(dialog).toHaveAttribute("aria-modal", "true")
  expect(document.body.style.overflow).toBe("hidden")
  expect(closeButton).toHaveFocus()
})

it("traps keyboard focus inside the open mobile menu", () => {
  render(<CinematicHeader />)

  fireEvent.click(screen.getByRole("button", { name: "打开导航" }))

  const dialog = screen.getByRole("dialog", { name: "站点导航" })
  const closeButton = within(dialog).getByRole("button", {
    name: "关闭导航",
  })
  const focusableLinks = within(dialog).getAllByRole("link")
  const lastFocusableItem = focusableLinks[focusableLinks.length - 1]

  expect(closeButton).toHaveFocus()
  expect(lastFocusableItem).toHaveAttribute("href", "/generate")

  fireEvent.keyDown(closeButton, { key: "Tab", shiftKey: true })

  expect(lastFocusableItem).toHaveFocus()

  fireEvent.keyDown(lastFocusableItem, { key: "Tab" })

  expect(closeButton).toHaveFocus()
})

it("allows the mobile menu overlay to scroll independently while the body is locked", () => {
  expect(getGlobalCssRule(".mobile-menu")).toMatch(/overflow-y\s*:\s*auto\s*;/)
})

it("closes on Escape, restores body overflow, and returns focus", () => {
  document.body.style.overflow = "auto"
  render(<CinematicHeader />)

  const trigger = screen.getByRole("button", { name: "打开导航" })
  fireEvent.click(trigger)
  fireEvent.keyDown(document, { key: "Escape" })

  expect(
    screen.queryByRole("dialog", { name: "站点导航" }),
  ).not.toBeInTheDocument()
  expect(document.body.style.overflow).toBe("auto")
  expect(trigger).toHaveFocus()
})

it("closes the mobile menu and restores body overflow after link navigation", () => {
  render(<CinematicHeader />)

  fireEvent.click(screen.getByRole("button", { name: "打开导航" }))
  const dialog = screen.getByRole("dialog", { name: "站点导航" })
  const mobileHrefs = within(dialog)
    .getAllByRole("link")
    .map((link) => link.getAttribute("href"))

  expect(mobileHrefs).toEqual([
    "/",
    "#gallery",
    "#process",
    "#membership",
    "/generate",
  ])

  fireEvent.click(within(dialog).getByRole("link", { name: "作品" }))

  expect(
    screen.queryByRole("dialog", { name: "站点导航" }),
  ).not.toBeInTheDocument()
  expect(document.body.style.overflow).toBe(originalBodyOverflow)
})

it("keeps trigger state in sync and restores body overflow on unmount", () => {
  document.body.style.overflow = "scroll"
  const { unmount } = render(<CinematicHeader />)
  const trigger = screen.getByRole("button", { name: "打开导航" })

  expect(trigger).toHaveAttribute("aria-controls", "mobile-site-nav")
  expect(trigger).toHaveAttribute("aria-expanded", "false")

  fireEvent.click(trigger)

  expect(trigger).toHaveAttribute("aria-expanded", "true")
  expect(screen.getByRole("dialog", { name: "站点导航" })).toHaveAttribute(
    "id",
    "mobile-site-nav",
  )
  expect(document.body.style.overflow).toBe("hidden")

  unmount()

  expect(document.body.style.overflow).toBe("scroll")
})
