"use client"

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"

type RevealProps = {
  children: ReactNode
  className?: string
  delay?: number
}

type RevealStyle = CSSProperties & {
  "--reveal-delay": string
}

export function Reveal({
  children,
  className,
  delay = 0,
}: RevealProps) {
  const elementRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = elementRef.current

    if (!element) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.18 },
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  const classes = [
    "reveal",
    isVisible ? "reveal--visible" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ")
  const style: RevealStyle = {
    "--reveal-delay": `${delay}ms`,
  }

  return (
    <div className={classes} ref={elementRef} style={style}>
      {children}
    </div>
  )
}
