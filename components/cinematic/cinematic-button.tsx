import Link from "next/link"
import type {
  ButtonHTMLAttributes,
  ComponentProps,
  MouseEventHandler,
  ReactNode,
} from "react"

type Shared = {
  children: ReactNode
  variant?: "solid" | "outline"
  ariaLabel?: string
}

type LinkProps = Shared &
  Omit<
    ComponentProps<typeof Link>,
    "className" | "children" | "aria-label" | "onClick"
  > & {
    href: ComponentProps<typeof Link>["href"]
    onClick?: MouseEventHandler<HTMLAnchorElement>
  }

type ButtonProps = Shared &
  Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "className" | "children" | "aria-label"
  > & {
    href?: never
  }

type CinematicButtonProps = LinkProps | ButtonProps

export function CinematicButton(props: CinematicButtonProps) {
  if (props.href !== undefined) {
    const {
      ariaLabel,
      children,
      variant = "solid",
      ...linkProps
    } = props
    const className = `cinematic-button cinematic-button--${variant}`

    return (
      <Link
        {...linkProps}
        aria-label={ariaLabel}
        className={className}
      >
        <span>{children}</span>
      </Link>
    )
  }

  const {
    ariaLabel,
    children,
    variant = "solid",
    type = "button",
    ...buttonProps
  } = props
  const className = `cinematic-button cinematic-button--${variant}`

  return (
    <button
      {...buttonProps}
      aria-label={ariaLabel}
      className={className}
      type={type}
    >
      <span>{children}</span>
    </button>
  )
}
