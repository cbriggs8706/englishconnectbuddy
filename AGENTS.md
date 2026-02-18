# AGENTS

## UI Direction (Project Default)
- Prioritize accessibility-first visuals for learners with lower vision.
- Use large typography by default; avoid tiny helper text unless absolutely necessary.
- Keep backgrounds mostly white or very light neutrals for readability.
- Use bold, saturated color blocks and gradients for primary cards and actions.
- Prefer filled buttons over outline buttons.
- Keep contrast strong: dark text on light surfaces, white text on saturated surfaces.
- Favor rounded, high-visibility components with clear spacing and hierarchy.
- When adding new pages/components, match the homepage pattern:
  - One prominent hero/progress card.
  - Supporting cards in colorful filled styles.
  - Clear, large call-to-action buttons.

## Consistency Rules
- Reuse shared UI primitives in `components/ui/*` and app shell components.
- If a new visual pattern is needed, add it to shared primitives first, then consume it in pages.
- Avoid introducing muted gray-outline-only cards unless there is a specific UX reason.

## Celebration Pattern
- For successful completion states, reuse the Matching game celebration behavior:
  - Full-screen randomized falling confetti (not arranged in a fixed pattern).
  - The same synthesized trumpet success sound used in `app/match/page.tsx` (`playSuccessTrumpet`).
- When adding new celebration flows, copy the Matching implementation rather than inventing a new confetti/sound style.
