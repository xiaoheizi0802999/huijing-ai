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

type ButtonOnlyProp =
  | "disabled"
  | "form"
  | "formAction"
  | "formEncType"
  | "formMethod"
  | "formNoValidate"
  | "formTarget"
  | "name"
  | "type"
  | "value"

type ButtonOnlyExclusions = {
  [K in ButtonOnlyProp]?: never
}

type ButtonOnlyExclusionsWithoutType = Omit<ButtonOnlyExclusions, "type">

type LinkOnlyProp =
  | "download"
  | "href"
  | "hrefLang"
  | "media"
  | "ping"
  | "referrerPolicy"
  | "rel"
  | "target"
  | "type"
  | "replace"
  | "scroll"
  | "shallow"
  | "prefetch"
  | "locale"
  | "legacyBehavior"
  | "passHref"
  | "onNavigate"
  | "transitionTypes"

type LinkOnlyExclusions = {
  [K in LinkOnlyProp]?: never
}

type TrueLinkOnlyExclusions = Omit<LinkOnlyExclusions, "type">

export type LinkButtonProps = Shared &
  Omit<
    ComponentProps<typeof Link>,
    | "children"
    | "className"
    | "aria-label"
    | "onClick"
    | "legacyBehavior"
    | "passHref"
    | Exclude<ButtonOnlyProp, "type">
  > &
  ButtonOnlyExclusionsWithoutType & {
    href: ComponentProps<typeof Link>["href"]
    legacyBehavior?: never
    onClick?: MouseEventHandler<HTMLAnchorElement>
    passHref?: never
  }

export type NativeButtonProps = Shared &
  Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "children" | "className" | "aria-label"
  > &
  TrueLinkOnlyExclusions

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
