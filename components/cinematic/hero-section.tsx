"use client"

import Image from "next/image"
import { useEffect, useRef } from "react"
import { cinematicAssets } from "@/lib/landing-content"
import { CinematicButton } from "./cinematic-button"
import { Reveal } from "./reveal"

const reducedMotionQuery = "(prefers-reduced-motion: reduce)"

function prefersReducedMotion() {
  if (typeof window === "undefined") {
    return true
  }

  if (typeof window.matchMedia !== "function") {
    return false
  }

  return window.matchMedia(reducedMotionQuery).matches
}

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const screenRef = useRef<HTMLDivElement>(null)
  const heroAsset = cinematicAssets.hero

  useEffect(() => {
    const section = sectionRef.current
    const screen = screenRef.current

    if (!section || !screen || prefersReducedMotion()) {
      return
    }

    const sectionElement = section
    const screenElement = screen
    const requestFrame =
      typeof window.requestAnimationFrame === "function"
        ? window.requestAnimationFrame.bind(window)
        : (callback: FrameRequestCallback) =>
            window.setTimeout(() => {
              const now =
                typeof window.performance !== "undefined"
                  ? window.performance.now()
                  : Date.now()
              callback(now)
            }, 16)
    const cancelFrame =
      typeof window.cancelAnimationFrame === "function"
        ? window.cancelAnimationFrame.bind(window)
        : window.clearTimeout.bind(window)
    let animationFrame: number | null = null

    function updateParallax() {
      if (animationFrame !== null) {
        return
      }

      animationFrame = requestFrame(() => {
        animationFrame = null
        const viewportHeight = window.innerHeight || 1
        const scrolledPastTop = Math.max(
          0,
          -sectionElement.getBoundingClientRect().top,
        )
        const maxShift = viewportHeight * 0.05
        const screenShift = Math.min(scrolledPastTop * 0.045, maxShift)
        const copyShift = Math.min(scrolledPastTop * 0.024, maxShift * 0.7)
        const copyOpacity = Math.max(
          0.72,
          1 - scrolledPastTop / (viewportHeight * 1.45),
        )

        screenElement.style.setProperty(
          "--hero-screen-shift",
          `${screenShift.toFixed(2)}px`,
        )
        sectionElement.style.setProperty(
          "--hero-copy-shift",
          `${(copyShift * -1).toFixed(2)}px`,
        )
        sectionElement.style.setProperty(
          "--hero-copy-opacity",
          copyOpacity.toFixed(3),
        )
      })
    }

    updateParallax()
    window.addEventListener("scroll", updateParallax, { passive: true })
    window.addEventListener("resize", updateParallax)

    return () => {
      if (animationFrame !== null) {
        cancelFrame(animationFrame)
      }

      window.removeEventListener("scroll", updateParallax)
      window.removeEventListener("resize", updateParallax)
    }
  }, [])

  useEffect(() => {
    const section = sectionRef.current
    const screen = screenRef.current

    if (!section || !screen || prefersReducedMotion()) {
      return
    }

    const sectionElement = section
    const screenElement = screen
    let animationFrame: number | null = null
    let pointerX = 0.5
    let pointerY = 0.5

    function updatePointerDepth() {
      animationFrame = null
      const tiltY = (pointerX - 0.5) * 5.2
      const tiltX = (0.5 - pointerY) * 3.4
      const lightX = 48 + (pointerX - 0.5) * 18
      const lightY = 18 + (pointerY - 0.5) * 10

      screenElement.style.setProperty("--hero-tilt-x", `${tiltX.toFixed(2)}deg`)
      screenElement.style.setProperty("--hero-tilt-y", `${tiltY.toFixed(2)}deg`)
      sectionElement.style.setProperty("--hero-light-x", `${lightX.toFixed(2)}%`)
      sectionElement.style.setProperty("--hero-light-y", `${lightY.toFixed(2)}%`)
    }

    function handlePointerMove(event: PointerEvent) {
      const rect = sectionElement.getBoundingClientRect()

      pointerX = (event.clientX - rect.left) / Math.max(rect.width, 1)
      pointerY = (event.clientY - rect.top) / Math.max(rect.height, 1)

      if (animationFrame !== null) {
        return
      }

      animationFrame = window.requestAnimationFrame(updatePointerDepth)
    }

    function handlePointerLeave() {
      pointerX = 0.5
      pointerY = 0.5

      if (animationFrame !== null) {
        return
      }

      animationFrame = window.requestAnimationFrame(updatePointerDepth)
    }

    sectionElement.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    })
    sectionElement.addEventListener("pointerleave", handlePointerLeave)

    return () => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame)
      }

      sectionElement.removeEventListener("pointermove", handlePointerMove)
      sectionElement.removeEventListener("pointerleave", handlePointerLeave)
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      aria-labelledby="hero-title"
      className="hero-section"
      id="hero-section"
    >
      <div aria-hidden="true" className="hero-atmosphere" />
      <div aria-hidden="true" className="hero-rail">
        <span />
      </div>
      <div ref={screenRef} className="hero-screen">
        <Image
          alt={heroAsset.alt}
          fill
          priority
          sizes="(max-width: 767px) 100vw, 64vw"
          src={heroAsset.src}
          style={{ objectPosition: heroAsset.focalPoint }}
        />
      </div>

      <div className="hero-copy">
        <Reveal>
          <p className="frame-label">
            FRAME 01 / VISUAL ENGINE / AI IMAGE STUDIO
          </p>
        </Reveal>
        <Reveal delay={110}>
          <h1 id="hero-title">
            <span className="hero-title-line">像导演一样</span>
            <span className="hero-title-line hero-title-line--wide">
              生成你的视觉大片
            </span>
          </h1>
        </Reveal>
        <Reveal delay={220}>
          <p className="hero-description">
            从灵感、风格、主体到画面语言，让 AI 自动理解你的创作意图。
          </p>
        </Reveal>
        <Reveal className="hero-actions" delay={340}>
          <CinematicButton href="/generate">开始创作</CinematicButton>
          <CinematicButton href="#gallery" variant="outline">
            查看示例
          </CinematicButton>
        </Reveal>
        <Reveal delay={430}>
          <div className="hero-meta" aria-label="电影参数">
            <span>●</span>
            <span>4K</span>
            <span>24FPS</span>
            <span>CINEMATIC</span>
          </div>
        </Reveal>
      </div>
      <div aria-hidden="true" className="hero-floor-reflection" />
    </section>
  )
}
