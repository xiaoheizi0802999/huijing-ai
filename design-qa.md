# Design QA — Huijing AI Dark Light Landing

source visual truth path: `docs/superpowers/specs/assets/huijing-ai-dark-light-reference.png`

implementation screenshot paths:

- `.design-qa/implementation-desktop-full.png`
- `.design-qa/implementation-desktop-hero.png`
- `.design-qa/implementation-upgrade-dialog.png`
- `.design-qa/implementation-mobile-hero.png`
- `.design-qa/implementation-mobile-bottom.png`
- `.design-qa/implementation-mobile-menu.png`

viewport:

- desktop: 1440 × 900, dark color scheme, reduced motion for deterministic capture
- mobile: 390 × 844 CSS pixels at deviceScaleFactor 2, dark color scheme, reduced motion for deterministic capture

state:

- desktop full page after scrolling through all sections to trigger lazy assets and reveals
- desktop membership upgrade dialog open
- mobile hero, mobile final CTA bottom viewport, and mobile navigation menu open

full-view comparison evidence:

- `.design-qa/reference-and-desktop-full.png`

focused region comparison evidence:

- `.design-qa/reference-and-desktop-hero.png`
- `.design-qa/reference-and-desktop-final.png`
- `.design-qa/mobile-evidence.png`

## Findings

No P0/P1/P2 issues remain.

- Fonts and typography: Passed. The implementation uses a high-contrast serif display system with condensed letter spacing and strong hierarchy. The final CTA was patched during QA so the mobile brand statement breaks into two intentional lines instead of leaving an orphaned character at the end of the first line.
- Spacing and layout rhythm: Passed. The implementation is taller than the source montage because it is a real high-scroll landing page rather than a compressed reference board. Each chapter keeps poster-like breathing room, thin separators, and stable desktop/mobile alignment.
- Colors and visual tokens: Passed. The black/deep-gray/silver palette, cold blue highlights, restrained borders, and low-glow surfaces match the selected Dark Light direction.
- Image quality and asset fidelity: Passed. All major visible art uses real generated assets under `public/cinematic/`; there are no fake placeholder blocks, emoji, handmade SVG illustrations, or CSS-art replacements. Crops are dark, low-saturation, and cinematic.
- Copy and content: Passed. The six requested chapters, credit mechanism copy, upgrade placeholder, final brand statement, and `/generate` preview route are present and coherent.
- Interactions and accessibility: Passed. Header/mobile menu, CTA links, gallery hover affordance, and upgrade dialog are implemented. The dialog locks scroll, traps focus, supports Escape/backdrop/close-button dismissal, and restores focus to the upgrade trigger.

## Patches made during QA

- Fixed the mobile final CTA heading by splitting `每一次生成，都是一帧电影。` into two explicit display lines: `每一次生成，` and `都是一帧电影。`
- Added a regression expectation in `tests/components/page-sections.test.tsx` so the final CTA keeps this controlled two-line structure.
- Re-captured desktop, mobile, dialog, and mobile menu evidence after the patch.

## Open Questions

- None blocking. The process section is intentionally more spacious and card-led than the reference montage’s tight vertical beam timeline; it still satisfies the requested cinematic storyboard/process direction and reads well in the full-page implementation.

## Implementation Checklist

- [x] Desktop full-page comparison captured and reviewed.
- [x] Hero focused comparison captured and reviewed.
- [x] Final CTA focused comparison captured and reviewed.
- [x] Mobile hero, final CTA, and menu evidence captured and reviewed.
- [x] Upgrade dialog evidence captured and reviewed.
- [x] P2 mobile title wrapping issue fixed and re-verified.

## Follow-up Polish

- [P3] If you want the process section to hew even closer to the reference board, add a brighter vertical projector-beam timeline spine on desktop and connect the five process cards to it with fine horizontal rules.
- [P3] The hero image could be pushed slightly larger and more “cinema screen” rectangular on ultra-wide desktop, but the current crop already preserves the intended premium film-site tone.

final result: passed
