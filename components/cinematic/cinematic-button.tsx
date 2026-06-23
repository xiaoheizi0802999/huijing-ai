import Link from "next/link"
import type {
  ButtonHTMLAttributes,
  ComponentProps,
  MouseEventHandler,
  ReactElement,
  ReactNode,
} from "react"

type Shared = {
  ariaLabel?: string
  children: ReactNode
  className?: string
  variant?: "solid" | "outline"
}

export type LinkButtonProps = Shared &
  Omit<
    ComponentProps<typeof Link>,
    "children" | "className" | "aria-label" | "onClick"
  > & {
    href: ComponentProps<typeof Link>["href"]
    onClick?: MouseEventHandler<HTMLAnchorElement>
  }

export type NativeButtonProps = Shared &
  Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "children" | "className" | "aria-label"
  > & {
    download?: never
    href?: never
    locale?: never
    prefetch?: never
    rel?: never
    replace?: never
    scroll?: never
    shallow?: never
    target?: never
  }

export function CinematicButton(props: LinkButtonProps): ReactElement
export function CinematicButton(props: NativeButtonProps): ReactElement
export function CinematicButton(
  props: LinkButtonProps | NativeButtonProps,
) {
  if (props.href !== undefined) {
    const {
      ariaLabel,
      children,
      className: customClassName,
      variant = "solid",
      ...linkProps
    } = props
    const className = [
      "cinematic-button",
      `cinematic-button--${variant}`,
      customClassName,
    ]
      .filter(Boolean)
      .join(" ")

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
    className: customClassName,
    variant = "solid",
    type = "button",
    ...buttonProps
  } = props
  const className = [
    "cinematic-button",
    `cinematic-button--${variant}`,
    customClassName,
  ]
    .filter(Boolean)
    .join(" ")

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
