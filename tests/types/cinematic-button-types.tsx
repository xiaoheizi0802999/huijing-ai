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

// @ts-expect-error Link-only props require href.
const targetWithoutHref = <CinematicButton target="_blank">Invalid</CinematicButton>

const disabledLink = (
  // @ts-expect-error Native button props are forbidden when href is present.
  <CinematicButton disabled href="/gallery">
    Invalid
  </CinematicButton>
)

void [nativeButton, linkButton, targetWithoutHref, disabledLink]
