---
name: frontend-design
description: Guidance for distinctive, intentional visual design when building UI. Covers typography, layout, color, and design principles for web interfaces.
---

# Frontend Design

Build interfaces that are intentional, distinctive, and user-centered.

## Design Principles

- **Ground it in the subject** — Let the content and purpose drive the design. The subject's own world (materials, instruments, artifacts) is where distinctive choices come from.
- **Typography carries personality** — Pair display and body faces deliberately. Set a clear type scale with intentional weights and spacing.
- **Structure is information** — Layout decisions should encode something true about the content, not decorate it.
- **Leverage motion deliberately** — Choose animation that serves the subject. An orchestrated moment lands harder than scattered effects.
- **Match complexity to vision** — Maximalist needs elaborate execution; minimal needs precision in spacing, type, and detail.

## Web Design Process

1. **Explore** — Understand the brand, audience, and content
2. **Plan** — Layout structure, component tree, data flow
3. **Design** — Build with HTML/CSS, iterate on visual detail
4. **Critique** — Review against principles, refine
5. **Ship** — Clean up, test, deploy

## Color

- Start with 1-2 brand colors + neutral palette
- Ensure WCAG AA contrast (4.5:1 for text, 3:1 for large text)
- Test in both light and dark mode
- Use color meaningfully, not decoratively

## Layout

- Establish a consistent spacing scale (4px or 8px base)
- Use grid systems for alignment (CSS Grid, flexbox)
- Design for the content width, not the screen width
- Breakpoints: mobile, tablet, desktop

## Accessibility

- Semantic HTML (nav, main, section, article, button, a)
- Keyboard navigation (focusable, tab order, skip links)
- Screen reader support (aria-labels, roles, live regions)
- Reduced motion support (prefers-reduced-motion)
