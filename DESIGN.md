---
name: CareConnect
description: Better care starts with a conversation.
colors:
  forest: "#1f6b57"
  forest-700: "#17503f"
  sage: "#8faf9b"
  mint: "#eaf3ee"
  mint-200: "#dcebe2"
  mint-300: "#cfe3d6"
  ivory: "#f8f8f4"
  ground: "#edf4ef"
  ink: "#26332f"
  ink-2: "#4f5f58"
  ink-label: "#3f5a4f"
  line: "#d3e3d9"
  line-soft: "#e3ece6"
  danger: "#8e2f25"
  danger-bg: "#fbedea"
  warning: "#5e4b2b"
  warning-bg: "#f4eedf"
  file-pdf: "#9a3b2e"
  file-pdf-bg: "#f4e3df"
  tone-sky: "#2f4e5e"
  tone-sky-bg: "#d9e4ea"
  tone-rose: "#5e3a4c"
  tone-rose-bg: "#e8dce2"
typography:
  display:
    fontFamily: "Inter Variable, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "34px"
    fontWeight: 600
    letterSpacing: "-0.025em"
  display-sm:
    fontFamily: "Inter Variable, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Inter Variable, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Inter Variable, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "17px"
    fontWeight: 600
  body:
    fontFamily: "Inter Variable, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  body-compact:
    fontFamily: "Inter Variable, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "15px"
    fontWeight: 400
  label:
    fontFamily: "Inter Variable, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "13px"
    fontWeight: 600
  caption:
    fontFamily: "Inter Variable, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "12px"
    fontWeight: 600
  counter:
    fontFamily: "Inter Variable, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "11px"
    fontWeight: 600
rounded:
  field: "14px"
  tile: "20px"
  card: "28px"
  full: "9999px"
spacing:
  gutter-phone: "24px"
  card-pad: "20px"
  card-pad-wide: "24px"
  stack: "16px"
components:
  button-primary:
    backgroundColor: "{colors.forest}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    height: "48px"
    padding: "0 20px"
  button-primary-hover:
    backgroundColor: "{colors.forest-700}"
  button-soft:
    backgroundColor: "{colors.mint-200}"
    textColor: "{colors.forest}"
    rounded: "{rounded.full}"
    height: "48px"
  button-soft-hover:
    backgroundColor: "{colors.mint-300}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.forest}"
    rounded: "{rounded.full}"
    height: "48px"
  input:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    height: "48px"
    padding: "0 16px"
  chip:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    height: "40px"
  chip-selected:
    backgroundColor: "{colors.forest}"
    textColor: "#ffffff"
  badge-brand:
    backgroundColor: "{colors.mint-200}"
    textColor: "{colors.forest}"
    rounded: "{rounded.full}"
  badge-warning:
    backgroundColor: "{colors.warning-bg}"
    textColor: "{colors.warning}"
    rounded: "{rounded.full}"
  badge-danger:
    backgroundColor: "{colors.danger-bg}"
    textColor: "{colors.danger}"
    rounded: "{rounded.full}"
  tab-active:
    backgroundColor: "{colors.mint-200}"
    textColor: "{colors.forest}"
    rounded: "{rounded.full}"
---

# Design System: CareConnect

## Overview

**Creative North Star: "The Quiet Clinic Garden"**

CareConnect should feel like a waiting room you'd actually want to sit in. The screen rests on a pale mint ground, washed with soft sage and ivory light and a faint pattern of line-drawn leaves. Content sits on panes of frosted glass, so the garden shows through without competing. Nothing is loud. One deep eucalyptus green does the work of saying "this is the thing to tap", and everything else stays quiet.

The patient side is spacious and obvious: large type, big round targets, one clear action per screen. The doctor side reuses the same materials more densely, with three columns of glass, smaller controls and more on screen at once. Both are the same garden, seen from a different chair.

It must never look like hospital software (cold blue and white, dense clinical tables, jargon), generic SaaS (purple gradients, grids of dashboard cards, startup hero sections) or a WhatsApp clone (that app's green-and-beige chat). It should feel personal and calm, and recognisably its own.

**Key Characteristics:**
- A single warm-green accent against soft mint neutrals.
- Frosted-glass surfaces over a fixed, softly lit background.
- Generous radii: pills for actions, 28px for cards.
- Long, soft, green-tinted shadows rather than grey ones.
- Inter throughout, with tight tracking on headings and plain sentence-case copy.

## Colors

A garden palette of low saturation: one confident green, and greys tinted toward mint.

### Primary
Token keys match the Tailwind classes (`bg-forest`, `text-ink-2`); the descriptive names are for people.

- **Eucalyptus** (`forest`): primary buttons, selected chips, focus rings, links, the unread counter, the brand mark. It means "act here" or "this is selected".
- **Eucalyptus Deep** (`forest-700`): hover and pressed states for Eucalyptus, and link hover.

### Secondary
- **Sage** (`sage`): the soft light in the background and dashed "Invite pending" outlines. Never used for text.

### Neutral
- **Garden Ground** (`ground`): the app background beneath everything.
- **Mint Mist** (`mint`): soft fills, disabled inputs, neutral badges.
- **Mint Leaf** (`mint-200`): the soft button, the active tab, the brand badge.
- **Mint Bud** (`mint-300`): the tint of your own chat bubble, patient avatars, and soft-button hover.
- **Ivory** (`ivory`): sheets and dialogs, at the strong-glass level.
- **Forest Ink** (`ink`): primary text.
- **Moss Ink** (`ink-2`): secondary text, at a contrast of 4.5:1 or more on white and mint.
- **Bark Ink** (`ink-label`): labels and small headings.
- **Leaf Line / Soft Line** (`line`, `line-soft`): input borders and dividers.

### Status and Utility
- **Clay** (`danger` on `danger-bg`): errors and destructive actions.
- **Ochre** (`warning` on `warning-bg`): drafts and pending states.
- **PDF Terracotta** (`file-pdf` on `file-pdf-bg`): the PDF file badge only.
- **Avatar tones** (`tone-sky`, `tone-rose` and their backgrounds): initials avatars. The Avatar component picks the tone per person; never choose one by hand.

### Named Rules
**The One Green Voice Rule.** Eucalyptus is the only saturated colour on a screen, and only one filled-eucalyptus button appears per screen. Secondary actions use soft, glass or ghost.

**The Tokens-Only Rule.** Every colour is a token in `src/app/globals.css`. A hex value in a component is a bug.

**The Words-With-Colour Rule.** Status is never colour alone. Every badge carries text, and ideally an icon.

## Typography

**Font:** Inter Variable, self-hosted, falling back to the system sans-serif.

**Character:** a single family carries everything. Hierarchy comes from size, weight and tight tracking, never from a second typeface. It reads as friendly and modern rather than clinical.

### Hierarchy
- **Display** (600, 34px, tracking -0.025em): the patient home greeting. Used at most once per screen.
- **Display small** (600, 28px, tracking -0.025em): the patient's name on Home. Between Display and Headline, for one large personal line.
- **Headline** (600, 22px): screen and dialog titles such as "Choose a password", and empty-state titles such as "No prescriptions yet".
- **Title** (600, 17px): card titles, people's names in panels and on prescriptions, and large button labels.
- **Body** (400, 16px, line-height 1.5): all patient-facing reading text, including chat messages.
- **Body compact** (400, 15px): doctor-side lists, supporting lines, medium button labels.
- **Label** (600, 13px): field labels, chip text, metadata on the doctor side.
- **Caption** (600, 12px): badges, tab labels and the file-type tile ("PDF").

**The Scale-Only Rule.** These eight sizes are the whole scale (plus 11px for the unread counter only). A new size gets added here on purpose, or it does not ship.

### Named Rules
**The 16px Patient Floor Rule.** Patient reading text is never below 16px. The smaller sizes are for the doctor's screens, labels and metadata.

**The Indic Headroom Rule.** Kannada and Hindi are coming. Never fix line heights or clip text in a way that would cut off taller scripts or longer strings.

## Layout

- **Patient app:** a single centred column, at most 448px wide (`max-w-md`), with 24px side gutters. A floating glass tab bar sits 16px above the bottom safe area.
- **Doctor app:** the full screen height, split into three columns (inbox list, conversation, patient panel). Each column scrolls on its own. On phones it collapses to the list, then the conversation, with the same tab bar for navigation.
- **Rhythm:** 16px between stacked form items, 20px of card padding on phone and 24px from `sm` up. Content must work from 390px to 1440px wide.
- **Background:** `BackgroundScene` is fixed behind everything and rendered once in the root layout. Pages never add their own blobs or patterns.

## Elevation & Depth

Depth comes from layers of glass over the garden, lifted by long, low-opacity shadows tinted green, never grey. There are three glass strengths: `glass-subtle` for large panels, `glass` for default cards, and `glass-strong` for dialogs and sheets. Content placed on top of glass, such as medicine rows, uses solid white with a hairline border.

### Shadow Vocabulary
- **Float** (`0 18px 40px -20px rgb(31 74 60 / 0.4)`): the default for cards and the tab bar.
- **Lift** (`0 8px 20px -14px rgb(31 74 60 / 0.45)`): small solid items on glass.
- **CTA** (`0 10px 24px -10px rgb(31 107 87 / 0.7)`): a green glow, only under the eucalyptus primary button.
- **Modal** (`0 40px 90px -30px rgb(20 40 32 / 0.55)`): dialogs and sheets.

### Named Rules
**The Three Panes Rule.** Use the `glass` utilities or `Card`, never a hand-written `backdrop-filter`. If none of the three strengths fits, the layout is wrong.

## Shapes

Everything is softly rounded and nothing is sharp. **The Three Corners Rule:** only field (14px), tile (20px), card (28px) and full pills. A message bubble may tighten one corner toward its sender. Actions, chips, badges, tabs and avatars are full pills or circles. Containers step up in radius as they grow: fields 14px, tiles 20px, cards and panels 28px. Borders are hairline: white at high opacity on glass, the Leaf Line colour on inputs, and dashed sage for pending.

## Components

### Buttons
Rounded, tactile, quietly confident.
- **Shape:** full pill. Heights are 44px (sm), 48px (md) and 56px (lg, patient main actions). Nothing tappable is under 44px.
- **Primary:** eucalyptus with white semibold text and the green CTA glow. One per screen.
- **Secondary:** a glass pill with ink text, for Cancel, Download or Save draft, on glass surfaces.
- **Outline:** white with a Leaf Line border. The secondary button on solid white surfaces (prescription card), where glass would vanish.
- **Soft:** a mint-leaf fill with eucalyptus text, for brand actions that mustn't compete with the primary.
- **Ghost:** transparent with eucalyptus text, for links such as "Change email".
- **Danger:** glass with clay text.
- **States:** hover deepens the fill; pressing scales the button to 0.98. A focus ring of 2px eucalyptus with a 2px offset. Loading shows an inline spinner and sets `aria-busy`.
- **IconButton:** a 44px circle that always carries an accessible label.

### Icon tile
A 44px square at field radius holding one icon: mint with eucalyptus (soft) or eucalyptus with white (solid). Always `IconTile`.

### Chips
- **Style:** a 40px or 44px pill on white with a Leaf Line border.
- **Selected:** a eucalyptus fill, white semibold text and a check icon. Nothing is pre-selected for clinical choices.

### Cards / Containers
- **Corner style:** 28px (card) or 20px (tile).
- **Tones:** glass (default), subtle (large panels), strong (dialogs), solid (content on glass) and dashed (not sent yet: draft prescriptions).
- **Shadow:** Float by default, Modal for strong, Lift for solid.
- **Padding:** 20px on phone, 24px from `sm` up.

### Inputs / Fields
- **Style:** white fill, a 1px Leaf Line border and a 14px radius. 16px text, so iOS doesn't zoom.
- **Focus:** a eucalyptus border with a soft 4px eucalyptus halo at 10% opacity.
- **Error:** a clay border, plus an error message with an icon below, linked through `aria-describedby`.
- **Field wrapper:** every input goes through `Field` (label, control, hint or error).

### Badges
A small 12px semibold pill, always with words, plus an icon at 14px. The tones are brand, solid, neutral, warning, danger, and a dashed outline for pending.

### Navigation
- **TabBar:** a floating glass pill 70px tall that holds 3–4 items, each an icon over a label.
- **Active tab:** a mint-leaf fill with eucalyptus text, semibold weight and a slightly heavier icon stroke.
- **Shared:** the same component serves the patient tabs and the doctor's phone navigation.

### Chat bubble (signature)
Your own messages sit on the right, tinted mint. The other person's sit on the left in white glass. The time goes under each bubble, and "Seen" appears on your last read message. Day dividers and an "N new messages" divider structure the thread. It must read as personal messaging, without borrowing WhatsApp's colours.

## Do's and Don'ts

### Do:
- **Do** use exactly one `variant="primary"` button per screen.
- **Do** keep patient text at 16px or more and patient targets at 44px or more, and pair every icon with a text label.
- **Do** build surfaces from `Card` or the `glass`, `glass-subtle` and `glass-strong` utilities.
- **Do** use green-tinted shadows from the token set.
- **Do** write status as badge text plus an icon.

### Don't:
- **Don't** write hex colours or `backdrop-filter` in components.
- **Don't** make it look like hospital software: cold blue and white, dense clinical tables for patients, jargon.
- **Don't** make it look like generic SaaS: purple or rainbow gradients, dashboard-card grids, marketing hero styling.
- **Don't** copy WhatsApp's green-and-beige chat look.
- **Don't** add background blobs or patterns inside pages. `BackgroundScene` owns that.
- **Don't** introduce a second typeface or colour accent.
