import Link from "next/link"
import type { MouseEventHandler, ReactNode } from "react"

type CinematicButtonProps = {
  ariaLabel?: string
  children: ReactNode
  href?: string
  onClick?: MouseEventHandler<HTMLElement>
  variant?: "solid" | "outline"
}

export function CinematicButton({
  ariaLabel,
  children,
  href,
  onClick,
  variant = "solid",
}: CinematicButtonProps) {
  const className = `cinematic-button cinematic-button--${variant}`
  const content = <span>{children}</span>

  if (href) {
    return (
      <Link
        aria-label={ariaLabel}
        className={className}
        href={href}
        onClick={onClick}
      >
        {content}
      </Link>
    )
  }

  return (
    <button
      aria-label={ariaLabel}
      className={className}
      onClick={onClick}
      type="button"
    >
      {content}
    </button>
  )
}
