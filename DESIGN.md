# WealthModel — Design System

Register: **product** (a tool; design serves the task). Platform: web.
Audience: Australians planning early retirement — numerate, want to trust the maths.
Principle: earned familiarity. The tool disappears into the task; delight is saved for moments (the FIRE-age reveal), not sprayed across pages.

## Color

Strategy: **Restrained** — tinted neutrals + one brand accent used only for primary actions, current selection, and state. Green is the brand; it never becomes decoration.

### Neutrals
| Role | Hex | Notes |
|---|---|---|
| Page background | `#F7F7F5` | cool off-white |
| Surface (cards) | `#FFFFFF` | |
| Surface tint | `#F3F4F2` | ghost-button hover, secondary panels |
| Stroke | `#E5E7EB` | card/input borders |
| Stroke strong | `#D6D9DD` | dividers, selected borders |

### Ink & text (all ≥4.5:1 on white — WCAG AA)
| Role | Hex | Contrast |
|---|---|---|
| Ink (primary) | `#151816` | 16:1 |
| Body / label | `#3E4A3F` | 8:1 |
| Muted (strong) | `#5A625D` | 6.3:1 |
| Muted (secondary) | `#6A716B` | 5.0:1 |
| Muted (faint) | `#70736E` | 4.8:1 — the floor; never lighter for text |

### Brand & semantic
| Role | Hex |
|---|---|
| Brand green (accent / primary action) | `#059669` |
| Brand deep green (logo, drenched moments) | `#0F3D2E` |
| Brand mint (logo mark, positive highlight) | `#3FE0A5` |
| Button (primary, dark) | `#151816` |
| Success | `#059669` |
| Warning | `#F59E0B` |
| Danger | `#DC2626` (text `#B42318`) |
| Info / target line | `#3B82F6` |

### Budget category hues (data encoding only)
Housing `#0EA5E9` · Transport `#F59E0B` · Food & Drink `#10B981` · Health `#EF4444` · Insurance `#8B5CF6` · Entertainment `#EC4899` · Personal `#14B8A6` · Education `#6366F1` · Financial `#0891B2` · Other `#9CA3AF`. Carried as a whole-row background tint (~8%), never a side-stripe.

## Typography

One family (system sans stack). Product UI needs no display/body pairing; a well-tuned sans carries headings, labels, controls, and data.

| Step | Size | Use |
|---|---|---|
| caption | 11px | axis labels, meta |
| small | 12px | field labels, chips, sub-text |
| control | 13px | buttons, inputs, body |
| body-lg | 14px | primary body |
| section | 15.5px | panel titles, section headers |
| card | 17px | card `<h2>` |
| stat | 20–26px | KPI values |
| display | 30–42px | FIRE-age hero (the one loud moment) |

Ratio ~1.15–1.2 between UI steps. Display letter-spacing ≥ -0.04em.

## Radius
| Token | Value | Use |
|---|---|---|
| sm | 8px | inputs, small buttons |
| md | 12px | cards, panels, modals |
| lg | 16px | overlays, sheets |
| pill | 999px | tags, toggle tracks, chips |

Cards top out at 16px — never 24px+.

## Z-index (semantic scale — no arbitrary 999s)
dropdown 150 · sticky-bar 90 · drawer-backdrop 95 · drawer 96 · fullscreen-overlay 3000 · import-modal 3400 · new-category-popup 3500 · info-tooltip 4000.

## Motion
150–250ms on state transitions, ease-out. Motion conveys state (feedback, loading, reveal), never decoration. No orchestrated page-load sequences. Every animation respects `prefers-reduced-motion`.

## Components
Every interactive element ships default / hover / focus-visible / active / disabled. Buttons: one system, three tiers — `primary` (dark), `ghost` (outline), `danger`. Consistent affordance across every screen; the Save button looks the same everywhere.

## Anti-patterns banned here
Side-stripe accent borders · gradient text · glassmorphism-by-default · light-gray text below 4.5:1 · reinvented form controls · modal-as-first-thought.
