# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Static pricing-page prototype for **أكاديميات (acadimiat.com)** — a Saudi SaaS for trainers/coaches/content creators. RTL Arabic, mobile-first, premium SaaS aesthetic inspired by Notion/Stripe.

No build step. Plain `index.html` + `styles.css` + `script.js`. Tailwind is loaded via CDN.

## Preview / dev server

Use the preview tool config in `.claude/launch.json` (server name: `pricing-preview`) — it runs `npx --yes serve -l 3456 .` from the project root.

When inspecting changes use the `mcp__Claude_Preview__*` tools, not Bash. `preview_eval` is the fastest way to verify state (e.g. read DOM, click toggles, inspect computed styles).

## Architecture

Three files do everything; understanding how they hand off is the whole picture.

### `index.html`
Single-page layout with these sections (in order):
floating Top Nav → **`.hero-pricing-wrap`** (Hero + Toggles Bar + Pricing Cards, all sharing one backdrop) → Compare Table → $99 Add-on → Social Proof → **Academies Showcase (3D circular gallery)** → **FAQ (dark)** → **CTA Strip (dark)** → **Footer (dark)** → Sticky Mobile CTA → WhatsApp FAB → **Signup Modal** → **Login Modal** → **Onboarding Modal** → **Trial Modal** → **Payment Modal** → **Thank-You Modal**.

The FAQ + CTA Strip + Footer form a single dark block (`bg-heading`) at the bottom of the page — separators are `border-t border-white/10`.

- Inline `<svg width="0" height="0"><defs>...</defs></svg>` sprite holds the brand logo symbol (`#acad-logo-mark`) referenced via `<use href="#acad-logo-mark"/>`. Auth modals use the dark logo `assets/logo 1.png` (note the space in the filename); **the footer uses the white-on-transparent variant `assets/white logo.png`** so it stays visible on the dark background. Payment card-brand images live in `assets/`: `visa.png`, `Mastercard.png`, `express.png` (AmEx), `Mada.png`. The **academies showcase reuses `assets/sahel.png`** as the preview image for all 8 cards (placeholder until per-academy screenshots arrive).
- **Tailwind config is inline** in a `<script>` block in the `<head>` and extends `theme.colors`, `theme.fontFamily.sans`, `theme.fontSize.h1..h5`, and `theme.maxWidth.container`. Editing the design system means editing that inline config + the matching CSS variables in `styles.css`.
- The 3 pricing-card CTAs carry `data-plan="starter|pro|advanced"` and `data-signup-trigger`. Nav/hero/final CTAs intentionally just scroll to `#pricing-cards` so users pick a plan first. The "دخول" trigger uses `data-login-trigger`. The "إنشاء حساب جديد" link inside Login Modal uses `id="login-to-signup"` and switches modal contexts (closes Login, opens Signup with default plan `pro`).
- **External libraries** loaded in `<head>` (besides Tailwind): `@lottiefiles/lottie-player` (Lottie web component) and `canvas-confetti` (used in the Thank-You modal). Both via CDN; both are tolerant to network failures — the page still renders without them.

### `styles.css`
- Layered on top of Tailwind. CSS custom properties at `:root` mirror the Tailwind theme colors — keep these two in sync when changing the palette.
- Includes `@font-face` declarations for **29LT Bukra** pointing to `./fonts/29LTBukra-{Regular,Medium,SemiBold,Bold}.woff2` (files not committed — commercial license). When the files are absent the stack falls back to `IBM Plex Sans Arabic` (Google Fonts) with no visual regression.
- Section dividers in the source mark major systems: CTA button system (color-only hover, no shadow/lift per the user's preference), billing toggle, currency dropdown, Saudi Riyal currency, signup modal, onboarding chips + progress steps + stacked-cards effect, hand-drawn annotation, skeleton loader, **trial subscription modal, payment modal, thank-you modal, infinite-grid backdrop, animated text gradient for "الأكثر طلباً", FAQ dark (chevron rotate-on-open), footer social icon buttons (`.footer-social`), academies showcase 3D circular gallery (`.circular-ring` + `.circular-card`)**.
- Every custom keyframe animation (grid scroll, popular-text-shift, etc.) is paired with a `@media (prefers-reduced-motion: reduce)` block that disables it. Keep that pattern when adding new animations.

### `script.js`
- One IIFE, vanilla JS, no dependencies. State (`state.billing`, `state.currency`) persists in `localStorage` under `acad_billing` / `acad_currency`. Default is `yearly` + `USD`.
- IP-based geolocation (`detectCurrency`) is intentionally **not called** from `init()` — the function is left in the file but commented out at the call site so USD stays the default. Don't re-enable without a reason.
- Price values live in **two places**: `data-monthly-usd / data-yearly-usd / data-monthly-sar / data-yearly-sar` attributes on each `.price-amount` span, AND in the `PLANS` object near `openSignupModal()`. Change both when prices change. The yearly→annual-total lookup is the `yearlyTotals` object inside `renderPrices()` and `PLANS[*].yearlyTotalUsd|yearlyTotalSar`. Current values: starter `$23/$29`, pro `$29/$39`, advanced `$99/$129` (yearly/monthly).
- Modal open/close uses `body.modal-open` to lock background scroll. Switching contexts (Login ↔ Signup ↔ Onboarding ↔ Trial ↔ Payment ↔ Thank-You) is wired so opening one closes the others first.
- Onboarding state lives in `onboardingState = { step, totalSteps: 3, answers: { goal, academyName, specialization, audience, firstMonthGoal, currentPlatform } }`. `goal` is initialized to `['share-knowledge']` (the default-selected first chip). Question titles per step are in `onboardingScreenMeta` keyed by step number — only step 1's meta is actually rendered to the DOM (the others exist for completeness but are never shown). Don't try to read meta on step 2+ expecting it to be visible.
- Trial state lives in `trialState = { billing: 'yearly' }` and is consumed by both the Trial modal (radio cards) and the Payment modal (renewal calculation).
- `init()` wires every modal: `initSignupModal`, `initLoginModal`, `initOnboardingModal`, `initTrialModal`, `initPaymentModal`, `initThankYouModal`, plus `initInfiniteGrid` (animated hero backdrop), `initCountUp` (CTA stats), and `initCircularGallery` (3D academies ring).
- Date formatting uses `Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', { day, month, year })` — Arabic month names but **Latin (Western) numerals** so dates render like `16 يونيو 2026` matching the prices on the rest of the site. Don't drop the `-nu-latn` extension or numerals flip to Arabic-Indic (`١٦ يونيو ٢٠٢٦`).

## Pricing layout (Notion-inspired)

Two visually separate blocks side-by-side on desktop:
- **Block 1** (`lg:col-span-2`): white background, `#F1ECF4` border. Contains الانطلاقة + الاحترافية with a vertical `md:border-e` divider between them. Both `<article>` cards use `h-full` so the divider stretches to row height.
- **Block 2** (`pricing-card--featured`): `#F1ECF4` background, no border, single card (المتقدمة). Marked by an inline "الأكثر طلباً" badge next to the plan name (`bg-[#F9F7FB]`, rounded-full). The badge **text** carries the `.popular-text-gradient` class which animates a 2-color gradient (primary → secondary → primary) via `background-clip: text` + the `popular-text-shift` keyframe. The pill background itself stays static.

Each card structure: `header` → price row (number + "شهريًا" + `price-note` pill) → CTA → features list. The CTA sits **directly below the price**, before features (Notion-style).

## Hero + Pricing shared backdrop (`.hero-pricing-wrap`)

Hero, Toggles Bar, and Pricing Cards are wrapped in a single `<div class="hero-pricing-wrap relative isolate overflow-hidden bg-white">` so they share one backdrop. Each inner `<section>` has **no `bg-*` class** and uses `relative z-10` so its content paints over the backdrop. Don't add background colors back to those sections without removing them from the wrapper too — you'll cover the grid.

The backdrop (`<div id="hero-grid-wrap" class="hero-bg">`) is a single SVG that scrolls infinitely:
- `<pattern id="grid-pattern-base" width="40" height="40" patternUnits="userSpaceOnUse">` with a single `<path d="M 40 0 L 0 0 0 40">` per cell. Stroke `rgba(107, 58, 140, 0.75)` × layer `opacity: 0.20` → faint purple grid (visible behind the headline).
- `initInfiniteGrid()` runs a `setTimeout(tick, 16)` loop (~60fps) that bumps `pattern.x` / `.y` by 0.5px each frame and wraps at 40 (the tile size). Since the pattern wraps perfectly, the offset reset is invisible → infinite diagonal scroll.
- **Why `setTimeout` instead of `requestAnimationFrame`:** rAF is throttled to 0 inside the MCP preview's headless context, so the animation appears frozen during verification. `setTimeout(16)` runs everywhere and is cheap (one attribute write per frame).
- A vertical mask on `.hero-bg` (`mask-image: linear-gradient(to bottom, black 0%, black 12%, transparent 28%)`) ends the grid by the bottom of the headline. Full strength over the area above + behind the headline, then fades out so the toggles + pricing cards sit on plain white. **Don't extend the mask past the headline** — the user wants the grid to terminate there.

## Hero copy

Hero spacing is `pt-40 sm:pt-48 lg:pt-56` (large header → headline gap) and `pb-4 sm:pb-6 lg:pb-8` (tight headline → toggles gap). Together with the toggles section's reduced `pb-3 sm:pb-4`, the toggle pill sits just below the headline and the pricing cards rise to be ~13px below the toggle.

Three elements:

1. **Earnings badge** (above headline): pill with `bg-[#F5F4F6]` (very light gray), `rounded-full`, `text-heading` text + icon (the user explicitly wanted these in our black, not primary purple), trending-up SVG. Content: `<span dir="ltr">+$250K</span> أرباح عملاء أكاديميات`. The `dir="ltr"` wrap keeps `+$250K` from getting bidi-mangled.
2. **Headline** (`<h1>`): two `<span class="block">` lines so the break is explicit and styling stays balanced at all viewports. Size `text-[30px] sm:text-[42px] lg:text-[52px]` font-bold leading-[1.4] tracking-tight. **Uses Arabic kashida** (U+0640 ـ) for elegant typographic stretching — e.g. `ابدأ تجربتك مجـــانًا، ثم ادفع $1 لأول شهر` (line 1) and `مع كامل الميــزات` (line 2). The phrase `$1 لأول شهر` is wrapped in `<span class="popular-text-gradient">` so it gets the same animated 2-color (primary → secondary) gradient as the "الأكثر طلباً" badge.
3. **Hand-drawn annotation arrow** (above the billing toggle, points at سنوي): `<div class="annotation absolute bottom-full left-10 mb-1 flex items-start gap-1">` containing the text `وفّر 20%` (`text-heading text-h5 font-bold`) + a 56×56 SVG. The arrow path is `M 58 8 C 54 22, 46 34, 34 42 C 24 48, 16 52, 8 56` — sweeps from top-right to bottom-left, tip pointing DOWN at سنوي. **The `left-10` is calibrated so `tipX` (8px into the SVG) lands exactly on سنوي's horizontal center.** If you change the toggle width/padding, re-measure (use `preview_eval` with `getBoundingClientRect`) and adjust the offset.

## Kashida convention (`ـ` U+0640)

The user prefers Arabic typographic stretching via inline tatweel characters for elegance — sprinkled in select words across the site (hero headline, FAQ heading, CTA heading, footer link text, FAQ questions). Examples in the codebase:
- `الأســـــــئلة الشــــــائعة` (FAQ section title — 13 tatweels)
- `مجـــانًا` / `الميــزات` (hero headline)
- `أكاديميـات` / `مبيعـاتك` / `الشائـعة` (lighter touch elsewhere)

When adding new copy that should match the aesthetic, insert tatweel **between connecting letters** (`ـ` only joins letters that already connect — never after non-connecting ones like ر, د, ز, و, ا). The user has been explicit about wanting visible stretches; don't strip them when reformatting copy.

## Academies Showcase — 3D circular gallery (`#academies-showcase`)

Inspired by the `21st.dev/ravikatiyar162/circular-gallery` pattern (the original uses scroll-driven rotation + opacity falloff; we simplified to a slow continuous spin without the sticky 500vh scroll trap).

Structure:
```
.academies-section          (beige #F5F0E8 bg)
  .circular-stage           (perspective: 2000px; height: 480px; overflow-hidden)
    .circular-ring          (--angle var; transform: rotateY(var(--angle)); preserve-3d)
      .circular-card × 8    (--i: 0..7; rotateY(i × 45deg) translateZ(480px))
```

- Each `.circular-card` is an **`<a>` element** with `target="_blank" rel="noopener noreferrer"` so clicks open the academy URL in a new tab. Don't change to `<article>` — the clickability is wired through the anchor element itself, not a child button.
- Card layout: `grid-template-rows: 28px minmax(0, 1fr) auto` → fixed-height browser chrome + screenshot (cropped) + footer. **`minmax(0, 1fr)` is critical** — without the `minmax(0, ...)` the natural size of the image (1920×3543) blows past the card's 400px height. Don't remove it.
- Screenshot uses `<img src="assets/sahel.png" class="circular-card__shot">` with `object-fit: cover; object-position: top center` — shows the upper portion of the website mockup. The same file is reused for all 8 cards as a placeholder.
- `backface-visibility: hidden` on each card so cards on the far side of the ring (angle ~180° from camera) disappear cleanly when they rotate away.
- `initCircularGallery()` runs `setTimeout(tick, 16)` setting `--angle` to a slowly incrementing value (0.08deg per frame ≈ 5°/sec → full revolution ≈ 72s). CSS reads the var via `transform: rotateY(var(--angle))`. **Same `setTimeout` instead of `requestAnimationFrame` rationale as the infinite grid** — rAF doesn't fire reliably in the MCP preview.
- Respects `prefers-reduced-motion` (`initCircularGallery` returns early; ring stays at 0°).

If per-academy screenshots arrive later: drop them into `assets/academies/` and change each card's `<img src>` (the URL/category/name already differ per card).

## Count-up animation (`.count-up`)

Used on the dark CTA Strip stats (`+$250K`, `2K`). Each numeric digit is wrapped in `<span class="count-up" data-count-to="N">0</span>` and `initCountUp()` animates from 0 to N over 1.8s with ease-out cubic. Triggered when the element scrolls into view.

- **Visibility detection uses a scroll listener + `getBoundingClientRect`**, not `IntersectionObserver` — IO doesn't fire callbacks in the MCP preview (verified via direct test, never fires within 500ms). The scroll-based approach works in all contexts.
- After all elements have animated, the scroll listener is removed automatically.
- Respects `prefers-reduced-motion` (jumps straight to the final value).

## Dark footer block (FAQ + CTA Strip + Footer)

The three bottom sections share one dark background `bg-heading` (#311A40) so they feel like one continuous block; sections are split by `border-t border-white/10`. All text colors on this block use white at varying opacity — keep them at `/85` or higher for readable body text (the user explicitly flagged `/65` as too dim).

### FAQ (`#faq`)

`bg-heading text-white py-16 lg:py-20`, `max-w-3xl` centered. Heading: `الأســـــــئلة الشــــــائعة` (13 tatweels — exact spelling matters).

Each item is a native `<details class="faq-item-dark border-b border-white/10">` with a custom-styled summary:
- Summary row: question text (`text-h4 font-semibold`) on the right + chevron SVG (`.faq-chev`) on the left.
- The default browser disclosure triangle is suppressed by `.faq-item-dark > summary::-webkit-details-marker { display: none }`.
- When the `<details>` opens, `.faq-item-dark[open] .faq-chev { transform: rotate(-180deg) }` flips the chevron upward. This is **pure CSS** — there is no JS handler. Don't add one.
- Answers use `text-h5 text-white/70 leading-relaxed`.

Eight Q&A items, all carrying kashida stretches in the questions.

### CTA Strip

`bg-heading border-t border-white/10 py-14`. Two-column flex (right: text+stats, left: button). Stats use `<span dir="ltr">` for `+$250K` and `+2K` to keep them readable. Button is a single `bg-white text-heading` CTA that scrolls to `#pricing-cards`.

### Footer

`bg-heading text-white border-t border-white/10`, 5-column grid on `md+`:

| Col span | Visual position (RTL) | Content |
|---|---|---|
| `md:col-span-3` | right (start) | **White logo** (`assets/white logo.png`) + 2 stacked app-store buttons |
| `md:col-span-2` | | الخدمـات links |
| `md:col-span-2` | | الدعـم links |
| `md:col-span-2` | | مصـادر أخرى links |
| `md:col-span-3` | left (end) | **Newsletter** signup |

- **App store buttons** are styled as black pills with a white `border-white/35`. App Store uses a white Apple SVG; **Google Play uses the multi-color svgrepo triangle** (4 paths: `#00C3FF` cyan, `#FFD500` yellow, `#00E676` green, `#FF3B30` red). DOM order inside each button is `[logo, text-stack]` — in RTL that puts logo on the visual right and the two-line label ("تنزيل من / App Store", "احصل عليه من / Google Play") on the visual left.
- **Newsletter** copy: `اشترك ليصلك كافة التحديثات أوّلاً بأوّل.` (don't restore the older "أحدث المقالات والنصائح كل أسبوع" version — the user revised it).
- **Social row** below the columns uses `.footer-social` helpers (36×36 rounded squares with `bg-white/6` and white border). Order: Facebook → Instagram → X/Twitter → LinkedIn → Threads. The Threads SVG is the official Threads-logo path (starts with `M17.546 11.124a7.464…`) — don't replace it with a generic `@` glyph; the user explicitly chose the brand mark.
- **Legal text** at the bottom (`text-white/65 text-h5`): `مملوكة ومُدارة من قِبل شركة تكنولوجيا التعليم الإلكتروني ذ.م.م — البحرين. علامة تجارية مسجّلة لدى الهيئة السعودية للملكية الفكرية.` Followed by the copyright line.

## Auth modals

Two modals at the end of `<body>`: `#signup-modal` and `#login-modal`. Both share the `.signup-modal` class for visuals (backdrop blur, card animation).

**Signup Modal** (`max-w-lg`, single column):
- Logo → "أنشئ حسابًا في ثوانٍ" → Google + Apple (stacked vertical, both same white-bordered style) → divider "أو متابعة التسجيل بالبريد الإلكتروني" → email field with floating label → "متابعة التسجيل" button → "لدي حساب؟ تسجيل الدخول" → terms microcopy.

**Login Modal** (`max-w-lg`, single column):
- Logo → "أهلًا بعودتك" → 3-button row: Google + Apple + **Passkey** (`grid-cols-3 gap-2.5`, each button has icon on top + label below) → divider "أو متابعة التسجيل" → combined email/phone floating-label input → "تسجيل الدخول" button → "ليس لديك حساب؟ إنشاء حساب جديد" → "هل بحاجة لمساعدة؟" WhatsApp link.

**All inputs/buttons in both modals are exactly `h-[52px]`** — change one, change all to keep the column rhythm.

### Signup → Onboarding wiring

The Signup Modal's "متابعة التسجيل" button (`#signup-continue-btn`) is **disabled by default** and only enables once the email field has ≥4 chars AND contains `@`. The validation runs on every `input` event via `refreshContinueBtn()`. Don't hard-code an `enabled` initial state — let JS manage it.

When the button is clicked (or either SSO button in the Signup modal is clicked), `openOnboardingModal()` runs and the Signup modal closes. The currently selected plan (from the originally clicked pricing card) is preserved in `signupModal.dataset.selectedPlan` for use in later checkout steps.

## Onboarding Modal (`#onboarding-modal`)

3-card survey shown after signup. Built as one `<div class="signup-modal__card">` that contains three `[data-screen="1..3"]` sections — JS toggles `.hidden` on each based on `onboardingState.step`. The progress bar at the top has exactly 3 segments; keep all three numbers (HTML segments, `totalSteps`, and `screenMeta` entries) in sync if you change the card count.

**Cards (each pairs two related questions, except Card 1 which has a question + a required input):**
1. **هيا نبدأ بمعلوماتك** — goal chips (multi, **first chip `share-knowledge` is pre-selected by default** in both DOM and `onboardingState.answers.goal`) + academy name input (required, `id="onboarding-academy-name"`)
2. (no title) — specialization chips (**single**) + audience size chips (single)
3. (no title) — first-30-day goal chips (single) + current platform chips (single)

**Critical layout rules:**
- The card has `min-h-[620px] flex flex-col` so every step is the same height — the footer has `mt-auto` and pins to the bottom regardless of how few chips a step has. Don't remove either or the cards will jump in size as you click through.
- Title + subtitle (`#onboarding-title` and its `nextElementSibling`) **only show on Card 1**. `renderOnboardingStep()` sets `display: none` on them when `step !== 1`. Don't add a header per-screen — title/subtitle are global and JS controls them.
- Question text uses `text-h3 font-medium` (20px) consistently across all questions.
- When two questions share a card, each question wrapper carries `mb-8` (32px) — that's the spacing the user explicitly asked for between paired questions.
- The required-name marker is the text **`(يجب إدخال الاسم)`** in muted gray next to the question — NOT a red asterisk. Don't switch back to `*`.

**Chip behavior (`.chip` + `data-chip-group`):**
- Multi-select groups (`data-multi="true"`): unselected shows `+` icon, selected shows ✓ and dark `--color-heading` background.
- Single-select groups (`data-multi="false"`): **no icon at all when unselected** — just plain pill. Only the selected chip shows ✓. CSS uses `[data-multi="false"] .chip .chip-icon { display: none }` to enforce this.
- Each chip's value updates `onboardingState.answers[groupKey]` (array for multi, single-item array for single). The group key comes from `data-chip-group`. Note: `goal` is the only multi-select group; all others (specialization, audience, firstMonthGoal, currentPlatform) are single-select.

**Footer (three controls — Card 1 hides the first two):**
- `#onboarding-prev` ("السابق", on the left in RTL): goes one step back. **Hidden via `.hidden` class on Card 1** (don't just disable it — the user wanted it gone entirely on the first card).
- `#onboarding-skip-all` ("تخطي الكل", next to prev): jumps `step` to `totalSteps` and closes the modal, preserving whatever answers are already in state. Same hidden-on-Card-1 rule as prev.
- `#onboarding-next` ("التالي" / "إنهاء" on the right): advances steps; label switches to `"إنهاء"` only at `step === totalSteps`. Gated on Card 1 by `academyName.length >= 2`.

**Stacked-cards effect:**
Two decorative `<div class="card-stack-behind">` siblings inside the scroll container render two faded white rectangles peeking out from behind the active card (Shopify onboarding-style). They use absolute positioning with `transform: translate(-50%, -50%) translate(-Npx, Npx) scale(...)` and are hidden on `< 640px` viewports.

### Passkey

The Passkey button (`#login-passkey-btn`) is **always visible**. `detectPasskeySupport()` calls `PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()` and only writes the result to `dataset.supportsPasskey` — it no longer hides the button when unsupported. Earlier iterations hid it, but the user explicitly chose to keep it visible (the click handler should branch on `dataset.supportsPasskey` to show a fallback when the device can't actually do biometrics).

### Floating label pattern

Both modals' text inputs use the same floating-label trick (no JS):

```html
<div class="float-input relative h-[52px] bg-white border border-[#DFDCE0] focus-within:border-primary rounded-xl">
  <input id="..." placeholder=" " class="peer w-full h-full bg-transparent ... pt-5 pb-1.5" />
  <label for="..." class="absolute right-4 top-1/2 -translate-y-1/2 text-h5 text-text-muted pointer-events-none
    peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:text-primary peer-focus:font-medium
    peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-primary peer-[:not(:placeholder-shown)]:font-medium">
    {label text}
  </label>
</div>
```

Key points: `placeholder=" "` (a single space) is required so `:placeholder-shown` works correctly. Don't replace it with text.

## Post-onboarding flow: Trial → Payment → Thank-You

Three modals run end-to-end after the user finishes the Onboarding survey. They share the `.signup-modal` envelope (backdrop blur, card-in animation, `body.modal-open` scroll lock).

### Trial Modal (`#trial-modal`)

Opens when `advanceOnboarding()` reaches the last step and the user clicks "إنهاء". Two-column grid (`max-w-4xl`, `min-h-[640px]`): main pricing on the visual right (RTL first child), timeline on the visual left, separated by a thin `border-inline-start` divider on `.trial-modal__timeline`.

- **Right column**: small back button (`#trial-back-btn`, top-right) → "جرّب خطة {planName} مجاناً" heading → two `.trial-plan-card` radio cards (سنوي default + شهري) → `.trial-summary` (سيتم الخصم في {today+3} | $1 row, اليوم | مجاناً row) → "التالي" → 2 trust rows.
- **Left column**: small "تخطى" link (`#trial-skip-btn`) → vertical timeline with two `.trial-step` dots and a hard-split solid-then-faded connector (`background: linear-gradient(to bottom, primary 50%, rgba(primary, 0.2) 50%)`).
- The **post-trial charge is $1** (the site-wide intro offer), not the plan price. JS uses `introAmount = state.currency === 'USD' ? 1 : 4` for both the summary "due" line and the timeline step-2 text. Don't accidentally swap it back to the plan's real price.
- Selected plan is read from `signupModal.dataset.selectedPlan` (defaults to `pro`).
- "التالي" → closes Trial, opens Payment. Back → returns to Onboarding at `step = totalSteps`. Skip → closes + `navigateToDashboard()`.

### Payment Modal (`#payment-modal`)

Opens from Trial's "التالي". Same `max-w-4xl`, `min-h-[640px]` envelope as Trial. Structure: two-column top (form right, timeline left), then a full-width **add-on row** at the bottom (`.payment-addon-row` with a top border) — restructured so the addon spans both columns.

- **Card form**: card number (auto-formatted `4242 4242 4242 4242`), expiration `MM/YY`, CVV. All inputs are `dir="ltr"`. The card-number label sits on the LEFT (`left-4`) to match the LTR text flow; the brand icon (`#payment-card-brand`) sits on the RIGHT and **swaps to a brand image when the user types** (Visa for `4*`, Mastercard for `5*`, AmEx for `34/37`, Mada for a list of known BINs). Mada BIN check runs first so it isn't miscategorized as Visa.
- **CVV info button** (`#payment-cvv-info`) toggles a small `.payment-cvv-popover` with a hand-drawn-style card illustration + caption — pure CSS, no library.
- **Renewal disclosure** (`#payment-renewal-note`): black text (`text-heading`) with date, plan name, plan price, and (when addon is checked) `+$99` wrapped in `<span class="text-heading font-medium">` so they read as visually emphasized.
- **Add-on row** (bottom, full width): soft cream callout (`background: linear-gradient(180deg, #FFFCEC, #FFFEF7)`). Top row pairs the eyebrow pill ("خدمة إضافية — لمرة واحدة") with a plain "ستحصل على شهرين مجاناً" gift line. Description → `$99` price (text-align: start = right in RTL) → custom checkbox (purple when checked — see "Tailwind preflight specificity" below) → "الأماكن محدودة: 10–15 عميل أسبوعياً" plain row.
- "ابدأ تجربتك بـ $1" → closes Payment, opens Thank-You. Back → returns to Trial. Skip → closes + `navigateToDashboard()`.

### Thank-You Modal (`#thankyou-modal`)

Single-column `max-w-md` confirmation. Lottie player (confetti from Lottiefiles) and `canvas-confetti` fire side-by-side when the modal opens — both shoot real particles via `fireConfetti()`. Then a green check inside a soft success ring, the "تهانينا!" heading + subtitle, the renewal note (same emphasis pattern as Payment), and a single primary CTA: **"الذهاب إلى لوحة التحكم"** → `navigateToDashboard()` (sets `location.hash = 'dashboard'`; there is no real dashboard yet).

## Currency rendering (important)

The Saudi Riyal symbol uses the **official SAMA 2024 mark** (Unicode U+20C1) rendered via the `@emran-alhaddad/saudi-riyal-font` CDN package — NOT a Unicode literal in source. Loading is via `<link>` in `<head>`. In the DOM the symbol appears as:

```html
<span class="sar-icon icon-saudi_riyal_new" aria-label="ريال سعودي"></span>
```

The glyph is drawn by the font's `::after` pseudo-element on `.icon-saudi_riyal_new`. Don't replace this with `﷼` (U+FDFC, the legacy character) — the user has explicitly chosen the new symbol.

The `formatPrice()` helper in `script.js` returns HTML (not text), so callers use `el.innerHTML = ...`. Sizing/spacing of the symbol inside large prices is controlled by `.price-amount .sar-icon` rules in `styles.css`. The symbol uses a negative `margin-inline-start` so it sits tight against the digits (matches the user's "no big space between number and ⃁" requirement).

## RTL conventions

- `<html lang="ar" dir="rtl">` — every layout decision assumes RTL.
- Use Tailwind logical-direction utilities (`border-s`, `border-e`, `ms-*`, `me-*`) instead of `border-l`/`border-r`. The vertical divider inside Block 1 uses `md:border-e` on the first card.
- Anything that has to align numerically (prices) is wrapped so `unicode-bidi: isolate` prevents bidi flipping of digits next to Arabic.

## Button hover policy (user-mandated)

CTAs use **color-only hover** — no transform, no shadow, no lift, no scale. Just `filter: brightness(0.96)` for a subtle darken on hover (and `0.92` on `:active`). The earlier "premium" treatment (spring scale + brand-glow shadow) was explicitly removed. If you find yourself adding `transform` or `box-shadow` to a button hover, you're undoing this. The `.btn-premium` class still exists for the transition setup but no longer lifts.

## Strategic plan

The full product strategy (pricing tiers, trial mechanics, onboarding flow, $99 Done-for-You service, etc.) lives at `C:\Users\pc\.claude\plans\rosy-meandering-snail.md`. Read it before making product-level changes (pricing values, trial length, copy direction). The current implementation may diverge from the plan in places where the user has redirected during design iteration — when in doubt, the live code wins, but check the plan for rationale.

## Editing notes that have bitten us before

- The Edit tool sometimes fails on lines that mix Arabic + JS template literals (invisible bidi marks). If `old_string` doesn't match despite looking identical, shorten the match to just the Latin/code portion.
- The linter rewrites `index.html` formatting after edits (reflows attributes, changes whitespace) and occasionally tweaks hero copy / nav items. After it runs, re-read the file before the next Edit. The reflows are intentional; don't fight them.
- The preview server (`serve`) caches aggressively. After a CSS/JS change, use `preview_eval('location.reload()')` before screenshotting or you'll inspect the stale build.
- The preview browser (headless Chrome inside MCP) reports no platform authenticator, so `isUserVerifyingPlatformAuthenticatorAvailable()` returns `false` there. That's why the Passkey detection logic must only inform behavior, not visibility — otherwise the button disappears in your screenshots.
- **`requestAnimationFrame` is throttled to 0 inside the MCP preview**. Any per-frame animation you add (grid scroll, future canvas effects) must use `setTimeout(tick, 16)` instead — otherwise the animation looks frozen during verification even though it would run fine in real browsers. Confirmed via direct test (rAF callbacks never fire within 250ms).
- **Tailwind preflight beats single-class CSS specificity**. The Tailwind CDN injects its preflight `*, ::before, ::after { background-color: transparent }` (and friends) AFTER `styles.css` loads, so a rule like `.popular-badge__check-box { background: #fff }` can lose to it. When a `:checked` state isn't taking effect, increase specificity (e.g. wrap with a parent selector: `.payment-addon .payment-addon__checkbox:checked + .payment-addon__check-box { ... }`). That's why the addon checkbox CSS uses a compound selector.
- Modal screenshots can time out in the preview (`preview_screenshot` hangs ~30s) when `backdrop-blur` is applied to a fullscreen backdrop. Use `preview_inspect` + `preview_snapshot` to verify modal state instead — they read DOM/CSS without rasterizing.
