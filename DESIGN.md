---
name: Padaraksha Factory Management
description: Production lifecycle tool for contract sandal manufacturing — material, precise, grounded.
colors:
  deep-slate-navy: "#1E2A3A"
  warm-white: "#F8F7F4"
  muted-amber: "#C9973A"
  soft-ash: "#6B7685"
  surface-raised: "#FFFFFF"
  surface-dark-base: "#111820"
  surface-dark-card: "#1A2535"
  surface-dark-raised: "#243044"
  border-light: "#DDD9D2"
  border-dark: "#2C3D52"
  amber-muted: "#A37828"
  amber-light: "#F0C878"
  destructive: "#C0392B"
typography:
  display:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.005em"
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.01em"
rounded:
  none: "0px"
  sm: "4px"
  md: "6px"
  lg: "10px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  "2xl": "32px"
  "3xl": "48px"
components:
  button-primary:
    backgroundColor: "{colors.muted-amber}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.amber-muted}"
    textColor: "#FFFFFF"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.soft-ash}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-ghost-hover:
    backgroundColor: "{colors.border-light}"
    textColor: "{colors.deep-slate-navy}"
  sidebar-item:
    backgroundColor: "transparent"
    textColor: "{colors.soft-ash}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  sidebar-item-active:
    backgroundColor: "{colors.muted-amber}"
    textColor: "#FFFFFF"
  input:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.deep-slate-navy}"
    rounded: "{rounded.md}"
    padding: "9px 12px"
  card:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.deep-slate-navy}"
    rounded: "{rounded.lg}"
    padding: "20px 24px"
---

# Design System: Padaraksha Factory Management

## 1. Overview

**Creative North Star: "The Workshop Ledger"**

A worn-leather notebook on a factory supervisor's desk. Columns ruled in pencil, numbers entered with care, nothing superfluous on the page. This is the design spirit of Padaraksha: dense, purposeful, grounded in physical work. The tool belongs in the same world as the sandals being made — slate, amber, hide, thread.

The palette is drawn from the materials of the trade: deep slate navy for primary surfaces and structure, warm white for the workspace where data is entered, muted amber as the single voice for action and status. The typography is compact and confident. Data tables are the hero element, not metric cards. The supervisor is entering and reading numbers all shift long; every pixel serves that task.

This system explicitly rejects the visual language of "startup productivity software": no purple gradients, no rounded metric panels with trend arrows, no illustration-heavy empty states, no glassmorphism, no card grids with icons and descriptive text. If it could be a template on a SaaS landing page builder, it's wrong for Padaraksha.

**Key Characteristics:**
- Warm neutrals over cold grays — every surface is slightly amber-tinted
- Amber accent used sparingly: active states, primary actions, status alerts
- Data density over generous whitespace — rows sit closer together than typical dashboards
- Tonal layering for depth, never shadows
- Type hierarchy through weight and scale contrast, not decoration
- Both light and dark themes are first-class; system default is respected

## 2. Colors: The Slate and Amber Palette

Two anchors and one accent. Everything else is tonal variation of the same two hues.

### Primary
- **Deep Slate Navy** (#1E2A3A): The structural color. Used as the sidebar background in light mode, the primary surface in dark mode, and the primary text color. Never used as a decorative element; it is the foundation.
- **Muted Amber** (#C9973A): The single action voice. Used on primary buttons, active sidebar items, focus rings, deadline alerts, and status highlights. Its rarity makes it meaningful. On any given screen it should cover no more than 10-15% of the surface area.

### Neutral
- **Warm White** (#F8F7F4): Default page background in light mode. Slightly amber-tinted — never pure white. The warmth is subtle but prevents the sterility of a pure-white data app.
- **Raised Surface Light** (#FFFFFF): Cards, inputs, dropdowns. One step above Warm White to create tonal separation.
- **Soft Ash** (#6B7685): Secondary text, inactive icons, placeholder text, column headers. The muted voice.
- **Border Light** (#DDD9D2): Dividers, input strokes, table lines. Warm-tinted, not cold gray.
- **Dark Base** (#111820): Page background in dark mode. Darker than Slate Navy; the foundation layer.
- **Dark Card** (#1A2535): Card and panel surfaces in dark mode. Equivalent of Raised Surface Light.
- **Dark Raised** (#243044): Popovers, dropdowns, tooltip surfaces in dark mode.
- **Dark Border** (#2C3D52): Dividers and borders in dark mode.

### Named Rules
**The One Voice Rule.** Muted Amber is the only saturated color in the system. It is never used for decoration, branding, or background fills on large surfaces. It speaks once per screen and means it.

**The No Pure Neutrals Rule.** Neither #000000 nor #FFFFFF appears in this system. All backgrounds carry a trace of warmth (amber/slate tint). Cold grays are prohibited; every neutral leans toward the material palette.

## 3. Typography

**Primary Font:** Inter (system-ui, sans-serif fallback)

No display font, no serif. Inter at varied weights carries the full hierarchy. Its geometric structure fits the precision of the domain; its humanist proportions prevent the coldness of purely technical fonts like Geist Mono or Roboto.

**Character:** Compact and confident. Hierarchy comes from weight contrast (400 vs 600 vs 700), not size drama. Body text is smaller than most consumer apps (14px) because the users are experienced readers of dense operational data, not first-time visitors who need visual hand-holding.

### Hierarchy
- **Display** (700, 1.5rem/24px, −0.01em tracking): Page titles and dashboard section headers. One per view.
- **Headline** (600, 1.125rem/18px, −0.005em tracking): Module card titles, dialog titles, section group headers.
- **Title** (500, 0.9375rem/15px): Table section labels, card sub-headers, form group names.
- **Body** (400, 0.875rem/14px, 1.55 line-height): All data, descriptions, table cell content. Max line length 70ch.
- **Label** (500, 0.75rem/12px, +0.01em tracking): Column headers, input labels, badges, metadata. Never all-caps.

### Named Rules
**The Weight Rule.** Use 400 and 600 for the primary contrast pair. 500 for tertiary information. 700 only at Display level. Never use 300 or 800; the scale is intentionally compressed to avoid typographic drama in a data-dense UI.

**The Size Floor Rule.** 12px (0.75rem) is the minimum text size in any context, including table metadata. Below 12px is inaccessible and unreadable for supervisors who may be working long shifts in imperfect conditions.

## 4. Elevation

This system is flat by design. No shadows on cards, panels, or lists. Depth is created through tonal separation: each surface layer is a slightly lighter or darker variant of the base palette, creating a clear foreground/background reading without floating elements.

In dark mode: Dark Base (#111820) → Dark Card (#1A2535) → Dark Raised (#243044), each step readable at a glance.
In light mode: Warm White (#F8F7F4) → Raised Surface (#FFFFFF), with Border Light (#DDD9D2) as the edge definition.

Shadows appear in exactly two contexts: dropdown menus and dialog modals, where a soft ambient shadow provides spatial context for the overlapping layer. Everywhere else, flat.

### Shadow Vocabulary
- **Overlay shadow** (`0 4px 16px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)`): Dropdowns, select menus, popovers, command palettes. Grounds the floating layer without drama.
- **Dialog shadow** (`0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1)`): Modal dialogs. Stronger separation to signal blocking interaction.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Shadow is a state, not a style — it appears only when a layer genuinely floats above the document (dropdown, dialog). No hover shadows, no card lift effects, no decorative depth.

## 5. Components

### Buttons
Tactile and grounded. Slightly more visual weight than typical SaaS buttons — the supervisor needs clear targets for frequent interaction.

- **Shape:** Gently squared (6px radius). Not pill, not sharp — sits between them.
- **Primary:** Muted Amber (#C9973A) background, white text (14px, weight 500). Padding 10px 20px. Used for the one key action per context (Save, Log Entry, Confirm).
- **Primary Hover:** Darker amber (#A37828). No scale transform. Transition 150ms ease-out.
- **Primary Focus:** 2px offset outline in Muted Amber at 50% opacity. WCAG AA compliant.
- **Ghost:** Transparent background, Soft Ash text. Thin border (1px Border Light). Hover: Border Light background, Slate Navy text. Used for secondary actions (Cancel, Edit, View Details).
- **Destructive:** #C0392B background, white text. Same shape as Primary. Used only for irreversible actions.
- **Disabled:** 40% opacity on the button, no interaction cue.

### Navigation (Sidebar)
- **Container:** Deep Slate Navy (#1E2A3A) background in both light and dark mode. The sidebar is always dark.
- **Item shape:** 6px radius, full-width, padding 8px 12px. Icon (20px) + label at Body weight 500.
- **Default state:** Soft Ash text and icon.
- **Hover:** Slightly lighter navy tint (#243044 equivalent). Text shifts toward white.
- **Active:** Muted Amber background, white text and icon. This is the only place Amber appears at full saturation on a large element.
- **Collapsed state:** Icon only, 64px wide sidebar. Tooltip on hover.

### Cards / Surfaces
- **No card grids.** Cards are used for individual content containers, not to repeat the same layout in a grid. If you need a grid of identical items, use a table or list instead.
- **Corner style:** 10px radius. Slightly rounder than buttons to signal "container" vs "action."
- **Background:** Raised Surface (#FFFFFF in light, Dark Card #1A2535 in dark).
- **Border:** 1px Border Light / Dark Border. Always present — tonal layering alone is insufficient for card definition.
- **Shadow strategy:** None (see Elevation).
- **Internal padding:** 20px 24px for content cards. 16px for compact data panels.

### Inputs / Fields
- **Style:** 1px border (Border Light / Dark Border), Raised Surface background, 6px radius. Padding 9px 12px.
- **Label:** Body Label (12px, weight 500) above the field, 6px gap.
- **Focus:** Border shifts to Muted Amber (1.5px). No glow, no shadow.
- **Error:** Border shifts to Destructive Red (#C0392B). Error message in 12px Destructive Red below field, 4px gap.
- **Disabled:** 50% opacity, `not-allowed` cursor.
- **Select / Dropdown:** Same shape as input. Dropdown opens below, Raised Dark (#243044) background, Overlay Shadow.

### Tables
The signature component. More than any other element, tables define this tool.
- **Header row:** Warm White / Dark Base background, Label typography (12px, 500), Soft Ash text. 1px bottom border. Sticky on scroll.
- **Body rows:** Alternating tint — every other row shifts background by 2% lightness. Not stripes, a whisper.
- **Row height:** 44px compact, 52px for rows with secondary text. Never more.
- **Cell padding:** 12px horizontal, 0 vertical (height provides the space).
- **Hover state:** 4% lightness shift on the row background. No color change.
- **Selected row:** Left 3px border in Muted Amber. The only border-left in the system, used specifically for selection state (not decoration).
- **Action column:** Always rightmost, ghost icon buttons (Edit, Delete) that appear on row hover.

### Status Badges
- **Shape:** 9999px (pill). Padding 3px 8px. Label typography.
- **Roles:** `on-track` (green tint), `at-risk` (amber tint), `overdue` (red tint), `completed` (slate tint), `pending` (neutral). Each uses a 15% opacity background and 100% saturation text of the same hue.
- **Never use solid fills.** Tinted backgrounds only. Solid badge fills compete with the Amber action voice.

### Data Entry Forms
For multi-step flows (Inward Entry, Work Assignment), use a wizard with a horizontal step indicator at the top — not a modal stack. Steps are numbered (1, 2, 3), with the current step in Muted Amber and completed steps in Slate Navy. Incomplete steps in Soft Ash.

## 6. Do's and Don'ts

### Do:
- **Do** use Muted Amber (#C9973A) only for active states, primary buttons, deadline alerts, and the selected table row indicator. One voice, used deliberately.
- **Do** build density into tables and forms. 14px body text with 44px row heights. Factory supervisors are data-entry professionals, not casual users.
- **Do** use tonal layering (Warm White → Raised Surface → card → popover) to create depth. The layers are the depth system.
- **Do** keep the sidebar always Dark Slate Navy (#1E2A3A), even in light mode. It grounds the navigation as permanent structure separate from the content workspace.
- **Do** put the label above the field, never inside it as placeholder text. Supervisors scan back up to confirm what they just entered.
- **Do** meet WCAG AA on both light and dark themes independently. Test amber on white (it passes at 3.2:1 for large text, use dark amber for small text labels).
- **Do** use Inter weight 600 for column headers, section titles, and card headings. Weight contrast is the primary hierarchy signal.

### Don't:
- **Don't** use generic SaaS visual patterns: rounded metric cards with big numbers and trend arrows, icon + heading + description grid layouts, purple or blue gradient backgrounds. These are what Padaraksha explicitly is not.
- **Don't** use an ERP aesthetic: gray background (#F5F5F5), blue primary (#2196F3), cramped form grids, modal-per-action UX. The tool should feel considered and crafted, not like enterprise software from 2015.
- **Don't** apply `border-left` or `border-right` as a colored accent stripe for decoration, callouts, or list items. The only `border-left` in the system is the 3px Amber stripe on a selected table row — a state indicator, not decor.
- **Don't** use gradient text or `background-clip: text`. All text is solid. Emphasis comes from weight and scale.
- **Don't** default to modals for every action. Prefer inline editing, expandable rows, and drawer panels for common tasks. Modals block the context the supervisor needs.
- **Don't** use glassmorphism, backdrop-filter blurs, or translucent overlays for decorative effect.
- **Don't** animate layout properties (height, padding, grid columns). Animate opacity and transform only.
- **Don't** use colors outside the defined palette for status or emphasis. Invent no new accent colors. The amber monopoly on action and status is the whole point.
