# Match App — Style Guide

> ## Conflict Resolutions (QA Review 2026-03-14)
> The following sections in this style guide conflicted with the app spec. Resolutions are documented here and supersede the original text.
>
> | # | Section | Original | **Resolution** |
> |---|---|---|---|
> | 1 | §9 Skill / Match Rules | Social=±2, Casual=Open | **Competitive=±1, Casual=±2, Social=no restriction** |
> | 2 | §5 Header / Home sort | "Sorted by host distance" | **Recommendations-first (past co-players → skill proximity)** |
> | 3 | §7 Sheet CTA | "Request to Join" (approval flow) | **Direct join — no host approval, no request state** |
> | 4 | §7 Terminology | "Room" / "Create Room" | **"Lobby" / "Create Lobby"** throughout |
> | 5 | §10 Room Title System | System-generated titles only, no free text | **`lobby_desc` is free text shown as host's note. Card identity uses colour-coded tags (Competitive/Social/Casual + Singles/Doubles), not a generated title string** |
> | 6 | §3/§6 Suburb display | Player suburb on cards (requires reverse geocoding) | **Venue suburb only, sourced from `Location.location_address`. No player suburb. No reverse geocoding.** |

---

# Match App — Style Guide

A badminton matchmaking app that helps players find and join games near them. This guide defines all visual, interaction, and component standards so every screen is consistent.

---

## 1. Brand & Purpose

**App name:** Huzz
**Tagline:** Find your game, find your people
**Platform:** Web (Next.js) — mobile-first responsive layout
**Theme:** Badminton matchmaking — users create or join "lobbies" to organise games. Lobbies are sorted by recommendations (past co-players first, then skill proximity). Once a lobby is full, the group finds a court together.

---

## 2. Colour Palette

### Primary
| Token | Hex | Usage |
|---|---|---|
| `primary` | `#30d5c8` | Brand colour. Headers, active states, CTAs, accent borders, icons |
| `primary-dark` | `#1ab5aa` | Pressed states, gradients, hover |
| `primary-deep` | `#0d3d3a` | Dark text on light surfaces, host avatar bg, level dot (host) |
| `primary-light` | `#e6faf8` | Active nav bg, level bar bg, tinted card backgrounds |
| `primary-faint` | `#f0fafa` | Page background, card inner rows |

### Semantic
| Token | Hex | Usage |
|---|---|---|
| `danger` | `#bf1a00` | Competition badge, full lobby, error states |
| `danger-light` | `#ffeaea` | Competition badge bg, full lobby bg |
| `success` | `#0a8a80` | Open slots text |
| `success-light` | `#e6faf8` | Open slots bg |
| `warning` | `#9a6000` | Casual badge, almost-full slots text |
| `warning-light` | `#fff4dc` | Casual badge bg, almost-full slots bg |

### Mode colours (Singles vs Doubles — must always be visually distinct)
| Token | Hex | Usage |
|---|---|---|
| `singles-text` | `#2d4db8` | Singles badge text |
| `singles-bg` | `#e8eeff` | Singles badge background |
| `doubles-text` | `#7b2fb8` | Doubles badge text |
| `doubles-bg` | `#f5e6ff` | Doubles badge background |

### Neutrals
| Token | Hex | Usage |
|---|---|---|
| `text-primary` | `#0d3d3a` | Headings, bold labels |
| `text-secondary` | `#444444` | Body text, names |
| `text-muted` | `#888888` | Supporting info, host label |
| `text-hint` | `#aaaaaa` | Inactive level dots text |
| `border-light` | `rgba(48,213,200,0.20)` | Card borders |
| `border-default` | `#eeeeee` | Dividers, nav bar border |
| `surface` | `#ffffff` | Cards, sheets, nav bar |
| `page-bg` | `#f0fafa` | Screen background |

---

## 3. Typography

**Font family:** `-apple-system, BlinkMacSystemFont, sans-serif` (system font stack)
**Logo font:** `Georgia, serif` — only for the "Huzz." wordmark

### Scale
| Role | Size | Weight | Colour |
|---|---|---|---|
| Logo | 28px | 900 | `#ffffff` (on header) |
| Screen title | 16px | 800 | `text-primary` |
| Card badge | 11px | 800 | badge-specific |
| Card body | 13–14px | 700 | `text-secondary` |
| Supporting label | 11px | 400–700 | `text-muted` |
| Micro label (uppercase) | 10px | 700 | `#999`, letter-spacing 0.3–0.5px, text-transform uppercase |
| Sheet heading | 11px | 800 | `#999`, uppercase |
| Sheet body | 13px | 400 | `#444`, line-height 1.6 |
| Player name | 14px | 800 | `text-primary` |
| Player sub | 11px | 400 | `text-muted` |
| Bio text | 12px | 400 | `#666`, line-height 1.55 |

**Rules:**
- Never use weights below 400 or above 900
- Badge text is always uppercase with letter-spacing 0.3–0.6px
- Micro labels (section headers inside cards/sheets) are always uppercase

---

## 4. Spacing & Layout

**Screen padding (horizontal):** 16px
**Card internal padding:** 13–14px all sides
**Gap between cards in a list:** 10px
**Gap between badges:** 6px
**Gap between inline elements:** 4–8px

### Border radius
| Element | Radius |
|---|---|
| Lobby cards | 18px |
| Bottom sheet / modal | 24px top corners, 0 bottom |
| Badges / pills | 20px (fully rounded) |
| Level bar | 10px |
| Level dots | 50% (circle) |
| Player cards (inside sheet) | 14px |
| CTA button | 14px |
| Header icon buttons | 50% |
| Host's note box | 14px |

---

## 5. Header

- **Background:** `primary` (`#30d5c8`)
- **Content:** shuttlecock SVG icon + "Huzz." wordmark (Georgia, 28px, 900, white) on the left; search icon + notification icon on the right
- **Icon buttons:** 36×36px circles, `rgba(255,255,255,0.20)` background, white stroke icons
- **Notification dot:** 7×7px, `#ff3b30`, positioned top-right of bell icon
- Below the header, a strip (still on `primary` bg) shows: `"🏸 N lobbies open near you"` left, pill `"Sorted by recommendations"` right (`rgba(255,255,255,0.25)` bg)

---

## 6. Lobby Cards

Each card is a self-contained summary of one matchmaking lobby.

### Structure (top to bottom)
1. **Row 1 — Badges + Slots**
   - Left: `type-badge` (Competitive / Social / Casual) + `mode-badge` (Singles / Doubles)
   - Right: `slots-pill` (e.g. `3 / 4`, `2 / 2 Full`)

2. **Level bar** — light tinted row (`#f0fafa`, radius 10px) containing:
   - `"LEVEL"` micro label (left)
   - 10 level dots (circles, 20×20px): inactive = `#e8f7f5` / teal bg; in-range = `#30d5c8` white text; host level = `#0d3d3a` white text
   - `±1` / `±2` / `Open` rule label (right, 10px 700, primary or warning colour)
   - **Match rules: Competitive=±1, Casual=±2, Social=Open**

3. **Host's note** (optional) — `lobby_desc` free text set by host. Shown as a tinted note box below the level bar. Label: `"HOST'S NOTE"` uppercase micro label. Hidden if empty.

4. **Row — Host + Venue suburb**
   - Left: host avatar (22×22 circle, coloured bg, initials) + `"Host [Name]"` text
   - Right: pin icon + venue suburb (from `Location.location_address`, only shown when a venue is assigned)

### Card style
- Background: white
- Border: `0.5px solid rgba(48,213,200,0.20)`
- Shadow: `0 2px 12px rgba(48,213,200,0.08)`
- Border radius: 18px
- Hover state: `scale(0.97)` transform (web: apply on `:hover` and `:active`)

### Type badge colours
| Type | Background | Text |
|---|---|---|
| Competitive | `#ffeaea` | `#bf1a00` |
| Social | `#e6f9f7` | `#0a6e66` |
| Casual | `#fff4dc` | `#9a6000` |

### Mode badge colours
| Mode | Background | Text |
|---|---|---|
| Singles | `#e8eeff` | `#2d4db8` |
| Doubles | `#f5e6ff` | `#7b2fb8` |

### Slots pill colours
| State | Background | Text | Trigger |
|---|---|---|---|
| Open | `#e6faf8` | `#0a8a80` | < 50% filled |
| Almost full | `#fff4dc` | `#9a6000` | ≥ 50% filled, not full |
| Full | `#ffeaea` | `#bf1a00` | 100% filled |

---

## 7. Lobby Detail Sheet (Modal / Drawer)

Triggered by tapping any lobby card. On web: rendered as a bottom-anchored modal drawer.

### Structure
- **Drag handle:** 36×4px pill, `#ddd`, centered, 12px top margin
- **Sheet badges row:** type badge + mode badge + slots pill + venue suburb (pin icon + suburb, only when venue assigned)
- **Host's note box:** `#f0fafa` background, left border `3px solid #30d5c8`, radius 14px. Label: `"HOST'S NOTE"` (10px 800 primary uppercase). Body: 13px `#444` line-height 1.6. Hidden if `lobby_desc` is empty.
- **Divider:** `0.5px #eee`
- **"PLAYERS IN THIS LOBBY"** label — 11px 800 `#999` uppercase
- **Player cards** (one per player):
  - Avatar (40×40 circle, coloured, white initials)
  - Name + Host pill (`#0d3d3a` bg, white text, 10px 700) if applicable
  - Gender · Age (11px muted) — no suburb (no reverse geocoding)
  - Skill level pill + mode pill (10px, primary tint)
  - Bio text (12px `#666`)
- **CTA button:** `"Join Lobby"` — full width, `#30d5c8` bg, white text, 15px 800, radius 14px, 14px padding. **Direct join, no approval step.** If full: grey bg `#ccc`, disabled, text `"Lobby Full"`

### Sheet behaviour (web)
- Slides up from bottom as a fixed overlay
- Backdrop: `rgba(0,0,0,0.50)`
- Max height: ~78% of viewport
- Scrollable internally
- Click backdrop to dismiss

---

## 8. Navigation Bar

- **Background:** white
- **Border top:** `0.5px solid #e8e8e8`
- **Height:** 72px
- **Style:** icon-only, no labels, no boxes, no background on individual items
- **Icon stroke:** `#cccccc` inactive, `#30d5c8` active (filled for Home)
- **Active indicator:** 4×4px `#30d5c8` dot, 5px below the icon, centered

### 4 tabs (left to right)
| Tab | Icon description | Active style |
|---|---|---|
| Home | Filled house shape | Solid fill `#30d5c8` + dot below |
| Advanced Match | Two silhouettes with a diamond/lightning shape between them | Stroke `#30d5c8` |
| Create Lobby | Simple `+` (plus sign only, no box) | Stroke `#30d5c8` |
| Profile | Person silhouette (head circle + shoulder arc) | Stroke `#30d5c8` |

**Icon size:** 26×26px
**Stroke width:** 1.8px
**No borders, backgrounds, or containers around any icon**

---

## 9. Skill Level System

- **Range:** 1 – 10 (integer only). 1 = Beginner, 10 = Top Player
- **Displayed as:** a row of 10 circular dots, each labelled 1–10
- **Dot states:**
  - `inactive` — `#e8f7f5` bg, `#aaa` text (outside the accepted range)
  - `in-range` — `#30d5c8` bg, white text (within accepted range of host)
  - `host` — `#0d3d3a` bg, white text (host's own level)
- **Match rules by game type:**
  - Competitive: host level ±1 only
  - Casual: host level ±2
  - Social: all levels accepted (all dots show as in-range)
- **Rule label:** shown to the right of the dots — `"±1"`, `"±2"`, or `"Open"` in 10px 700

---

## 10. Lobby Identity System

Lobby visual identity on cards comes from **colour-coded tags only** — game type badge + match type badge. These are always generated from the lobby's stored parameters, never free text.

The `lobby_desc` field is the host's optional free-text note and is shown separately below the tags as the "HOST'S NOTE" section. It is **not** a title.

**Tag examples:**
- Competitive badge (red) + Singles badge (blue)
- Social badge (teal) + Doubles badge (purple)
- Casual badge (amber) + Singles badge (blue)

---

## 11. Host Avatar System

Avatars are generated from initials (first + last name initials), displayed in a coloured circle.

| Context | Size | Font size |
|---|---|---|
| Lobby card (host row) | 22×22px | 9px |
| Sheet player card | 40×40px | 14px |

Avatar background colours assigned per user. Suggested palette: `#bf1a00`, `#0a6e66`, `#9a6000`, `#2d4db8`, `#7b2fb8`, `#555555`.

---

## 12. Iconography

All icons are inline SVG, stroke-based (not filled), except:
- Home nav icon when active (filled)
- Host level dot (filled circle)

**Default stroke width:** 2.0–2.5px for header/card icons; 1.8px for nav icons
**Stroke linecap:** `round`
**Stroke linejoin:** `round`

### Key icons used
| Icon | Where used |
|---|---|
| Shuttlecock (custom SVG) | Header, next to "Huzz." wordmark |
| Search (circle + line) | Header right |
| Bell (notification) | Header right |
| Pin / location drop | Venue suburb labels on cards and sheets |
| House (home) | Nav tab 1 |
| Two people + diamond | Nav tab 2 (Advanced Match) |
| Plus sign | Nav tab 3 (Create Lobby) |
| Person silhouette | Nav tab 4 (Profile) |

---

## 13. Page Background

- **Colour:** `#f0fafa` (primary-faint)
- The header and its strip bleed to the top, no gap
- Cards sit on the tinted background with their own white surface

---

## 14. Section Headers

Displayed above lobby lists and inside sheets.

- **Left:** 16px, weight 800, `#0d3d3a`
- **Right:** `"See All →"` link — 12px, weight 700, `#30d5c8`
- **Margin below:** 12px

---

## 15. Interaction & Motion

- **Card hover:** `transform: scale(0.97)`, `transition: 0.15s`
- **Sheet/drawer open:** slides up from bottom (~250ms ease-out)
- **Sheet/drawer close:** click backdrop, slides back down
- **Button press:** slight scale-down (`0.97`) on active

---

## 16. Accessibility

- All badge text must meet 4.5:1 contrast ratio against its background
- Tappable/clickable elements minimum 44×44px touch target
- Icons paired with visible context (badge label or screen label)
- Font sizes no smaller than 9px (used only for avatar initials)

---

## 17. Do's and Don'ts

**Do:**
- Use `#30d5c8` as the dominant brand colour — it should appear on every screen
- Keep Singles (blue) and Doubles (purple) visually distinct at all times
- Always show the level dot visualisation on cards — it's the core differentiator
- Use colour-coded type + mode tags as the lobby's visual identity on cards
- Show `lobby_desc` as the host's note, not as a title
- Sort home feed by recommendations (past co-players first, then skill proximity)
- Use venue suburb from `Location.location_address` for location display

**Don't:**
- Don't use gradients anywhere except the header (subtle `#30d5c8 → #1ab5aa`)
- Don't add borders or background containers to nav icons
- Don't show player suburb — only venue suburb when a venue is assigned
- Don't reverse-geocode player coordinates — no suburb lookup for players
- Don't implement a join request/approval flow — joins are immediate and direct
- Don't use more than 3 font weights on any single screen (400, 700, 800)
- Don't use black (`#000`) anywhere — use `#0d3d3a` as the darkest tone
