# Design — GPVCクラブ

Locked design system for the GPVCクラブ parent app. Every page redesign reads
this file before emitting code. Do not regenerate per page — extend or amend
when the system needs to grow.

## Genre
playful

## Audience
Middle school pole vault club parents. Low-mid IT literacy, smartphone-first.
PERSONAS.md is authoritative. See also: app goal = reach calendar/payment info
within 2 taps.

## Macrostructure family

- **App-home (ホーム):** hero photo (full-bleed, aspect-ratio token) + tiered
  menu grid. Primary tier (calendar + members) carries `bg-muted/25` tint and
  `h-8 w-8` icons. Admin tier recedes: dashed border, muted text, no icon color.
- **Tool pages** (カレンダー, クラブ生成長記録, ポール, 管理): function-first,
  no enrichment. shadcn/ui components carry the page. Icon + `text-foreground`
  heading + `text-muted-foreground` subtitle pattern.
- **Content pages** (マインドセット, アップデート, よく使うリンク): card-per-item
  list with `text-foreground` headings. No enrichment.

## Theme

Preserve shadcn/ui near-achromatic OKLCH base. Feature-color layer added on top.
See `tokens.css` for all values.

### Feature color tokens
```
--color-feature-calendar: oklch(0.72 0.11 192)   /* 練習日/大会カレンダー — teal   */
--color-feature-members:  oklch(0.49 0.15 283)   /* クラブ生成長記録 — purple       */
--color-feature-poles:    oklch(0.58 0.19 27)    /* ポール一覧 — red-orange         */
--color-feature-mindset:  oklch(0.62 0.20 349)   /* マインドセット — pink            */
--color-feature-links:    oklch(0.77 0.16 79)    /* よく使うリンク — amber          */
--color-feature-admin:    oklch(0.87 0.17 96)    /* 管理者メニュー — yellow          */
```

### Hero animation tokens
```
--color-hero-sky:   oklch(0.74 0.13 239)   /* 'o' in "Pole"  */
--color-hero-green: oklch(0.66 0.12 155)   /* 'e' in "Pole"  */
--color-hero-amber: oklch(0.77 0.16 72)    /* 't' in "Vault" */
```

## Typography
- **Display:** Nunito 700 — hero animation only. Loaded in `app/layout.tsx`
  via `next/font`, exposed as `--font-nunito`. Referenced via inline
  `style={{ fontFamily: 'var(--font-nunito)' }}` in `HeroAnimatedText.tsx`.
- **Body:** Noto Sans JP 400/500/700. Mapped to `--font-sans` in Tailwind
  `@theme`. Applied globally via `html { @apply font-sans }`.
- **Mono:** Geist Mono (`--font-geist-mono`).
- Heading text color: always `text-foreground`. Never `text-gray-*` utilities.
- Subtitle/meta text: always `text-muted-foreground`. Never `text-gray-*`.

## Motion
- **Stance:** motion-cut (no framer-motion/gsap in deps).
- **Hero slide-in:** `transform var(--dur-long) var(--ease-out)` on mount.
- **Character fly-out:** `transform var(--dur-medium) var(--ease-standard)` on scroll.
- **Reduced-motion fallback:** `window.matchMedia('(prefers-reduced-motion: reduce)')`
  checked in `useEffect`. If true: set `arrived = true` immediately, skip scroll
  listener. Characters appear at rest position instantly.
- No new animations to be added to any page unless explicitly approved.

### Easing tokens
```
--ease-out:      cubic-bezier(0.22, 1, 0.36, 1)   /* hero slide */
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1)     /* character state */
--dur-short:     220ms
--dur-medium:    400ms
--dur-long:      900ms
```

## Mobile rules (non-negotiable)
- `html, body { overflow-x: clip; }` — set in `@layer base` in `globals.css`.
- Max content width: `max-w-2xl mx-auto` on `<main>` in `layout.tsx`.
- Minimum input font-size: `text-base` (16px) to prevent iOS auto-zoom.

## What every page MUST do
- Use `var(--color-feature-*)` tokens — no inline hex values in source.
- Use `var(--ease-*)` / `var(--dur-*)` tokens — no inline `cubic-bezier()` strings.
- Use `text-foreground` and `text-muted-foreground` — no `text-gray-*` utilities.
- Keep all UI copy in Japanese — no English labels in user-facing UI.

## What pages MAY differ on
- Component archetype (calendar uses UnifiedCalendar, members uses MemberList, etc.).
- List structure within the content-page family.

## Exports
See `tokens.css` at the project root for the portable token file.
