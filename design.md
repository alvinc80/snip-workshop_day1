# Snip Design System

## Tokens

- **Background:** `#0c0c0b`; near-black with a restrained warm radial wash and fine tonal contrast.
- **Surface:** `#141413`; panel fill `rgba(20, 20, 19, 0.76)`.
- **Text:** `#f4eee8`; **muted:** `#a49d96`; subtle text `#716d68`.
- **Accent:** coral `#f5826d`, amber `#ffb078`, rose `#e56869`; action gradient runs amber to coral to rose. Success uses soft mint `#9bd0aa`.
- **Type:** Manrope for interface and display text; DM Mono for short codes, counts, and small labels. Scale: 60/46 px display, 23/21 px section title, 13–16 px body, 9–11 px metadata.
- **Spacing:** 4 px base rhythm; 12, 16, 24, 36, 48, 80 px landmarks.
- **Radius:** 999 px for the URL composer and action; 12 px for notices; 16 px for the link table surface.
- **Borders and shadows:** warm-white borders at 10–17% opacity; soft black lift beneath the composer and table; a low-opacity coral/amber glow behind the hero.

## Reference Cues

The live reference currently uses a light neutral canvas, a top-left wordmark, a centered bold headline, muted supporting copy, and a broad rounded prompt surface with a fine border. Snip translates that hierarchy, spacing, and composer shape into its requested charcoal palette and fixed warm glow; it does not reuse the reference's brand, logo, or copy.

## Element Mapping

- **Page header:** centered hero with a compact Snip wordmark, warm eyebrow, two-line headline, and muted supporting line.
- **URL form:** pill-shaped, chat-style composer with an attached gradient action; clear focus ring and disabled submission state.
- **Success/error:** inline status notices below the form; mint for the returned short link, coral for validation or API errors.
- **Links table:** one framed surface beneath the hero, with short code, destination, and visit count; horizontal scrolling on narrow screens.
- **Ambient glow:** fixed, full-viewport-width band at the top (`left: 0; right: 0; pointer-events: none`) rather than a glow constrained to the content column.