import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import {
  IntroSequence,
  introSeenStorageKey,
} from "@/components/cinematic/intro-sequence"

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
})

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.useRealTimers()
})

it("plays a cinematic intro for first-time visitors and remembers completion", () => {
  render(<IntroSequence />)

  expect(screen.getByText("绘境 AI")).toBeInTheDocument()
  expect(
    screen.getByText("VISUAL ENGINE / AI IMAGE STUDIO"),
  ).toBeInTheDocument()
  expect(screen.getByRole("button", { name: "SKIP INTRO" })).toBeInTheDocument()

  act(() => {
    vi.advanceTimersByTime(5600)
  })

  expect(
    screen.queryByText("VISUAL ENGINE / AI IMAGE STUDIO"),
  ).not.toBeInTheDocument()
  expect(localStorage.getItem(introSeenStorageKey)).toBe("true")
})

it("uses a cinematic exit phase before revealing the hero", () => {
  const { container } = render(<IntroSequence />)

  expect(container.querySelector(".intro-sequence__curtain")).not.toBeInTheDocument()
  expect(container.querySelector(".intro-sequence__exposure")).not.toBeInTheDocument()
  expect(container.querySelector(".intro-sequence__slider--top")).toBeInTheDocument()
  expect(container.querySelector(".intro-sequence__slider--bottom")).toBeInTheDocument()

  act(() => {
    vi.advanceTimersByTime(3700)
  })

  expect(container.querySelector(".intro-sequence--exiting")).toBeInTheDocument()
  expect(container.querySelector(".intro-sequence__curtain")).not.toBeInTheDocument()
  expect(container.querySelector(".intro-sequence__slider--top")).toBeInTheDocument()
  expect(container.querySelector(".intro-sequence__slider--bottom")).toBeInTheDocument()
  expect(document.body.classList.contains("huijing-intro-exiting")).toBe(true)

  act(() => {
    vi.advanceTimersByTime(1200)
  })

  expect(container.querySelector(".intro-sequence--settling")).toBeInTheDocument()
  expect(document.body.classList.contains("huijing-intro-exiting")).toBe(true)

  act(() => {
    vi.advanceTimersByTime(800)
  })

  expect(container.querySelector(".intro-sequence")).not.toBeInTheDocument()
  expect(document.body.classList.contains("huijing-intro-active")).toBe(false)
})

it("allows users to skip the intro immediately", () => {
  render(<IntroSequence />)

  fireEvent.click(screen.getByRole("button", { name: "SKIP INTRO" }))

  expect(
    screen.queryByText("VISUAL ENGINE / AI IMAGE STUDIO"),
  ).not.toBeInTheDocument()
  expect(localStorage.getItem(introSeenStorageKey)).toBe("true")
})

it("does not replay the intro after the browser has seen it", () => {
  localStorage.setItem(introSeenStorageKey, "true")

  render(<IntroSequence />)
  act(() => {
    vi.advanceTimersByTime(0)
  })

  expect(
    screen.queryByText("VISUAL ENGINE / AI IMAGE STUDIO"),
  ).not.toBeInTheDocument()
})
