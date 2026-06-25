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

- Fonts and typography: Passed after P1 density iteration. The implementation uses a high-contrast serif display system with condensed letter spacing and strong hierarchy. The hero headline now uses explicit magazine-style title lines (`像导演一样` / `生成你的视觉大片`) so it no longer creates orphan characters or browser-dependent line breaks. The final CTA keeps its controlled two-line statement.
- Spacing and layout rhythm: Passed after P1 density iteration. Section heights, heading margins, card heights, gallery row rhythm, membership cards, and final CTA spacing were tightened to better match the supplied P1 poster reference. The desktop full-page capture moved from 6169px tall to 4661px at 1440px width; the source reference scales to roughly 4303px at the same width, so the implementation now reads much closer to the visual稿 while preserving usable responsive sections.
- Colors and visual tokens: Passed. The black/deep-gray/silver palette, cold blue highlights, restrained borders, and low-glow surfaces match the selected Dark Light direction.
- Image quality and asset fidelity: Passed. All major visible art uses real generated assets under `public/cinematic/`; there are no fake placeholder blocks, emoji, handmade SVG illustrations, or CSS-art replacements. Crops are dark, low-saturation, and cinematic.
- Copy and content: Passed. The six requested chapters, credit mechanism copy, upgrade placeholder, final brand statement, and `/generate` preview route are present and coherent.
- Interactions and accessibility: Passed. Header/mobile menu, CTA links, gallery hover affordance, and upgrade dialog are implemented. The dialog locks scroll, traps focus, supports Escape/backdrop/close-button dismissal, and restores focus to the upgrade trigger.

## Patches made during QA

- Fixed the mobile final CTA heading by splitting `每一次生成，都是一帧电影。` into two explicit display lines: `每一次生成，` and `都是一帧电影。`
- Added a regression expectation in `tests/components/page-sections.test.tsx` so the final CTA keeps this controlled two-line structure.
- Tightened the P1 visual density across desktop and mobile by reducing oversized section padding, headline margins, card heights, process card rhythm, gallery rows, membership card height, and final CTA whitespace.
- Added `tests/visual-density.test.ts` as a compact poster-rhythm contract so the page does not regress to overly large whitespace.
- Fixed the hero title line break by replacing browser-dependent `<br />` wrapping with two explicit `hero-title-line` spans and desktop no-orphan whitespace handling.
- Re-captured desktop full-page, desktop hero, mobile full-page, mobile hero, mobile bottom, and comparison evidence after the P1 density patch.

## Open Questions

- None blocking. The process section is intentionally more spacious and card-led than the reference montage’s tight vertical beam timeline; it still satisfies the requested cinematic storyboard/process direction and reads well in the full-page implementation.

## Implementation Checklist

- [x] Desktop full-page comparison captured and reviewed.
- [x] Hero focused comparison captured and reviewed.
- [x] Final CTA focused comparison captured and reviewed.
- [x] Mobile hero, final CTA, and menu evidence captured and reviewed.
- [x] Upgrade dialog evidence captured and reviewed.
- [x] P2 mobile final CTA wrapping issue fixed and re-verified.
- [x] P1 text/whitespace density feedback addressed and re-verified against the reference comparison.

## Follow-up Polish

- [P3] If you want the process section to hew even closer to the reference board, add a brighter vertical projector-beam timeline spine on desktop and connect the five process cards to it with fine horizontal rules.
- [P3] The hero image could be pushed slightly larger and more “cinema screen” rectangular on ultra-wide desktop, but the current crop already preserves the intended premium film-site tone.

final result: passed
