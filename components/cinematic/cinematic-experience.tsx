"use client"

import { useEffect, useRef } from "react"

const reducedMotionQuery = "(prefers-reduced-motion: reduce)"

function canAnimate() {
  if (typeof window === "undefined") {
    return false
  }

  if (typeof window.matchMedia !== "function") {
    return true
  }

  return !window.matchMedia(reducedMotionQuery).matches
}

export function CinematicExperience() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const progressElement = progressRef.current
    const cursorElement = cursorRef.current

    if (!progressElement) {
      return
    }

    const progressBar = progressElement
    let frame: number | null = null

    function updateProgress() {
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0
      progressBar.style.transform = `scaleX(${Math.min(
        1,
        Math.max(0, progress),
      ).toFixed(4)})`
    }

    function requestProgressUpdate() {
      if (frame !== null) {
        return
      }

      frame = window.requestAnimationFrame(() => {
        frame = null
        updateProgress()
      })
    }

    updateProgress()
    window.addEventListener("scroll", requestProgressUpdate, { passive: true })
    window.addEventListener("resize", requestProgressUpdate)

    let cursorFrame: number | null = null
    let cursorX = window.innerWidth * 0.5
    let cursorY = window.innerHeight * 0.5

    function moveCursor(event: PointerEvent) {
      if (!cursorElement || !canAnimate()) {
        return
      }

      cursorX = event.clientX
      cursorY = event.clientY

      if (cursorFrame !== null) {
        return
      }

      cursorFrame = window.requestAnimationFrame(() => {
        cursorFrame = null
        cursorElement.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`
        document.documentElement.style.setProperty(
          "--pointer-x",
          `${(cursorX / window.innerWidth) * 100}%`,
        )
        document.documentElement.style.setProperty(
          "--pointer-y",
          `${(cursorY / window.innerHeight) * 100}%`,
        )
      })
    }

    window.addEventListener("pointermove", moveCursor, { passive: true })

    return () => {
      if (frame !== null) {
        window.cancelAnimationFrame(frame)
      }

      if (cursorFrame !== null) {
        window.cancelAnimationFrame(cursorFrame)
      }

      window.removeEventListener("scroll", requestProgressUpdate)
      window.removeEventListener("resize", requestProgressUpdate)
      window.removeEventListener("pointermove", moveCursor)
    }
  }, [])

  return (
    <>
      <div
        ref={cursorRef}
        aria-hidden="true"
        className="cinematic-cursor-glow"
      />
      <div
        aria-hidden="true"
        className="cinematic-vignette"
      />
      <div
        aria-label="滚动进度"
        className="cinematic-scroll-progress"
        role="progressbar"
      >
        <span ref={progressRef} />
      </div>
    </>
  )
}
