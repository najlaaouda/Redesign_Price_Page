# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Static pricing-page prototype for **أكاديميات (acadimiat.com)** — a Saudi SaaS for trainers/coaches/content creators. RTL Arabic, mobile-first, premium SaaS aesthetic inspired by Notion/Stripe/Teachable.

No build step. Plain `index.html` + `styles.css` + `script.js`. Tailwind is loaded via CDN.

## Preview / dev server

Use the preview tool config in `.claude/launch.json` (server name: `pricing-preview`) — it runs `npx --yes serve -l 3456 .` from the project root.

When inspecting changes use the `mcp__Claude_Preview__*` tools, not Bash. `preview_eval` is the fastest way to verify state (e.g. read DOM, click toggles, inspect computed styles).

## Architecture

Three files do everything; understanding how they hand off is the whole picture.

### `index.html`
Single-page layout with these sections (in order):
floating Top Nav → **`.hero-pricing-wrap`** (Hero + Toggles Bar + Pricing Cards, all sharing one backdrop) → **Compare Table** (toggle button + collapsed table with sticky header + 7 pill tabs) → **Enterprise Plans** (المركز الوطني + البزنس) → **Testimonials** (heading + 3 stats + Swiper marquee of 27 academies) → **FAQ (dark)** → **Footer (dark)** → Sticky Mobile CTA → **Signup Modal** → **Login Modal** → **Verify Code Modal** (single modal with code|password tabs) → **Onboarding Modal** → **Trial Modal** → **Payment Modal** → **Thank-You Modal**.

The FAQ + Footer form a single dark block (`bg-heading`) at the bottom of the page — separator is `border-t border-white/10`. The standalone CTA strip ("أطلق أكاديميتك") and the WhatsApp FAB were intentionally removed; do not re-add.

- **Header logo**: the floating top nav uses `<img src="assets/logo 1.png">` as the brand mark (NOT the older SVG sprite + gradient pill). The footer keeps the white-on-transparent variant `assets/white logo.png` for visibility on dark bg. Payment card-brand images live in `assets/`: `visa.png`, `Mastercard.png`, `express.png` (AmEx), `Mada.png`.
- **Academy screenshots**: each of the 27 academies in the testimonials marquee has its own image file in `assets/` named after the academy (Arabic or English — e.g. `ثابت حجازي.png`, `Owais.png`, `samar.png` for Samara's Keto Life). The JS uses `encodeURIComponent()` on each filename so Arabic + spaces work in the URL. The full mapping lives in `script.js`'s `ACADEMIES` array.
- **Tailwind config is inline** in a `<script>` block in the `<head>` and extends `theme.colors`, `theme.fontFamily.sans`, `theme.fontSize.h1..h5`, and `theme.maxWidth.container`. Editing the design system means editing that inline config + the matching CSS variables in `styles.css`.
- The 3 pricing-card CTAs carry `data-plan="starter|pro|advanced"` and `data-signup-trigger`. **The top-nav CTA also uses `data-plan="advanced" data-signup-trigger`** so clicking it opens signup with the Advanced plan preselected (same behavior as clicking the Advanced pricing card). The "دخول" trigger uses `data-login-trigger`. The "إنشاء حساب جديد" link inside Login Modal uses `id="login-to-signup"` and switches modal contexts.
- **External libraries** loaded in `<head>` (besides Tailwind):
  - **Readex Pro** font from Google Fonts (primary font, weights 300–700)
  - **Saudi Riyal font** (`@emran-alhaddad/saudi-riyal-font`) for the SAMA U+20C1 mark
  - **Swiper.js v11** (`swiper-bundle.min.css` + `.js`) — powers the testimonials marquee
  - **@lottiefiles/lottie-player** + **canvas-confetti** — used in the Thank-You modal celebration

### `styles.css`
- Layered on top of Tailwind. CSS custom properties at `:root` mirror the Tailwind theme colors — keep these two in sync when changing the palette.
- `font-family` chain on `body`: `'Readex Pro', '29LT Bukra', 'IBM Plex Sans Arabic', system-ui, ...`. Readex Pro is the primary (loaded from Google Fonts); 29LT Bukra is a commercial-license fallback (files not committed); IBM Plex was the older fallback but is no longer loaded.
- Section dividers in the source mark major systems: CTA button system (color-only hover, no shadow/lift per the user's preference), billing toggle, currency dropdown, Saudi Riyal currency, signup modal, login-method tabs, verify-code modal + 6-digit inputs, onboarding chips + progress steps + stacked-cards effect, hand-drawn annotation, skeleton loader, trial/payment/thank-you modals, infinite-grid backdrop, animated text gradient for "الأكثر طلباً", FAQ dark (chevron rotate-on-open), footer social icon buttons (`.footer-social`), **compare-plans toggle + sticky header + pill tabs + flat table + info tooltips**, **academy marquee (Swiper)** + **card hover lift**.
- Every custom keyframe animation (grid scroll, popular-text-shift, etc.) is paired with a `@media (prefers-reduced-motion: reduce)` block that disables it. Keep that pattern when adding new animations.

### `script.js`
- One IIFE, vanilla JS, no dependencies except the Swiper CDN global. State (`state.billing`, `state.currency`) persists in `localStorage` under `acad_billing` / `acad_currency`. Default is `yearly` + `USD`.
- IP-based geolocation (`detectCurrency`) is intentionally **not called** from `init()` — the function is left in the file but commented out at the call site so USD stays the default. Don't re-enable without a reason.
- Price values live in **two places**: `data-monthly-usd / data-yearly-usd / data-monthly-sar / data-yearly-sar` attributes on each `.price-amount` span, AND in the `PLANS` object near `openSignupModal()`. Change both when prices change. Current values: starter `$23/$29`, pro `$29/$39`, advanced `$99/$129` (yearly/monthly). Yearly totals: starter $276, pro $348, advanced $1,188.
- Modal open/close uses `body.modal-open` to lock background scroll. Switching contexts (Signup ↔ Login ↔ Verify ↔ Onboarding ↔ Trial ↔ Payment ↔ Thank-You) is wired so opening one closes the others first. `allModalsClosed()` helper checks every modal id before releasing the body scroll lock.
- Onboarding state lives in `onboardingState = { step, totalSteps: 3, answers: { goal, academyName, specialization, audience, firstMonthGoal, currentPlatform } }`. `goal` is initialized to `['share-knowledge']` (the default-selected first chip). Only step 1's title/subtitle is rendered to the DOM; steps 2+3 hide them.
- Trial state lives in `trialState = { billing: 'yearly' }` and is consumed by both the Trial modal (radio cards) and the Payment modal (renewal calculation).
- `init()` wires every modal: `initSignupModal`, `initLoginModal` (which also wires `initVerifyCodeModal`), `initOnboardingModal`, `initTrialModal`, `initPaymentModal`, `initThankYouModal`, plus `initInfiniteGrid` (animated hero backdrop), `initCountUp` (testimonials stats), `initAcademyMarquee` (Swiper init), `initCompareTabs`, and `initCompareToggle`.
- Date formatting uses `Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', { day, month, year })` — Arabic month names but **Latin (Western) numerals** so dates render like `16 يونيو 2026`. Don't drop the `-nu-latn` extension or numerals flip to Arabic-Indic.

## Pricing layout (Notion-inspired)

Two visually separate blocks side-by-side on desktop:
- **Block 1** (`lg:col-span-2`): white background, `#F1ECF4` border. Contains الانطلاقة + الاحترافية with a vertical `md:border-e` divider between them. Both `<article>` cards use `h-full` so the divider stretches to row height.
- **Block 2** (`pricing-card--featured`): `#F1ECF4` background, no border, single card (المتقدمة). Marked by an inline "الأكثر طلباً" badge with the `.popular-text-gradient` class (animated primary → secondary → primary gradient).

Each card structure: `header` → price row (number + "شهريًا" + `price-note` pill) → CTA → features list.

**Feature list styling**: `<ul class="space-y-4 text-h5 text-black font-medium flex-1">` — features use **pure black** (not heading) text at **medium weight (500)** with `space-y-4` (16px gap, not 12). Each `<li>` has a check SVG + text.

## Hero + Pricing shared backdrop (`.hero-pricing-wrap`)

Hero, Toggles Bar, and Pricing Cards are wrapped in one `<div class="hero-pricing-wrap relative isolate overflow-hidden bg-white">` so they share an infinite-scrolling grid backdrop. The Toggles section is `relative z-20` (raised from z-10) so the currency dropdown can layer above the pricing-cards section (which is `relative z-10`). Without this z-bump, the dropdown options render BEHIND the pricing cards.

## Hero copy

Three elements:

1. **Earnings badge** (above headline): pill with `bg-[#F5F4F6]`, `rounded-full`, black text + trending-up SVG. Content: `<span dir="ltr">+$250K</span> إيرادات عملاؤنا`. The `dir="ltr"` wrap keeps `+$250K` from getting bidi-mangled.
2. **Headline** (`<h1>`): two `<span class="block">` lines. Sizes: `text-[22px] sm:text-[36px] lg:text-[52px]` (mobile is small enough to fit 2 lines on a 375px screen). Current copy:
   - Line 1: `ابدأ تجربــتــك مجــــانًا، ثم ادفــــــــع` (kashida-stretched)
   - Line 2: `<span class="popular-text-gradient">$1 لأول شهر</span> مع كامل الميزات` (no kashida in "الميزات" — user explicitly trimmed it)
3. **Hand-drawn annotation arrow** (above the billing toggle, points at سنوي): tip aligned to سنوي's horizontal center via `left-10` offset.

## Kashida convention (`ـ` U+0640)

Tatweel is used selectively for elegant Arabic typographic stretching (hero, FAQ heading, "أكاديميات" in testimonials heading, footer link text, etc.). When adding new copy, insert tatweel **between connecting letters only** (`ـ` never joins after non-connecting letters like ر, د, ز, و, ا). Don't strip kashidas during refactors.

## Headings (H2 system)

All section H2 headings use a **unified scale**: `text-[28px] sm:text-[36px]` (28px on mobile, 36px on desktop). Applies to: "مقارنة الخطــــط" (compare table, custom class `.compare-section-heading`), "مئات المواقع بُنيت مع أكاديميـــــــــات" (testimonials), "الأســـــــئلة الشــــــائعة" (FAQ).

## Compare Plans section (`#compare`)

Default state: **table hidden**, only a pill toggle button is visible (`#compare-toggle`). Clicking it expands the table and rotates the chevron 180°; clicking again collapses. The button always stays visible.

When expanded, the wrapper (`#compare-table-wrapper`) contains three sticky regions stacked:
1. **Sticky plan header** (`.compare-sticky-header`, `position: sticky; top: 0; z-index: 30`):
   - 4-column grid (`minmax(160px, 1.6fr) 1fr 1fr 1fr`).
   - Leftmost cell (right in RTL) holds the **section heading** "مقارنة الخطــــط" — moved INSIDE the sticky header so it persists during scroll.
   - 3 plan cells: name + price (snapshot from `state` — shows yearly TOTAL when yearly billing, monthly when monthly) + CTA button. Period label `<span data-plan-period>` switches "/ سنويًا" ↔ "/ شهريًا" via JS.
2. **Sticky tabs strip** (`.compare-tabs-wrap`, `position: sticky; top: <header height>` — JS sets `top` dynamically via `positionCompareTabs()`). 7 pill tabs in order: **رسوم وعمولات** (default active), المحتوى, الحسابات, مميزات المنصة, التدريب التفاعلي, التسويق والمبيعات, بوابة الدفع. Active pill: primary bg + white text + weight 700.
3. **Table** (`.compare-table-scroll`): flat (no outer border, no border-radius) — only horizontal hairlines between rows. **Feature label `th[scope="row"]`**: 15px, weight 600, heading color (PROMINENT). **Cell values `td`**: 13px, weight 400, text-muted color (SECONDARY). Pro column has NO featured highlight.

**Tab click behavior**: JS scrolls the sticky-header back to the viewport top (`scrollIntoView({block:'start',behavior:'smooth'})`) IF the header is currently above 60% viewport height — prevents the "table shrinks → user dumped on next section" issue when switching from a tall tab (مميزات المنصة, 20 rows) to a short one (التدريب التفاعلي, 3 rows).

**Tooltips** (`.cmp-tip`): info icon next to certain feature names (عمولة أكاديميات, بوابة دفع أكاديميات, طلبات سحب الأرباح). Pure CSS — `:hover` reveals a `.cmp-tip__bubble` positioned above the icon with `position: absolute`. White text on heading-color bg, max-width 240px.

**Commission rates** (`رسوم وعمولات` tab): `10% + $1` / `5% + $1` / `بدون عمولة` for starter/pro/advanced. These were moved from the older `بوابة الدفع` tab. Also in this tab: credit card sales fee (3.9% + 30¢), transfer fees ($15 + bank fee), withdrawal request behavior.

## Enterprise / Add-on section (`#enterprise-plans`)

Background `#F9F7FB` (light lavender). One Thinkific-inspired **wide add-on card** + a one-line tagline below it. The earlier `باقة البزنس` standalone block was deleted — the tagline links to "تواصل معنا" instead.

### Add-on card (`.addon-card`)

Wide block with:
- **Transparent background** (no white fill — lets the section lavender show through)
- 1.5px solid primary-purple border (`var(--color-primary)` = `#6B3A8C`)
- 24px border-radius, generous padding (36/48px)
- 2-column grid inside: heading + description + CTA on the right (RTL start), features on the left

**Floating label** (`.addon-card__label`): the word "إضافات" sits on the top edge of the card, transform: translateY(-50%). Background matches the SECTION color (`#F9F7FB`) so it "punches through" the purple border cleanly — no white fill. Text in primary purple.

**Heading**: "المركز الوطني" (NOT "إضافة المركز الوطني" — the word "إضافة" was removed since the floating label already says "إضافات"). 24px, font-medium (500), heading color.

**Description**: `text-h4 text-black font-normal` (pure black, weight 400) — copy: "متاحة لمشتركي الباقات الأساسية (الانطلاقة، الاحترافية، المتقدمة)".

**CTA** (`.addon-card__cta`): primary purple bg, white text, 12px radius, "تواصل مع فريق المبيعات".

**Features** (`.addon-card__features`): **2-column grid on desktop** (`grid-template-columns: 1fr 1fr`), 1-column on mobile (< 768px). Each item: 14px, weight 400, primary-purple ✓ check icon (20×20px). 9 features total (covering surveys, AR/EN support, ticket system, virtual classrooms, secure auth, progress tracking, plagiarism detection, accessibility, program templates).

### Tagline (after the add-on)

Centered paragraph below the add-on card:
> أكاديميات تقدم حلولاً مخصصة للشركات. **تواصل معنا** للحصول على عرض سعر حسب احتياجك.

The "تواصل معنا" text is an inline `<a>` styled with `text-primary underline decoration-from-font underline-offset-4` — primary purple + underlined. This replaces the deleted business-plan card.

## Testimonials section (`#testimonials`)

Background `#F3F1EC` (warm beige) with **`border-radius: 60px` on all corners** — creates a strong rounded rectangle that visually separates this section from neighbors. Three stacked elements:
1. **Heading**: "مئات المواقع بُنيت مع أكاديميـــــــــات" — centered, h2 (28px/36px). Has `mb-16 lg:mb-20` (large gap to stats below).
2. **3 stats row** (in one row, `flex-wrap items-start justify-center`): إيرادات عملاؤنا (+$250K), أكاديمية مفعلة (+500), نجم ومؤثر اختار أكاديميات (+27). Each uses `.count-up` for animated counting on scroll. Labels are `text-h4` (16px) for readability.
3. **Swiper marquee** (full-bleed): see below.

### Academy marquee — Swiper.js

Powered by **Swiper.js v11** (CDN bundle). 27 academy cards, continuous auto-scroll (premium marquee feel, NOT click-paginated).

HTML: `.academy-marquee-wrap > .swiper.academy-swiper > .swiper-wrapper > a.swiper-slide.academy-card`.

Each card = browser mockup ONLY (no name caption — user removed it):
- `.academy-card__browser` (rounded white card with shadow)
  - `.academy-card__chrome` (light bar with 3 dots + URL text, `dir="ltr"`)
  - `<img class="academy-card__shot">` (lazy-loaded screenshot)

**Swiper config** (in `initAcademyMarquee`):
```js
{
  loop: true,
  loopAdditionalSlides: 5,
  slidesPerView: 'auto',
  spaceBetween: 24,
  freeMode: true,           // continuous drift (no slide snapping)
  speed: 5000,              // slow transition = marquee feel
  allowTouchMove: true,
  grabCursor: true,
  autoplay: {
    delay: 0,               // delay:0 + slow speed = continuous motion
    disableOnInteraction: false,
    pauseOnMouseEnter: true,
  },
}
```

The combination `freeMode + delay:0 + speed:5000` is the Swiper recipe for a true continuous marquee (alternative configs snap card-by-card).

**No prev/next navigation buttons** — they were removed because freeMode + autoplay doesn't pair cleanly with manual nav (freeMode disables snap, which Swiper's nav relies on). Hover-pause + touch-swipe provide all the user controls.

CSS overrides Swiper's default easing:
```css
.academy-swiper .swiper-wrapper { transition-timing-function: linear !important; }
```
This makes the continuous marquee scroll feel constant, not ease-in-out.

**Card hover**: `.academy-card:hover { transform: translateY(-8px); }` with cubic-bezier transition. Each card lifts on hover independently of the wrapper's marquee transform.

**Mask**: `.academy-swiper` has a horizontal `mask-image: linear-gradient(to left, transparent 0, #000 5%, #000 95%, transparent 100%)` so cards fade in/out at the viewport edges.

**ACADEMIES array** in `script.js`: each entry has `{ name, url, image }`. The `image` field is just the filename (e.g. `"Owais.png"` or `"دال أكاديمي.png"`); JS prepends `assets/` + URL-encodes the name. Drop a new image into `assets/` and update the array's image field — that's it.

If per-academy screenshot is missing, use `sahel.png` as fallback (e.g. earlier placeholder pattern). For "Samara's Keto Life" the image is `samar.png`.

## Count-up animation (`.count-up`)

Used on the 3 testimonials stats. Each numeric span carries `data-count-to="N"`; `initCountUp()` animates from 0 to N over 2.4s with **ease-out quart** for a smoother feel than cubic. Triggers when the element's top crosses 75% of viewport.

- Uses scroll listener + `getBoundingClientRect`, NOT `IntersectionObserver` (IO doesn't fire in the MCP preview).
- After all elements have animated, the scroll listener is removed.
- Respects `prefers-reduced-motion` (jumps straight to the final value).

## Dark footer block (FAQ + Footer)

Note: the previous "CTA Strip" + "Academies Showcase" sections were removed. The bottom of the page is now just FAQ + Footer, both `bg-heading` (#311A40) with a `border-t border-white/10` separator. All text colors use white at `/85` or higher.

### FAQ (`#faq`)

`bg-heading text-white py-16 lg:py-20`, `max-w-3xl` centered. Heading: `الأســـــــئلة الشــــــائعة` (with kashida).

Each item is `<details class="faq-item-dark border-b border-white/10">`:
- Question span uses `text-h4 font-medium` (16px, **weight 500** — explicitly NOT semibold/600 per user request).
- Chevron flip on open via pure CSS (`.faq-item-dark[open] .faq-chev { transform: rotate(-180deg) }`).
- Answer paragraphs use `text-h5 text-white/70 leading-relaxed`.

### Footer

`bg-heading text-white border-t border-white/10`, 5-column grid on `md+`:

| Col span | Visual position (RTL) | Content |
|---|---|---|
| `md:col-span-3` | right (start) | **White logo** (`assets/white logo.png`) + 2 stacked app-store buttons (152px each, equal width) |
| `md:col-span-2` | | الخدمـات links |
| `md:col-span-2` | | الدعـم links |
| `md:col-span-2` | | مصـادر أخرى links |
| `md:col-span-3` | left (end) | **Newsletter** signup |

- **الخدمـات links**: دورات تدريبية, تقديم استشـارات, باقات, محتوى رقمي (NOT دورات أونلاين / دورات مسجّلة — these were removed and merged into "دورات تدريبية").
- **App store buttons**: black pills with `border-white/35`. Apple SVG + multi-color Google Play triangle. Both buttons forced to identical width (152px) via `w-[152px]` on the parent + `flex` (not `inline-flex`) on the children.
- **Social row** below the columns uses `.footer-social` helpers. **Each link points to the real account** with `target="_blank" rel="noopener noreferrer"`:
  - Facebook: https://www.facebook.com/acadimiat/
  - Instagram: https://www.instagram.com/acadimiatgcc/
  - X: https://x.com/acadimiatgcc
  - LinkedIn: https://www.linkedin.com/company/acadimiatgcc/
  - Threads: https://www.threads.com/@acadimiatgcc/

## Auth modals — Signup, Login, Verify Code

The auth flow uses **three modals**: `#signup-modal`, `#login-modal`, `#verify-code-modal`. The older standalone `#login-method-modal` was removed and merged into `#verify-code-modal` (which now hosts both code-only and code|password tabs depending on context).

All inputs/buttons share `h-[52px]` for rhythm.

### Signup Modal (`#signup-modal`)
Logo → "أنشئ حسابًا في ثوانٍ" → Google + Apple buttons (stacked) → divider → email field → "متابعة التسجيل" button (`#signup-continue-btn`) → terms microcopy.

**`#signup-continue-btn`** is disabled by default; enables when email is ≥4 chars AND contains `@` (validation runs on every `input` via `refreshContinueBtn()`).

**Clicking "متابعة التسجيل" opens the VERIFY-CODE MODAL** (not directly the onboarding), in `mode='signup'` — see Verify modal below. The selected plan from the originally-clicked pricing card stays in `signupModal.dataset.selectedPlan`.

**SSO buttons (Google/Apple)** in signup modal skip verification and go directly to onboarding (the provider already verified them).

### Login Modal (`#login-modal`)
Logo → "أهلًا بعودتك" → 3-button SSO row (Google + Apple + **Passkey**) → divider → email-or-phone floating-label input (`#login-identifier`) → "تسجيل الدخول" button → switch-to-signup link → "هل بحاجة لمساعدة؟" WhatsApp link.

**Login "تسجيل الدخول" routing**:
- If identifier contains `@` → opens Verify Code Modal with `mode='login'`, `channel='email'` → tabs visible (code | password).
- Otherwise (treated as phone) → opens Verify Code Modal with `mode='login'`, `channel='whatsapp'` → **tabs hidden** (no password tab for phone, since they haven't set one).

The **Passkey** button (`#login-passkey-btn`) is always visible — `detectPasskeySupport()` only writes the capability to `dataset.supportsPasskey`, never hides the button. The click handler should branch on that dataset to show a fallback when biometrics aren't available.

### Verify Code Modal (`#verify-code-modal`) — unified
Single modal that handles all post-identifier verification:

Header: logo + h2 "تحقّق من هويتك".

Below the header: **tabs** (`#verify-tabs` with `.login-method-tabs` class) — `الدخول بكود التحقق` (default active) + `الدخول بكلمة المرور`. The tabs are HIDDEN when:
- `channel === 'whatsapp'` (phone path — no password possible)
- `mode === 'signup'` (signup never asks for an existing password)

Two panels (`[data-verify-panel="code"]` + `[data-verify-panel="password"]`):

**Code panel** (default):
- Message: "أرسلنا كود التحقق المكوّن من 6 أرقام إلى البريد {email}" OR "...إلى رقم الموبايل {phone} عبر واتساب" (per channel).
- "تغيير البريد" / "تغيير رقم الموبايل" link → closes verify modal and reopens login modal.
- **6 square digit inputs** (`.verify-code-digit`, **56×56px**, 44×44 on mobile). Auto-advance to next input on type, Backspace navigates back, paste of 6 digits distributes across boxes.
- **Auto-submit when all 6 filled** — `triggerAutoSubmit()` fires `submitVerifyCode()` without waiting for button click.
- Resend timer (`#verify-resend-seconds`) counts 45s → 0, then shows "إعادة الإرسال" button.
- "تحقّق" button (`#verify-code-submit`) — also manually submits; shows loading spinner during the 900ms simulated verify.

**Password panel** (email login only):
- Single password input with floating label + "هل نسيت كلمة المرور؟" link.
- "تسجيل الدخول" button submits; Enter key in input also submits.

After successful verify:
- If `mode === 'signup'` → opens onboarding modal.
- If `mode === 'login'` → calls `navigateToDashboard()`.

The active tab styling is scoped under `#verify-code-modal .login-method-tab.is-active` (white bg, **pure black text**, weight 700, soft shadow + outline) — needs higher selector specificity than the base `.login-method-tab` rule because Tailwind preflight + global button styling interfere.

## Onboarding Modal (`#onboarding-modal`)

3-card survey shown after signup verification. JS toggles `.hidden` on `[data-screen="1..3"]` based on `onboardingState.step`.

**Cards**:
1. **هيا نبدأ بمعلوماتك** — goal chips (multi, first chip `share-knowledge` pre-selected) + academy name input (required).
2. (no title) — specialization chips (single) + audience size chips (single).
3. (no title) — first-30-day goal chips (single) + current platform chips (single).

**Layout rules**:
- Card has `min-h-[620px] flex flex-col` so all 3 steps share the same height.
- Title + subtitle only on Card 1; JS sets `display: none` on them when `step !== 1`.
- Two-question pairs use `mb-8` between them (per user request).
- Required-name marker is `(يجب إدخال الاسم)` in muted gray, NOT a red asterisk.

**Footer controls**:
- `#onboarding-prev` ("السابق"): hidden on Card 1, advances back one step.
- `#onboarding-skip-all` ("تخطي الكل"): jumps `step` to `totalSteps`, **then opens the Trial modal** (does NOT just close the flow — skipping the questions still leads to checkout). Hidden on Card 1.
- `#onboarding-next` ("التالي" / "إنهاء"): advances; label switches to "إنهاء" on the last card; gated on Card 1 by `academyName.length >= 2`.

### Floating label pattern

Used by all text inputs across auth/onboarding modals:

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

Key points: `placeholder=" "` (a single space) is required so `:placeholder-shown` works correctly.

## Post-onboarding flow: Trial → Payment → Thank-You

Three modals run end-to-end after onboarding. They share the `.signup-modal` envelope.

### Trial Modal (`#trial-modal`)

Two-column grid: pricing right (RTL first), timeline left. The post-trial charge is **$1** (intro offer, `introAmount = state.currency === 'USD' ? 1 : 4`). Don't swap it to the plan's real price.

### Payment Modal (`#payment-modal`)

Two-column top (card form right, timeline left) + full-width add-on row at the bottom.

- Card form: number / expiration `MM/YY` / CVV. All inputs are `dir="ltr"`. Card-brand icon swaps when typing (Visa for `4*`, Mastercard for `5*`, AmEx for `34/37`, Mada for known BINs — Mada check runs first).
- CVV info button (`#payment-cvv-info`) toggles a CSS-only popover.
- **No card validation** — submit always proceeds. The `validateCardForm` / `initCardValidation` / `cardNumberHasValidLength` / `validExpiry` / `validCvv` / `setFieldError` helpers still exist as dead code but are not called (user explicitly asked for no validation).
- Add-on row: $99 one-time add-on with a checkbox that updates the renewal note.
- "ابدأ تجربتك بـ $1" → closes Payment, opens Thank-You.

### Thank-You Modal (`#thankyou-modal`)

Single-column `max-w-md`. Lottie + canvas-confetti fire when opened. "الذهاب إلى لوحة التحكم" → `navigateToDashboard()` (sets `location.hash = 'dashboard'`).

## Currency rendering (important)

The Saudi Riyal symbol uses the **official SAMA 2024 mark** (Unicode U+20C1) via the `@emran-alhaddad/saudi-riyal-font` CDN package. DOM appearance:

```html
<span class="sar-icon icon-saudi_riyal_new" aria-label="ريال سعودي"></span>
```

The glyph is drawn by a font `::after` pseudo. Don't replace with `﷼` (U+FDFC, legacy). `formatPrice()` in `script.js` returns HTML so callers use `innerHTML = ...`. The symbol has a negative `margin-inline-start` so it sits tight against digits.

## Compare-table price snapshot

`snapshotPlanHeaderPrices()` (in `script.js`) updates the sticky-header column prices whenever `renderPrices()` runs (= whenever billing/currency toggles fire). Display rule:
- `billing === 'yearly'` → show **annual total** ($276 / $348 / $1,188 in USD; SAR equivalents) + period label "/ سنويًا".
- `billing === 'monthly'` → show monthly price ($29 / $39 / $129) + "/ شهريًا".

This is intentionally DIFFERENT from the main pricing cards (which always show per-month, just discounted in yearly mode).

## RTL conventions

- `<html lang="ar" dir="rtl">` — every layout decision assumes RTL.
- Use Tailwind logical-direction utilities (`border-s`, `border-e`, `ms-*`, `me-*`) instead of `border-l`/`border-r`.
- Anything that has to align numerically (prices, phone numbers) is wrapped in `<span dir="ltr">` or `unicode-bidi: isolate`.

## Button hover policy (user-mandated)

CTAs use **color-only hover** — no transform, no shadow, no lift, no scale. Just `filter: brightness(0.96)` for a subtle darken (and `0.92` on `:active`). If you find yourself adding `transform` or `box-shadow` to a button hover, you're undoing this. The `.btn-premium` class still exists for transition setup but no longer lifts.

**Exceptions** (intentional): the academy cards in the marquee DO lift on hover (`translateY(-8px)`) — that's a card-hover treatment, not a button.

## Strategic plan

The full product strategy lives at `C:\Users\pc\.claude\plans\rosy-meandering-snail.md`. Read it before making product-level changes (pricing values, trial length, copy direction). When in doubt, the live code wins, but check the plan for rationale.

## Editing notes that have bitten us before

- The Edit tool sometimes fails on lines that mix Arabic + JS template literals (invisible bidi marks). If `old_string` doesn't match despite looking identical, shorten the match to just the Latin/code portion.
- The linter rewrites `index.html` formatting after edits. After it runs, re-read the file before the next Edit.
- The preview server (`serve`) caches aggressively. After a CSS/JS change, use `preview_eval('location.replace(location.pathname + "?bust=" + Date.now())')` to force a fresh load before testing.
- The preview browser (headless Chrome inside MCP) reports no platform authenticator → `isUserVerifyingPlatformAuthenticatorAvailable()` returns `false`. Passkey detection must only inform behavior, not visibility.
- **`requestAnimationFrame` is throttled to 0 inside the MCP preview**. Same goes for `setTimeout(16)` in some background-ish contexts — it can fire much slower than expected. The JS academy marquee was rewritten to use Swiper (which uses rAF internally) precisely because reliable per-frame animation in this preview is impossible. For verification, check internal state (`swiper.autoplay.running`, `swiper.realIndex`, etc.) rather than measuring transform movement.
- **Tailwind preflight beats single-class CSS specificity**. The Tailwind CDN injects preflight rules AFTER `styles.css` loads, so a rule like `.popular-badge__check-box { background: #fff }` can lose. Increase specificity with a parent selector (e.g. `.payment-addon .payment-addon__checkbox:checked + .payment-addon__check-box { ... }`). The active-tab style in the verify modal uses `#verify-code-modal .login-method-tab.is-active` for this reason.
- Modal screenshots can time out in the preview (`preview_screenshot` hangs ~30s) when `backdrop-blur` is applied to a fullscreen backdrop. Use `preview_inspect` + `preview_eval` to verify modal state instead — they read DOM/CSS without rasterizing.
- **Swiper navigation with external buttons**: if you re-add prev/next, pass DOM references (`prevEl: prevBtnEl`, `nextEl: nextBtnEl`) NOT selector strings. Swiper resolves string selectors against the swiper container only, so buttons that live outside `.swiper` won't bind via selectors.
- **Swiper overwrites `aria-label` on slides** (uses it for "1 / 27", "2 / 27", etc.). Don't rely on `aria-label` to find specific slides — use `href` or other attributes.
