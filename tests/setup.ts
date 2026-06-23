import "@testing-library/jest-dom/vitest"
import { vi } from "vitest"

class IntersectionObserverMock implements IntersectionObserver {
  readonly root = null
  readonly rootMargin = "0px"
  readonly scrollMargin = "0px"
  readonly thresholds = [0]
  disconnect: IntersectionObserver["disconnect"] = vi.fn()
  observe: IntersectionObserver["observe"] = vi.fn()
  takeRecords: IntersectionObserver["takeRecords"] = vi.fn(() => [])
  unobserve: IntersectionObserver["unobserve"] = vi.fn()
}

Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  value: IntersectionObserverMock,
})

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation(
    (query: string): MediaQueryList =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as MediaQueryList,
  ),
})
