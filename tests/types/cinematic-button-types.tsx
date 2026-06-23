import { CinematicButton } from "@/components/cinematic/cinematic-button"

const nativeButton = (
  <CinematicButton
    ariaLabel="Submit"
    className="submit-button"
    disabled
    type="submit"
  >
    Submit
  </CinematicButton>
)

const linkButton = (
  <CinematicButton
    ariaLabel="Open gallery"
    className="gallery-link"
    href="/gallery"
    onClick={(event) => event.currentTarget.focus()}
    rel="noreferrer"
    target="_blank"
  >
    Gallery
  </CinematicButton>
)

const validSpreadLinkProps = {
  href: "/gallery",
  prefetch: true,
  rel: "noreferrer",
  target: "_blank",
} as const
const validSpreadLink = (
  <CinematicButton {...validSpreadLinkProps}>Gallery</CinematicButton>
)

const validSpreadButtonProps = {
  disabled: true,
  form: "create-form",
  type: "submit",
} as const
const validSpreadButton = (
  <CinematicButton {...validSpreadButtonProps}>Create</CinematicButton>
)

const legacyLinkProps = { href: "/legacy", legacyBehavior: true } as const
// @ts-expect-error legacyBehavior is forbidden
const legacyLink = <CinematicButton {...legacyLinkProps}>Legacy</CinematicButton>

const passHrefLinkProps = { href: "/legacy", passHref: true } as const
const passHrefLink = (
  // @ts-expect-error passHref is forbidden
  <CinematicButton {...passHrefLinkProps}>Pass href</CinematicButton>
)

const spreadDisabledLink = { href: "/gallery", disabled: true } as const
const disabledSpreadLink = (
  // @ts-expect-error Native button props are forbidden when href is present.
  <CinematicButton {...spreadDisabledLink}>Invalid</CinematicButton>
)

const spreadTargetButton = { target: "_blank" } as const
const targetSpreadButton = (
  // @ts-expect-error Link-only props require href.
  <CinematicButton {...spreadTargetButton}>Invalid</CinematicButton>
)

const spreadAsButton = { as: "/masked" } as const
// @ts-expect-error Next Link as prop requires href
;<CinematicButton {...spreadAsButton}>Bad</CinematicButton>

const spreadFormLink = { href: "/gallery", form: "create-form" } as const
const formSpreadLink = (
  // @ts-expect-error Native button props are forbidden when href is present.
  <CinematicButton {...spreadFormLink}>Invalid</CinematicButton>
)

// @ts-expect-error Link-only props require href.
const targetWithoutHref = <CinematicButton target="_blank">Invalid</CinematicButton>

const disabledLink = (
  // @ts-expect-error Native button props are forbidden when href is present.
  <CinematicButton disabled href="/gallery">
    Invalid
  </CinematicButton>
)

void [
  nativeButton,
  linkButton,
  validSpreadLink,
  validSpreadButton,
  legacyLink,
  passHrefLink,
  disabledSpreadLink,
  targetSpreadButton,
  formSpreadLink,
  targetWithoutHref,
  disabledLink,
]
