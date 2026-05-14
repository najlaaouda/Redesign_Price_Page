/* ═══════════════════════════════════════════════════════
   أكاديميات — Pricing Page Interactions
   Vanilla JS, no dependencies
   ═══════════════════════════════════════════════════════ */

(() => {
  'use strict';

  /* ─── State ─── */
  const state = {
    billing: localStorage.getItem('acad_billing') || 'yearly',
    currency: localStorage.getItem('acad_currency') || 'USD',
  };

  /* ─── DOM refs ─── */
  const billingButtons = document.querySelectorAll('.billing-toggle');
  const currencyButtons = document.querySelectorAll('.currency-toggle');
  const priceAmounts = document.querySelectorAll('.price-amount');
  const pricePeriods = document.querySelectorAll('.price-period');
  const priceNotes = document.querySelectorAll('.price-note');
  const expandButtons = document.querySelectorAll('.expand-toggle');
  const mobileBottomCta = document.getElementById('mobile-bottom-cta');
  const pricingSkeleton = document.getElementById('pricing-skeleton');
  const pricingGrid = document.getElementById('pricing-grid');

  /* ───────────────────────────────────────────────────
     LOADING STATE — show skeletons briefly on initial load
     simulates real fetch from pricing API
     ─────────────────────────────────────────────────── */
  function simulateInitialLoad() {
    // Show skeleton, hide grid
    if (pricingSkeleton && pricingGrid) {
      pricingGrid.classList.add('hidden');
      pricingSkeleton.classList.remove('hidden');
      pricingSkeleton.classList.add('grid');

      // Reveal real cards after short delay
      setTimeout(() => {
        pricingSkeleton.classList.add('hidden');
        pricingSkeleton.classList.remove('grid');
        pricingGrid.classList.remove('hidden');
      }, 600);
    }
  }

  /* ───────────────────────────────────────────────────
     CURRENCY DETECTION (IP-based, with localStorage memory)
     ─────────────────────────────────────────────────── */
  async function detectCurrency() {
    // Respect user override stored in localStorage
    if (localStorage.getItem('acad_currency')) return;

    try {
      // Lightweight IP geolocation API (no key required)
      const res = await fetch('https://ipapi.co/country_code/', {
        signal: AbortSignal.timeout(3000),
      });
      const country = (await res.text()).trim().toUpperCase();
      const gulfCountries = ['SA', 'AE', 'KW', 'QA', 'BH', 'OM'];

      if (gulfCountries.includes(country)) {
        state.currency = 'SAR';
        renderTogglesState();
        renderPrices();
      }
    } catch {
      /* Silent fail — keep default USD */
    }
  }

  /* ───────────────────────────────────────────────────
     PRICE RENDERING
     ─────────────────────────────────────────────────── */
  function getAttrForState(el) {
    const key = `${state.billing}-${state.currency.toLowerCase()}`;
    return el.dataset[toCamel(key)];
  }
  function toCamel(s) {
    return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  }

  // Saudi Riyal symbol SVG (uses sprite from index.html)
  // Saudi Riyal Symbol — official SAMA 2024 mark via @emran-alhaddad/saudi-riyal-font
  // The ::after pseudo on .icon-saudi_riyal_new renders U+20C1 in the SAMA font.
  const SAR_SYMBOL = '<span class="sar-icon icon-saudi_riyal_new" aria-label="ريال سعودي"></span>';

  function formatPrice(amount) {
    const num = Number(amount).toLocaleString('en-US');
    if (state.currency === 'USD') return `$${num}`;
    return `${num} ${SAR_SYMBOL}`;
  }

  function renderPrices() {
    priceAmounts.forEach((el) => {
      el.classList.add('is-updating');
      setTimeout(() => {
        const val = getAttrForState(el);
        el.innerHTML = formatPrice(val);
        el.classList.remove('is-updating');
      }, 120);
    });

    // Period label
    pricePeriods.forEach((el) => {
      el.textContent = 'شهريًا';
    });

    // Keep the compare-table column headers in sync with the toggles
    snapshotPlanHeaderPrices();

    // Pill below price: "تدفع سنويًا $276" — visible only in yearly mode
    const yearlyTotals = {
      // USD per-month → yearly total
      '23': 276, '29': 348, '99': 1188,
      // SAR per-month → yearly total (3.75 fx)
      '86': 1035, '109': 1305, '371': 4455,
    };
    priceNotes.forEach((el) => {
      const card = el.closest('.pricing-card');
      const amountEl = card?.querySelector('.price-amount');
      if (!amountEl) return;
      const val = getAttrForState(amountEl);

      if (state.billing === 'yearly') {
        const total = yearlyTotals[val] ?? Number(val) * 12;
        const totalFormatted =
          state.currency === 'USD'
            ? `$${total.toLocaleString('en-US')}`
            : `${total.toLocaleString('en-US')} ${SAR_SYMBOL}`;
        el.innerHTML = `${totalFormatted} تدفع سنويًا`;
        el.style.display = '';
      } else {
        el.style.display = 'none';
      }
    });
  }

  /* ───────────────────────────────────────────────────
     TOGGLES STATE
     ─────────────────────────────────────────────────── */
  const currencyTriggerLabel = document.getElementById('currency-trigger-label');
  const SAR_LABEL_HTML = 'SAR <span class="sar-icon icon-saudi_riyal_new" aria-label="ريال سعودي"></span>';

  function renderTogglesState() {
    billingButtons.forEach((btn) => {
      const active = btn.dataset.billing === state.billing;
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    currencyButtons.forEach((btn) => {
      const active = btn.dataset.currency === state.currency;
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    if (currencyTriggerLabel) {
      currencyTriggerLabel.innerHTML = state.currency === 'USD' ? 'USD&nbsp;$' : SAR_LABEL_HTML;
    }
  }

  /* ───────────────────────────────────────────────────
     EVENT BINDINGS — Toggles
     ─────────────────────────────────────────────────── */
  billingButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      state.billing = btn.dataset.billing;
      localStorage.setItem('acad_billing', state.billing);
      renderTogglesState();
      renderPrices();
    });
  });

  currencyButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      state.currency = btn.dataset.currency;
      localStorage.setItem('acad_currency', state.currency);
      renderTogglesState();
      renderPrices();
      closeCurrencyMenu();
    });
  });

  /* Currency dropdown toggle */
  const currencyTrigger = document.getElementById('currency-trigger');
  const currencyMenu = document.getElementById('currency-menu');
  const currencyWrapper = document.getElementById('currency-wrapper');

  function openCurrencyMenu() {
    if (!currencyMenu || !currencyTrigger) return;
    currencyMenu.classList.remove('hidden');
    currencyTrigger.setAttribute('aria-expanded', 'true');
  }
  function closeCurrencyMenu() {
    if (!currencyMenu || !currencyTrigger) return;
    currencyMenu.classList.add('hidden');
    currencyTrigger.setAttribute('aria-expanded', 'false');
  }
  if (currencyTrigger) {
    currencyTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = currencyTrigger.getAttribute('aria-expanded') === 'true';
      if (isOpen) closeCurrencyMenu();
      else openCurrencyMenu();
    });
  }
  document.addEventListener('click', (e) => {
    if (currencyWrapper && !currencyWrapper.contains(e.target)) closeCurrencyMenu();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCurrencyMenu();
  });

  /* ───────────────────────────────────────────────────
     EXPANDABLE FEATURES ("عرض المزيد")
     ─────────────────────────────────────────────────── */
  expandButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.pricing-card');
      if (!card) return;
      const items = card.querySelectorAll('.expandable-item');
      const isExpanded = btn.dataset.expanded === 'true';

      items.forEach((item, i) => {
        if (isExpanded) {
          item.classList.add('hidden');
        } else {
          item.classList.remove('hidden');
          item.style.animationDelay = `${i * 40}ms`;
        }
      });

      btn.dataset.expanded = String(!isExpanded);
      btn.textContent = isExpanded ? 'عرض المزيد ↓' : 'عرض أقل ↑';
    });
  });

  /* (Compare-table toggle handler moved to initCompareToggle below — search this file.) */

  /* ───────────────────────────────────────────────────
     FAQ — single open at a time (optional UX nicety)
     ─────────────────────────────────────────────────── */
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (item.open) {
        faqItems.forEach((other) => {
          if (other !== item) other.open = false;
        });
      }
    });
  });

  /* ───────────────────────────────────────────────────
     MOBILE STICKY BOTTOM CTA — show after scroll
     ─────────────────────────────────────────────────── */
  if (mobileBottomCta) {
    let lastScrollY = 0;
    const threshold = 400;

    window.addEventListener(
      'scroll',
      () => {
        const y = window.scrollY;
        const heroHeight = document.querySelector('section')?.offsetHeight || 600;

        // Show CTA after scrolling past hero, hide near footer
        const nearFooter = y + window.innerHeight > document.body.scrollHeight - 200;

        if (y > heroHeight - 100 && !nearFooter) {
          mobileBottomCta.classList.add('visible');
        } else {
          mobileBottomCta.classList.remove('visible');
        }

        lastScrollY = y;
      },
      { passive: true }
    );
  }

  /* ───────────────────────────────────────────────────
     MAGNETIC BUTTON EFFECT — primary CTAs
     subtle, premium, spring-like
     ─────────────────────────────────────────────────── */
  function initMagneticButtons() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(hover: none)').matches) return; // skip touch devices

    const magnets = document.querySelectorAll('.btn-magnetic');
    magnets.forEach((el) => {
      let raf = 0;
      const strength = 0.18; // gentle pull
      const onMove = (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.style.transform = `translate3d(${x * strength}px, ${y * strength - 2}px, 0) scale(1.03)`;
        });
      };
      const onLeave = () => {
        cancelAnimationFrame(raf);
        el.style.transform = '';
      };
      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', onLeave);
    });
  }

  /* ───────────────────────────────────────────────────
     MOBILE MENU TOGGLE
     ─────────────────────────────────────────────────── */
  function initMobileMenu() {
    const toggle = document.getElementById('mobile-menu-toggle');
    const menu = document.getElementById('mobile-menu');
    if (!toggle || !menu) return;

    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('hidden') === false;
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    // Close on link click
    menu.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        menu.classList.add('hidden');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ───────────────────────────────────────────────────
     SIGNUP MODAL — open on plan CTA, populate sidebar
     ─────────────────────────────────────────────────── */
  const PLANS = {
    starter: {
      name: 'الانطلاقة',
      monthlyUsd: 29, yearlyUsd: 23,
      monthlySar: 109, yearlySar: 86,
      yearlyTotalUsd: 276, yearlyTotalSar: 1035,
      features: [
        'دورة تدريبية واحدة',
        'جلسة استشارة واحدة',
        'منتج رقمي واحد',
        'حتى 500 مشترك',
        '5 جيجابايت تخزين',
      ],
    },
    pro: {
      name: 'الاحترافية',
      monthlyUsd: 39, yearlyUsd: 29,
      monthlySar: 146, yearlySar: 109,
      yearlyTotalUsd: 348, yearlyTotalSar: 1305,
      features: [
        '5 دورات منشورة',
        '10 جلسات منشورة',
        'منتجات رقمية غير محدودة',
        'حتى 2,000 مشترك',
        '100 جيجابايت تخزين',
      ],
    },
    advanced: {
      name: 'المتقدمة',
      monthlyUsd: 129, yearlyUsd: 99,
      monthlySar: 484, yearlySar: 371,
      yearlyTotalUsd: 1188, yearlyTotalSar: 4455,
      features: [
        'دورات وجلسات بلا حدود',
        'مشتركون وفيديوهات بلا حدود',
        'تخزين غير محدود',
        'تكامل Zapier وبوابات الدفع',
        '5 حسابات مشرفين + دومين مخصّص',
      ],
    },
  };

  function openSignupModal(planKey) {
    const modal = document.getElementById('signup-modal');
    if (!modal) return;
    // Remember selected plan for later steps (checkout, etc.)
    if (planKey) modal.dataset.selectedPlan = planKey;
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    setTimeout(() => modal.querySelector('button.signup-method')?.focus(), 50);
  }

  function closeSignupModal() {
    const modal = document.getElementById('signup-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    document.body.classList.remove('modal-open');
  }

  function initSignupModal() {
    document.querySelectorAll('[data-signup-trigger]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openSignupModal(btn.dataset.plan);
      });
    });
    document.querySelectorAll('[data-signup-close]').forEach((el) => {
      el.addEventListener('click', closeSignupModal);
    });
  }

  /* ───────────────────────────────────────────────────
     LOGIN MODAL — Passkey-first auth for returning users
     ─────────────────────────────────────────────────── */
  function openLoginModal() {
    const modal = document.getElementById('login-modal');
    if (!modal) return;
    // Close signup if it was open (switch contexts)
    closeSignupModal();
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    setTimeout(() => modal.querySelector('#login-passkey-btn')?.focus(), 50);
  }
  function closeLoginModal() {
    const modal = document.getElementById('login-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    document.body.classList.remove('modal-open');
  }

  async function detectPasskeySupport() {
    const btn = document.getElementById('login-passkey-btn');
    if (!btn) return;
    // Always visible; capability is stored in dataset for click-time fallback messaging.
    const apiAvailable =
      window.PublicKeyCredential &&
      typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';
    if (!apiAvailable) {
      btn.dataset.supportsPasskey = 'false';
      return;
    }
    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      btn.dataset.supportsPasskey = available ? 'true' : 'false';
    } catch {
      btn.dataset.supportsPasskey = 'false';
    }
  }

  function initLoginModal() {
    document.querySelectorAll('[data-login-trigger]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        openLoginModal();
      });
    });
    document.querySelectorAll('[data-login-close]').forEach((el) => {
      el.addEventListener('click', closeLoginModal);
    });
    // Switch from login → signup
    document.getElementById('login-to-signup')?.addEventListener('click', (e) => {
      e.preventDefault();
      closeLoginModal();
      openSignupModal('pro');
    });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const signupOpen = !document.getElementById('signup-modal')?.classList.contains('hidden');
      const loginOpen = !document.getElementById('login-modal')?.classList.contains('hidden');
      const verifyOpen = !document.getElementById('verify-code-modal')?.classList.contains('hidden');
      if (verifyOpen) closeVerifyCodeModal();
      else if (signupOpen) closeSignupModal();
      else if (loginOpen) closeLoginModal();
    });
    // Continue button — route by identifier type
    const loginSubmit = document.querySelector('#login-modal button.login-method.w-full');
    loginSubmit?.addEventListener('click', () => {
      const input = document.getElementById('login-identifier');
      const value = (input?.value || '').trim();
      if (!value) {
        input?.focus();
        return;
      }
      // Email path: contains "@" → verify modal with tabs (code | password)
      // Phone path: → verify modal with code only (tabs hidden), channel = whatsapp
      if (/@/.test(value)) {
        closeLoginModal();
        openVerifyCodeModal(value, 'email');
      } else {
        const phone = value.replace(/[^\d+]/g, '');
        closeLoginModal();
        openVerifyCodeModal(phone, 'whatsapp');
      }
    });
    detectPasskeySupport();
    initVerifyCodeModal();
  }

  function switchVerifyTab(target) {
    document.querySelectorAll('#verify-code-modal .login-method-tab').forEach((t) => {
      const active = t.dataset.verifyTab === target;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    document.querySelectorAll('#verify-code-modal [data-verify-panel]').forEach((p) => {
      p.classList.toggle('hidden', p.dataset.verifyPanel !== target);
    });
    // Focus the appropriate first input when switching
    if (target === 'code') {
      setTimeout(() => document.querySelector('#verify-code-modal .verify-code-digit')?.focus(), 60);
    } else {
      setTimeout(() => document.getElementById('verify-password-input')?.focus(), 60);
    }
  }

  /* ───────────────────────────────────────────────────
     VERIFY CODE MODAL — 6-digit code + resend countdown
     ─────────────────────────────────────────────────── */
  let verifyResendInterval = null;
  function openVerifyCodeModal(identifier, channel, mode) {
    const modal = document.getElementById('verify-code-modal');
    if (!modal) return;
    modal.dataset.identifier = identifier || '';
    modal.dataset.channel = channel || 'email';
    modal.dataset.mode = mode || 'login';  // 'login' (default) | 'signup'

    // Tabs only make sense on login + email path
    // Hidden when: phone channel (no password yet) OR signup mode (only code verification)
    const tabs = document.getElementById('verify-tabs');
    const showTabs = channel !== 'whatsapp' && mode !== 'signup';
    if (tabs) tabs.classList.toggle('hidden', !showTabs);

    // Code-panel copy + the change-identifier link wording vary per channel
    const msg = document.getElementById('verify-code-message');
    const changeBtnCode = document.getElementById('verify-code-change');
    const changeBtnPw = document.getElementById('verify-password-change');
    const pwIdSpan = document.getElementById('verify-password-identifier');
    if (channel === 'whatsapp') {
      if (msg) msg.innerHTML =
        'أرسلنا كود التحقق المكوّن من 6 أرقام إلى رقم الموبايل ' +
        '<span id="verify-code-identifier" class="text-heading font-medium" dir="ltr">' + identifier + '</span>' +
        ' عبر واتساب';
      if (changeBtnCode) changeBtnCode.textContent = 'تغيير رقم الموبايل';
      if (changeBtnPw) changeBtnPw.textContent = 'تغيير رقم الموبايل';
    } else {
      if (msg) msg.innerHTML =
        'أرسلنا كود التحقق المكوّن من 6 أرقام إلى البريد ' +
        '<span id="verify-code-identifier" class="text-heading font-medium" dir="ltr">' + identifier + '</span>';
      if (changeBtnCode) changeBtnCode.textContent = 'تغيير البريد';
      if (changeBtnPw) changeBtnPw.textContent = 'تغيير البريد';
    }
    if (pwIdSpan) pwIdSpan.textContent = identifier || '';

    // Reset code inputs + password
    modal.querySelectorAll('.verify-code-digit').forEach((d) => { d.value = ''; d.classList.remove('is-filled', 'is-error'); });
    document.getElementById('verify-code-error')?.classList.add('hidden');
    const pwInput = document.getElementById('verify-password-input');
    if (pwInput) pwInput.value = '';

    // Always open on the Code tab
    switchVerifyTab('code');
    startResendCountdown(45);
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    setTimeout(() => modal.querySelector('.verify-code-digit')?.focus(), 60);
  }
  function closeVerifyCodeModal() {
    const modal = document.getElementById('verify-code-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    if (verifyResendInterval) { clearInterval(verifyResendInterval); verifyResendInterval = null; }
    if (allModalsClosed()) document.body.classList.remove('modal-open');
  }
  /* Run the verify-code submit flow (loading → dashboard). Shared by the
     explicit button click AND the auto-trigger when all 6 digits are filled. */
  function submitVerifyCode() {
    const btn = document.getElementById('verify-code-submit');
    if (!btn || btn.disabled) return;
    const digits = [...document.querySelectorAll('#verify-code-modal .verify-code-digit')];
    const code = digits.map((d) => d.value).join('');
    if (code.length !== 6) {
      digits.forEach((d) => { if (!d.value) d.classList.add('is-error'); });
      document.getElementById('verify-code-error')?.classList.remove('hidden');
      return;
    }
    setBtnLoading(btn, true, '.verify-btn-label', '.verify-btn-spinner');
    setTimeout(() => {
      setBtnLoading(btn, false, '.verify-btn-label', '.verify-btn-spinner');
      const modal = document.getElementById('verify-code-modal');
      const mode = modal?.dataset.mode || 'login';
      closeVerifyCodeModal();
      // Signup mode → continue into the onboarding survey; login mode → dashboard
      if (mode === 'signup') openOnboardingModal();
      else navigateToDashboard();
    }, 900);
  }
  function startResendCountdown(seconds) {
    const timerWrap = document.getElementById('verify-resend-timer');
    const secondsEl = document.getElementById('verify-resend-seconds');
    const resendBtn = document.getElementById('verify-resend-btn');
    if (!timerWrap || !secondsEl || !resendBtn) return;
    let remaining = seconds;
    secondsEl.textContent = remaining;
    timerWrap.classList.remove('hidden');
    resendBtn.classList.add('hidden');
    if (verifyResendInterval) clearInterval(verifyResendInterval);
    verifyResendInterval = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(verifyResendInterval);
        verifyResendInterval = null;
        timerWrap.classList.add('hidden');
        resendBtn.classList.remove('hidden');
      } else {
        secondsEl.textContent = remaining;
      }
    }, 1000);
  }
  function initVerifyCodeModal() {
    const modal = document.getElementById('verify-code-modal');
    if (!modal) return;
    modal.querySelectorAll('[data-verify-close]').forEach((el) => {
      el.addEventListener('click', closeVerifyCodeModal);
    });
    // Tab switching (code | password)
    modal.querySelectorAll('.login-method-tab[data-verify-tab]').forEach((tab) => {
      tab.addEventListener('click', () => switchVerifyTab(tab.dataset.verifyTab));
    });
    // Change identifier → return to login modal (re-enter identifier)
    const changeBack = () => { closeVerifyCodeModal(); openLoginModal(); };
    document.getElementById('verify-code-change')?.addEventListener('click', changeBack);
    document.getElementById('verify-password-change')?.addEventListener('click', changeBack);
    // Resend → restart countdown (would re-send the code in a real backend)
    document.getElementById('verify-resend-btn')?.addEventListener('click', () => {
      startResendCountdown(45);
    });
    // Digit inputs — auto-advance + backspace + paste + auto-submit on 6 filled
    const digits = [...modal.querySelectorAll('.verify-code-digit')];
    const triggerAutoSubmit = () => {
      if (digits.every((d) => d.value)) {
        digits.forEach((d) => d.blur());
        submitVerifyCode();
      }
    };
    digits.forEach((d, i) => {
      d.addEventListener('input', () => {
        d.value = d.value.replace(/\D/g, '').slice(0, 1);
        d.classList.toggle('is-filled', !!d.value);
        d.classList.remove('is-error');
        document.getElementById('verify-code-error')?.classList.add('hidden');
        if (d.value && digits[i + 1]) digits[i + 1].focus();
        triggerAutoSubmit();
      });
      d.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !d.value && digits[i - 1]) digits[i - 1].focus();
      });
      d.addEventListener('paste', (e) => {
        const text = (e.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6);
        if (!text) return;
        e.preventDefault();
        text.split('').forEach((ch, idx) => { if (digits[idx]) { digits[idx].value = ch; digits[idx].classList.add('is-filled'); } });
        digits[Math.min(text.length, 5)]?.focus();
        triggerAutoSubmit();
      });
    });
    // Explicit submit (also runs the same flow as auto-submit)
    document.getElementById('verify-code-submit')?.addEventListener('click', submitVerifyCode);

    // Password panel submit
    document.getElementById('verify-password-submit')?.addEventListener('click', (e) => {
      const btn = e.currentTarget;
      const pw = document.getElementById('verify-password-input')?.value || '';
      if (pw.length < 4) {
        document.getElementById('verify-password-input')?.focus();
        return;
      }
      setBtnLoading(btn, true, '.verify-password-btn-label', '.verify-password-btn-spinner');
      setTimeout(() => {
        setBtnLoading(btn, false, '.verify-password-btn-label', '.verify-password-btn-spinner');
        closeVerifyCodeModal();
        navigateToDashboard();
      }, 900);
    });
    // Enter key in password field submits
    document.getElementById('verify-password-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('verify-password-submit')?.click();
    });
  }

  /* Small helpers shared by login/verify buttons */
  function setBtnLoading(btn, loading, labelSel, spinnerSel) {
    const label = btn.querySelector(labelSel);
    const spinner = btn.querySelector(spinnerSel);
    btn.disabled = loading;
    if (label) label.classList.toggle('hidden', loading);
    if (spinner) spinner.classList.toggle('hidden', !loading);
  }
  function allModalsClosed() {
    const ids = ['signup-modal', 'login-modal', 'verify-code-modal',
                 'onboarding-modal', 'trial-modal', 'payment-modal', 'thankyou-modal'];
    return ids.every((id) => document.getElementById(id)?.classList.contains('hidden'));
  }

  /* ───────────────────────────────────────────────────
     INIT
     ─────────────────────────────────────────────────── */
  function init() {
    simulateInitialLoad();
    renderTogglesState();
    renderPrices();
    // detectCurrency() disabled — USD remains default; user toggles SAR manually
    initMagneticButtons();
    initMobileMenu();
    initSignupModal();
    initLoginModal();
    initOnboardingModal();
    initTrialModal();
    initPaymentModal();
    initThankYouModal();
    initInfiniteGrid();
    initCountUp();
    initAcademyMarquee();
    initCompareTabs();
  }

  /* ───────────────────────────────────────────────────
     COMPARE TABLE — tabs (filter) + plan-header price snapshot
     The header cells reuse data-plan / data-signup-trigger,
     so the existing signup-modal wiring fires automatically.
     ─────────────────────────────────────────────────── */
  function initCompareTabs() {
    const tabs = document.querySelectorAll('.compare-tab');
    const tbodies = document.querySelectorAll('#compare-table tbody[data-category]');
    if (!tabs.length || !tbodies.length) return;

    const stickyHeader = document.querySelector('.compare-sticky-header');

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => {
          const active = t === tab;
          t.classList.toggle('is-active', active);
          t.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        const target = tab.dataset.tab;
        tbodies.forEach((tb) => {
          tb.hidden = (tb.dataset.category !== target);
        });

        // Switching from a tall section (e.g. مميزات المنصة, 20 rows) to a short
        // one (e.g. التدريب التفاعلي, 3 rows) shrinks the table dramatically,
        // and the browser keeps the user's scroll position the same — which
        // dumps them on the next section. Re-anchor on the comparison header.
        if (stickyHeader) {
          const rect = stickyHeader.getBoundingClientRect();
          // Only re-anchor if the user is already scrolled past or near the top
          // of the comparison block. Don't yank them up if they haven't reached
          // the table yet.
          if (rect.top < 1) {
            stickyHeader.scrollIntoView({ block: 'start', behavior: 'smooth' });
          }
        }
      });
    });

    // Keep the tabs strip lined up under the sticky header
    positionCompareTabs();
    window.addEventListener('resize', positionCompareTabs);
  }

  /* Read state + PLANS and stamp the current total into each plan-column header.
     Yearly toggle shows the annual total (e.g. $276); monthly shows per-month.
     Called from renderPrices() so the table prices update live with the main
     billing/currency toggles. */
  function snapshotPlanHeaderPrices() {
    const targets = document.querySelectorAll('[data-plan-price]');
    if (!targets.length || typeof PLANS === 'undefined') return;

    const isYearly = state.billing === 'yearly';
    const periodText = isYearly ? '/ سنويًا' : '/ شهريًا';

    targets.forEach((el) => {
      const key = el.dataset.planPrice;
      const plan = PLANS[key];
      if (!plan) return;

      let amount;
      if (state.currency === 'USD') {
        amount = isYearly ? plan.yearlyTotalUsd : plan.monthlyUsd;
      } else {
        amount = isYearly ? plan.yearlyTotalSar : plan.monthlySar;
      }

      el.innerHTML = formatPrice(amount);
    });

    document.querySelectorAll('[data-plan-period]').forEach((el) => {
      el.textContent = periodText;
    });

    // Re-measure header height so the tabs strip lands flush below it
    positionCompareTabs();
  }

  /* Measure plan-header height and push the sticky tabs strip down by that
     amount so both strips stay visually stacked while scrolling. */
  function positionCompareTabs() {
    const header = document.querySelector('.compare-sticky-header');
    const tabsWrap = document.querySelector('.compare-tabs-wrap');
    if (!header || !tabsWrap) return;
    const h = Math.round(header.getBoundingClientRect().height);
    tabsWrap.style.top = h + 'px';
  }

  /* ───────────────────────────────────────────────────
     ACADEMY MARQUEE — auto-scrolling row of testimonial cards.
     27 academies sourced from the Excel sheet; each card uses
     `assets/sahel.png` as the placeholder screenshot until per-academy
     shots arrive. The list is rendered TWICE so the CSS marquee
     (translateX 0 → -50%) loops seamlessly.
     ─────────────────────────────────────────────────── */
  const ACADEMIES = [
    { name: 'د. ثابت حجازي',              url: 'https://thabithejazi.acadimiat.com/',                          image: 'ثابت حجازي.png',
      desc: 'منصة تدريبية رائدة تقدم برامج واستشارات متقدمة في المبيعات، التسويق، الإدارة، وتطوير الأعمال وفق أحدث المنهجيات.' },
    { name: 'سهل مهدي',                     url: 'https://sahelmahdi.acadimiat.com/',                            image: 'sahel.png',
      desc: 'منصة تعليمية رائدة تقدم دبلومات متكاملة، منتجات رقمية، واستشارات متخصصة في التسويق الرقمي والتجارة الإلكترونية وصناعة المحتوى.' },
    { name: 'حذيفة حجازي',                 url: 'https://huthifahejazi.acadimiat.com/',                         image: 'حذيفة حجازي.png',
      desc: 'منصة فنية متخصصة في تعليم فنون الرسم من الأساسيات حتى الاحتراف بأساليب إبداعية تناسب جميع المستويات.' },
    { name: 'Owais',                        url: 'https://moxowais.acadimiat.com/',                              image: 'Owais.png',
      desc: 'منصة تعليمية واستشارية متخصصة في أسرار صناعة المحتوى، الخوارزميات، وتحقيق الانتشار العضوي دون الحاجة للإعلانات.' },
    { name: "Samara's Keto Life",           url: 'https://samarasketolife.acadimiat.com/',                       image: "Samara's Keto Life.png",
      desc: 'منصة صحية وتدريبية متخصصة في التغذية العلاجية ونظام الكيتو دايت والصيام المتقطع، تقدم برامج عملية لاستعادة الصحة والنشاط.' },
    { name: 'FBA Courses',                  url: 'https://fbaacademies.acadimiat.com/',                          image: 'FBA Courses.png',
      desc: 'منصة رياضية إلكترونية متخصصة في تدريبات عملية لتطوير مهارات كرة القدم — التسديد والمهارات الاستعراضية — بأساليب احترافية ومبسطة.' },
    { name: 'أكاديمية خالد إسماعيل',       url: 'https://khalidismailacademy.acadimiat.com/',                   image: 'أكاديمية خالد إسماعيل.png',
      desc: 'منصة متخصصة في تقديم منتجات رقمية وإصدارات عملية مثل «كتاب البوصلة» واستراتيجيات النمو على إنستجرام لدعم التسويق الشخصي وبناء العلامات.' },
    { name: 'أكاديمية كوتش كريم عصام',     url: 'https://kareemessam.online/',                                  image: 'أكاديمية كوتش كريم عصام.png',
      desc: 'منصة تدريبية وتوجيهية متخصصة تقدم برامج ودورات واستشارات عملية لدعم المدربين والكوتشز والمعلمين وصنّاع المحتوى للوصول إلى أفضل نسخة من أنفسهم.' },
    { name: 'أكاديمية مباشر',               url: 'https://mubasher-academy.acadimiat.com/',                      image: 'أكاديمية مباشر.png',
      desc: 'منصة متخصصة تقدم برامج تدريبية وتثقيفية في التداول، التحليل المالي للأسهم، واستراتيجيات الاستثمار.' },
    { name: '7md Store',                    url: 'https://7mdstore.acadimiat.com/',                              image: '7md Store.png',
      desc: 'منصة تدريبية متخصصة في استشارات ودورات عملية حول التجارة الإلكترونية وتطوير المشاريع.' },
    { name: 'Fabusse',                      url: 'https://fabusse.acadimiat.com/',                               image: 'Fabusse.png',
      desc: 'منصة أكاديمية متخصصة في تسويق وإدارة علامات الأزياء، وإعداد وتأهيل عارضي الأزياء.' },
    { name: 'Ghazi Al-Mahayni',             url: 'https://ghazi-almahayni.acadimiat.com/',                       image: 'Ghazi Al-Mahayni.png',
      desc: 'منصة استشارية وتدريبية متخصصة في الخدمات المالية والاستثمارية والتحليل المالي ودراسات الجدوى وإدارة الشركات.' },
    { name: 'أكاديمية كوتش رائد الجهني',   url: 'https://raedaljahane.acadimiat.com/',                          image: 'أكاديمية كوتش رائد الجهني.png',
      desc: 'منصة تدريبية واستشارية متخصصة تقدم برامج وجلسات كوتشينج عملية تركز على اكتشاف نقاط القوة وتطوير المسار المهني وصقل المهارات القيادية.' },
    { name: 'دال أكاديمي',                  url: 'https://dal.acadimiat.com/',                                   image: 'دال أكاديمي.png',
      desc: 'منصة استشارية وتدريبية متخصصة في القيادة والتخطيط الاستراتيجي والتحول المؤسسي والرقمي.' },
    { name: 'الشيف أمجد',                   url: 'https://chefamjed.acadimiat.com/',                             image: 'الشيف أمجد.png',
      desc: 'منصة متخصصة في فنون الحلويات (عجينة السكر، نحت الكيك) وتطوير مشاريع الأغذية من الأساسيات وحتى الاحتراف.' },
    { name: 'Youtube Skool',                url: 'https://youtubeskool.acadimiat.com/',                          image: 'Youtube Skool.png',
      desc: 'منصة تعليمية متخصصة في أسرار اليوتيوب — إنشاء وتطوير القنوات، تحسين SEO، استراتيجيات زيادة المشاهدات وطرق تحقيق الدخل.' },
    { name: 'Reem Academy',                 url: 'https://reemacademy.acadimiat.com/',                           image: 'Reem Academy.png',
      desc: 'منصة تدريبية واستشارية تقدم جلسات كوتشينج ودورات ومنتجات رقمية تركّز على اكتشاف الذات والتطوير الشخصي.' },
    { name: 'عمر عبدالرحيم',               url: 'https://omar-abdelrahim.acadimiat.com/',                       image: 'عمر عبدالرحيم.png',
      desc: 'منصة تعليمية تفاعلية متخصصة في دورات إتقان اللغة الإنجليزية بأسلوب عملي مبسّط وغير تقليدي.' },
    { name: 'Yana Healing',                 url: 'https://afraabitar.acadimiat.com/',                            image: 'Yana Healing.png',
      desc: 'منصة متخصصة في الصحة الشمولية والرفاهية، تقدم برامج وجلسات عملية للتشافي الذاتي واستعادة التوازن النفسي والجسدي.' },
    { name: 'Pro Designer',                 url: 'https://prodesigner.acadimiat.com/',                           image: 'Pro Designer.png',
      desc: 'منصة تعليمية متخصصة في دورات وتدريبات عملية متقدمة لاحتراف التصميم وتطوير المهارات الإبداعية والفنية.' },
    { name: 'نمو',                           url: 'https://nomo.acadimiat.com/',                                  image: 'نمو.png',
      desc: 'منصة متخصصة في برامج تدريبية وحلول عملية في التسويق الإلكتروني والتجارة الإلكترونية وتطوير المشاريع الرقمية.' },
    { name: 'Mayan Arts',                   url: 'https://mayanart.acadimiat.com/',                              image: 'Mayan Arts.png',
      desc: 'منصة متخصصة في الفنون البصرية تقدم دورات وبرامج تدريبية حول تطور سوق الفن وبناء القيمة الحقيقية للأعمال الفنية.' },
    { name: 'وعي آخر',                      url: 'https://anotherawareness.acadimiat.com/',                      image: 'وعي آخر.png',
      desc: 'منصة متخصصة في الارتقاء بالوعي والتطوير الشخصي، تقدم برامج وجلسات عملية لتحقيق التوازن النفسي والنمو الفكري المستمر.' },
    { name: 'عفاف بنت ظافر',               url: 'https://afaf1.acadimiat.com/',                                 image: 'عفاف بنت ظافر.png',
      desc: 'منصة تعليمية وتدريبية متخصصة في دورات وبرامج عملية لتطوير المهارات في المجال المالي وتطوير الذات.' },
    { name: 'الأتراك أكاديمي',              url: 'https://rihlat-alnajah-mae-eabdallah-alturkii.acadimiat.com/', image: 'الأتراك أكاديمي.png',
      desc: 'منصة إرشادية وتدريبية لتوجيه الأفراد وتزويدهم بالأدوات العملية والخطوات المحفزة لتطوير الذات وتحقيق النجاح.' },
    { name: 'رونق',                          url: 'https://rawnaq.acadimiat.com/',                                image: 'رونق.png',
      desc: 'منصة تدريبية رائدة تقدم دورات وبرامج متخصصة في فن المكرمية تجمع بين المعرفة العملية واللمسة الإبداعية.' },
    { name: 'الشامي أكاديمي',               url: 'https://al-shami-academic.acadimiat.com/',                     image: 'الشامي أكاديمي.png',
      desc: 'منصة تعليمية رائدة في صناعة المحتوى، التسويق الإلكتروني، الميديا، والتعليم الأونلاين — لاحتراف التسويق وبناء تواجد رقمي قوي ومؤثر.' },
  ];

  function initAcademyMarquee() {
    const track = document.getElementById('academy-track');
    if (!track) return;

    const buildCard = (a) => {
      const host = a.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
      // Encode for safe URL — Arabic filenames + spaces need %-encoding
      const src = 'assets/' + encodeURIComponent(a.image || 'sahel.png');
      return (
        '<a class="academy-card" href="' + a.url + '" target="_blank" rel="noopener noreferrer" aria-label="' + a.name + '">' +
          '<div class="academy-card__browser">' +
            '<div class="academy-card__chrome">' +
              '<div class="academy-card__dots">' +
                '<span class="dot dot--red"></span>' +
                '<span class="dot dot--yellow"></span>' +
                '<span class="dot dot--green"></span>' +
              '</div>' +
              '<div class="academy-card__url">' + host + '</div>' +
            '</div>' +
            '<img class="academy-card__shot" src="' + src + '" alt="' + a.name + '" loading="lazy">' +
          '</div>' +
        '</a>'
      );
    };

    // Render the list TWICE so the keyframe shift of exactly one-copy-width
    // brings the duplicate's first card to where the original's first card
    // started → perfectly seamless loop, no visible restart point.
    const html = ACADEMIES.map(buildCard).join('');
    track.innerHTML = html + html;

    // Compute the exact width of one copy (incl. the trailing gap to the next
    // copy) and pin it as a CSS var. The keyframe uses translate3d(var(--copy-shift))
    // so the animation ends with duplicate-card-1 aligned over original-card-1.
    const recomputeCopyShift = () => {
      const cards = track.querySelectorAll('.academy-card');
      const half = cards.length / 2;
      if (!half) return;
      const gapPx = parseFloat(getComputedStyle(track).columnGap) || 0;
      let width = 0;
      for (let i = 0; i < half; i++) {
        width += cards[i].getBoundingClientRect().width + gapPx;
      }
      track.style.setProperty('--copy-shift', `-${width}px`);
    };

    // Initial measurement — wait for layout to settle (images can change card height
    // but width is fixed by CSS, so a single rAF / load is enough)
    requestAnimationFrame(recomputeCopyShift);
    window.addEventListener('load', recomputeCopyShift);
    window.addEventListener('resize', recomputeCopyShift);
  }

  /* ───────────────────────────────────────────────────
     COUNT-UP — animates `.count-up` elements from 0 to data-count-to
     when they scroll into view. ease-out cubic, ~1.8s, smooth.
     Uses scroll-based visibility (works everywhere; IntersectionObserver
     doesn't fire reliably inside the MCP preview).
     ─────────────────────────────────────────────────── */
  function initCountUp() {
    const els = document.querySelectorAll('.count-up');
    if (!els.length) return;

    const reduced =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      els.forEach((el) => {
        el.textContent = (Number(el.dataset.countTo) || 0).toLocaleString('en-US');
      });
      return;
    }

    const animate = (el) => {
      if (el.dataset.counted === 'true') return;
      el.dataset.counted = 'true';
      const target = Number(el.dataset.countTo) || 0;
      const duration = 2400;
      const start = Date.now();
      // ease-out quart — long graceful tail, feels smoother than cubic
      const easeOut = (t) => 1 - Math.pow(1 - t, 4);

      function tick() {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        const value = Math.round(easeOut(progress) * target);
        el.textContent = value.toLocaleString('en-US');
        if (progress < 1) setTimeout(tick, 16);
      }
      tick();
    };

    function checkVisible() {
      const wh = window.innerHeight;
      let remaining = 0;
      els.forEach((el) => {
        if (el.dataset.counted === 'true') return;
        remaining++;
        const rect = el.getBoundingClientRect();
        // Wait until the stats are clearly in view (top crosses 75% of viewport)
        if (rect.top < wh * 0.75 && rect.bottom > 0) {
          animate(el);
        }
      });
      // Once all elements have animated, drop the scroll listener
      if (remaining <= 1) {
        window.removeEventListener('scroll', checkVisible);
      }
    }

    window.addEventListener('scroll', checkVisible, { passive: true });
    checkVisible(); // also check on init in case the section is already visible
  }

  /* ───────────────────────────────────────────────────
     INFINITE GRID — single layer that scrolls diagonally forever.
     setTimeout 16ms (~60fps) instead of rAF so it works in all contexts
     including headless preview.
     ─────────────────────────────────────────────────── */
  function initInfiniteGrid() {
    const basePattern = document.getElementById('grid-pattern-base');
    if (!basePattern) return;

    const reduced =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return; // keep grid visible but skip the scroll animation

    const SPEED_X = 0.5;   // pixels / frame
    const SPEED_Y = 0.5;
    const TILE = 40;
    const FRAME_MS = 16;
    let ox = 0, oy = 0;

    function tick() {
      ox = (ox + SPEED_X) % TILE;
      oy = (oy + SPEED_Y) % TILE;
      basePattern.setAttribute('x', ox.toFixed(2));
      basePattern.setAttribute('y', oy.toFixed(2));
      setTimeout(tick, FRAME_MS);
    }
    tick();
  }

  /* ───────────────────────────────────────────────────
     ONBOARDING MODAL — multi-step survey after signup
     ─────────────────────────────────────────────────── */
  const onboardingState = {
    step: 1,
    totalSteps: 3,
    answers: {
      goal: ['share-knowledge'],  // Card 1 — multi, default selected
      academyName: '',            // Card 1 — required
      specialization: [],         // Card 2 — single
      audience: [],               // Card 2 — single
      firstMonthGoal: [],         // Card 3 — single
      currentPlatform: [],        // Card 3 — single
    },
  };

  const onboardingScreenMeta = {
    1: { title: 'هيا نبدأ بمعلوماتك', subtitle: 'سنخصّص تجربتك بناءً على إجاباتك' },
    2: { title: 'حدّد اختصاص أكاديميتك', subtitle: 'هذا يساعدنا نقترح عليك القوالب المناسبة' },
    3: { title: 'حدّثنا عن جمهورك', subtitle: 'حجم جمهورك الحالي يساعدنا نخصّص لك الأدوات' },
    4: { title: 'أهدافك القريبة', subtitle: 'ركّز على ما يهمك أولاً في 30 يوم' },
    5: { title: 'تجربتك السابقة', subtitle: 'لو كنت تستخدم منصة، نساعدك بنقل محتواك' },
  };

  function openOnboardingModal() {
    const modal = document.getElementById('onboarding-modal');
    if (!modal) return;
    closeSignupModal();
    closeLoginModal();
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    setTimeout(() => modal.querySelector('.chip')?.focus(), 50);
  }
  function closeOnboardingModal() {
    const modal = document.getElementById('onboarding-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    document.body.classList.remove('modal-open');
  }

  function updateOnboardingNextState() {
    const nextBtn = document.getElementById('onboarding-next');
    const prevBtn = document.getElementById('onboarding-prev');
    const skipAllBtn = document.getElementById('onboarding-skip-all');
    if (!nextBtn) return;
    const step = onboardingState.step;

    // Validation: only Card 1 (academy name required) gates the Next button
    let canProceed = true;
    if (step === 1) {
      const name = document.getElementById('onboarding-academy-name')?.value.trim() || '';
      canProceed = name.length >= 2;
    }
    nextBtn.disabled = !canProceed;

    // Previous + Skip-All: hidden entirely on Card 1, visible from Card 2 onward
    if (prevBtn) prevBtn.classList.toggle('hidden', step === 1);
    if (skipAllBtn) skipAllBtn.classList.toggle('hidden', step === 1);
  }

  function renderOnboardingStep() {
    const modal = document.getElementById('onboarding-modal');
    if (!modal) return;
    const step = onboardingState.step;

    // Show only the matching screen
    modal.querySelectorAll('[data-screen]').forEach((el) => {
      const target = Number(el.dataset.screen);
      el.classList.toggle('hidden', target !== step);
    });

    // Update progress bar
    const steps = modal.querySelectorAll('.onboarding-progress .step');
    steps.forEach((seg, i) => {
      seg.classList.toggle('bg-primary', i < step);
      seg.classList.toggle('bg-[#E5E2E8]', i >= step);
    });

    // Title + Subtitle: only on Card 1
    const titleEl = document.getElementById('onboarding-title');
    const subtitleEl = titleEl?.nextElementSibling;
    if (step === 1) {
      const meta = onboardingScreenMeta[1];
      if (titleEl) { titleEl.textContent = meta.title; titleEl.style.display = ''; }
      if (subtitleEl) { subtitleEl.textContent = meta.subtitle; subtitleEl.style.display = ''; }
    } else {
      if (titleEl) titleEl.style.display = 'none';
      if (subtitleEl) subtitleEl.style.display = 'none';
    }

    // Next button: "إنهاء" only on the very last card
    const nextBtn = document.getElementById('onboarding-next');
    if (nextBtn) {
      nextBtn.textContent = step === onboardingState.totalSteps ? 'إنهاء' : 'التالي';
    }

    updateOnboardingNextState();
  }

  function goBackOnboarding() {
    if (onboardingState.step > 1) {
      onboardingState.step -= 1;
      renderOnboardingStep();
    }
  }

  function advanceOnboarding() {
    if (onboardingState.step < onboardingState.totalSteps) {
      onboardingState.step += 1;
      renderOnboardingStep();
    } else {
      // Final step → completion → open trial subscription modal
      console.log('Onboarding complete:', { ...onboardingState.answers });
      closeOnboardingModal();
      openTrialModal();
    }
  }

  /* ───────────────────────────────────────────────────
     TRIAL SUBSCRIPTION MODAL — appears after onboarding finish
     ─────────────────────────────────────────────────── */
  const trialState = { billing: 'yearly' };

  function addDays(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
  }

  function formatArabicDate(date) {
    // Arabic month names with Gregorian calendar + Latin (Western) numerals
    // so dates render like "16 مايو 2026" — matches the site's price numerals.
    try {
      return new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', {
        day: 'numeric', month: 'long', year: 'numeric',
      }).format(date);
    } catch {
      return date.toLocaleDateString('ar', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  }

  function getTrialPlanKey() {
    const sel = document.getElementById('signup-modal')?.dataset.selectedPlan;
    return PLANS[sel] ? sel : 'pro';
  }

  function renderTrialModal() {
    const planKey = getTrialPlanKey();
    const plan = PLANS[planKey];
    if (!plan) return;

    const currency = state.currency;
    const monthlyVal = currency === 'USD' ? plan.monthlyUsd : plan.monthlySar;
    const yearlyPerMonthVal = currency === 'USD' ? plan.yearlyUsd : plan.yearlySar;
    const yearlyTotalVal = currency === 'USD' ? plan.yearlyTotalUsd : plan.yearlyTotalSar;

    // Heading
    const nameEl = document.getElementById('trial-plan-name');
    if (nameEl) nameEl.textContent = plan.name;

    // Yearly card
    const yearlyPriceEl = document.getElementById('trial-yearly-price');
    const yearlySubEl = document.getElementById('trial-yearly-sub');
    if (yearlyPriceEl) yearlyPriceEl.innerHTML = `${formatPrice(yearlyTotalVal)} <span style="font-weight:500;font-size:14px;color:var(--color-text-muted)">/ سنويًا</span>`;
    if (yearlySubEl) yearlySubEl.innerHTML = `(${formatPrice(yearlyPerMonthVal)} / شهريًا)`;

    // Monthly card
    const monthlyPriceEl = document.getElementById('trial-monthly-price');
    if (monthlyPriceEl) monthlyPriceEl.innerHTML = `${formatPrice(monthlyVal)} <span style="font-weight:500;font-size:14px;color:var(--color-text-muted)">/ شهريًا</span>`;

    // Summary + timeline: charge after 3-day trial is the $1 first-month intro
    // (matches the site-wide "$1 لأول شهر" promo).
    const trialEnd = addDays(new Date(), 3);
    const introAmount = state.currency === 'USD' ? 1 : 4;

    const dueDateEl = document.getElementById('trial-due-date');
    const dueAmountEl = document.getElementById('trial-due-amount');
    const step2DateEl = document.getElementById('trial-step2-date');
    const step2TextEl = document.getElementById('trial-step2-text');

    if (dueDateEl) dueDateEl.textContent = formatArabicDate(trialEnd);
    if (dueAmountEl) dueAmountEl.innerHTML = formatPrice(introAmount);
    if (step2DateEl) step2DateEl.textContent = formatArabicDate(trialEnd);
    if (step2TextEl) step2TextEl.innerHTML = `سيبدأ اشتراكك بـ ${formatPrice(introAmount)} لأول شهر — يمكنك الإلغاء في أي وقت`;
  }

  function openTrialModal() {
    const modal = document.getElementById('trial-modal');
    if (!modal) return;
    closeSignupModal();
    closeLoginModal();
    closeOnboardingModal();
    renderTrialModal();
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    setTimeout(() => modal.querySelector('.trial-plan-card--selected')?.focus(), 50);
  }

  function closeTrialModal() {
    const modal = document.getElementById('trial-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  function initTrialModal() {
    const modal = document.getElementById('trial-modal');
    if (!modal) return;

    // Radio cards
    modal.querySelectorAll('.trial-plan-card').forEach((card) => {
      const select = () => {
        modal.querySelectorAll('.trial-plan-card').forEach((c) => {
          c.classList.remove('trial-plan-card--selected');
          const r = c.querySelector('input[type="radio"]');
          if (r) r.checked = false;
        });
        card.classList.add('trial-plan-card--selected');
        const r = card.querySelector('input[type="radio"]');
        if (r) r.checked = true;
        trialState.billing = card.dataset.billing;
        renderTrialModal();
      };
      card.addEventListener('click', select);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          select();
        }
      });
    });

    // Backdrop click closes (no explicit close X anymore)
    modal.querySelectorAll('[data-trial-close]').forEach((el) => {
      el.addEventListener('click', closeTrialModal);
    });

    // Back button → return to onboarding at its final step
    document.getElementById('trial-back-btn')?.addEventListener('click', () => {
      closeTrialModal();
      onboardingState.step = onboardingState.totalSteps;
      openOnboardingModal();
      renderOnboardingStep();
    });

    // Skip link (on timeline panel) → log + close without subscribing
    document.getElementById('trial-skip-btn')?.addEventListener('click', () => {
      console.log('Trial skipped');
      closeTrialModal();
    });

    // ESC closes
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeTrialModal();
    });

    // Next button → open payment modal
    document.getElementById('trial-next-btn')?.addEventListener('click', () => {
      closeTrialModal();
      openPaymentModal();
    });
  }

  /* ───────────────────────────────────────────────────
     PAYMENT MODAL — card details + optional add-on
     ─────────────────────────────────────────────────── */
  function renderPaymentRenewalNote() {
    const note = document.getElementById('payment-renewal-note');
    if (!note) return;
    const planKey = getTrialPlanKey();
    const plan = PLANS[planKey];
    if (!plan) return;

    // Renewal date = trial end (today + 3) + 30 days = today + 33
    const renewDate = addDays(new Date(), 33);
    const isYearly = trialState.billing === 'yearly';
    const priceVal = state.currency === 'USD'
      ? (isYearly ? plan.yearlyTotalUsd : plan.monthlyUsd)
      : (isYearly ? plan.yearlyTotalSar : plan.monthlySar);
    const suffix = isYearly ? 'سنويًا' : 'شهريًا';

    const em = (val) => `<span class="text-heading font-medium">${val}</span>`;
    let html =
      `سيتم تجديد اشتراكك تلقائياً للخطة ${em(plan.name)} ` +
      `بتاريخ ${em(formatArabicDate(renewDate))} ` +
      `بقيمة ${em(formatPrice(priceVal) + ' / ' + suffix)}.`;

    const addon = document.getElementById('payment-addon-checkbox');
    if (addon?.checked) {
      const addonPrice = formatPrice(state.currency === 'USD' ? 99 : 371);
      html += ` بالإضافة إلى ${em(addonPrice)} كرسوم لخدمة بناء وتجهيز الأكاديمية.`;
    }
    note.innerHTML = html;
  }

  /* Card brand detection — checks BIN prefix and swaps the right-side icon */
  function detectCardBrand(digits) {
    const d = digits.replace(/\D/g, '');
    if (!d) return null;
    // Mada-specific BINs (check first to avoid being miscategorised as Visa/MC)
    const madaBins = ['440647','440795','446404','446672','457865','458456','484783','486094','486095','486096','489317','489318','489319','504300','521076','524130','532013','535825','535989','539931','543357','549760','557606','558563','588845','588850','588851','589206'];
    for (const bin of madaBins) {
      if (d.startsWith(bin)) return 'mada';
    }
    if (d.length >= 2) {
      const two = d.slice(0, 2);
      if (two === '34' || two === '37') return 'amex';
    }
    const first = d[0];
    if (first === '4') return 'visa';
    if (first === '5') return 'mastercard';
    return null;
  }

  function updateCardBrandIcon(brand) {
    const container = document.getElementById('payment-card-brand');
    if (!container) return;
    const defaultIcon = container.querySelector('.payment-card-brand__default');
    const img = container.querySelector('.payment-card-brand__img');
    const sources = {
      visa: 'assets/visa.png',
      mastercard: 'assets/Mastercard.png',
      amex: 'assets/express.png',
      mada: 'assets/Mada.png',
    };
    if (brand && sources[brand]) {
      img.src = sources[brand];
      img.alt = brand;
      img.classList.remove('hidden');
      defaultIcon.classList.add('hidden');
    } else {
      img.classList.add('hidden');
      defaultIcon.classList.remove('hidden');
    }
  }

  function renderPaymentSubmitLabel() {
    const btn = document.getElementById('payment-submit-btn');
    if (!btn) return;
    const introAmount = state.currency === 'USD' ? 1 : 4;
    btn.innerHTML = `ابدأ تجربتك بـ <span dir="ltr">${formatPrice(introAmount)}</span>`;
  }

  function openPaymentModal() {
    const modal = document.getElementById('payment-modal');
    if (!modal) return;
    renderPaymentSubmitLabel();
    renderPaymentRenewalNote();
    // Timeline step 2 date (trial end = today + 3)
    const trialEnd = addDays(new Date(), 3);
    const step2DateEl = document.getElementById('payment-step2-date');
    if (step2DateEl) step2DateEl.textContent = formatArabicDate(trialEnd);
    // Reset brand icon to default on each open
    updateCardBrandIcon(null);
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    setTimeout(() => document.getElementById('payment-card-number')?.focus(), 50);
  }

  function closePaymentModal() {
    const modal = document.getElementById('payment-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    // Hide CVV popover if open
    document.getElementById('payment-cvv-popover')?.classList.add('hidden');
  }

  function formatCardNumber(value) {
    const digits = value.replace(/\D/g, '').slice(0, 19);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  }
  function formatCardExp(value) {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length < 3) return digits;
    return digits.slice(0, 2) + '/' + digits.slice(2);
  }

  function initPaymentModal() {
    const modal = document.getElementById('payment-modal');
    if (!modal) return;

    // Backdrop close
    modal.querySelectorAll('[data-payment-close]').forEach((el) => {
      el.addEventListener('click', closePaymentModal);
    });

    // Back → return to trial modal
    document.getElementById('payment-back-btn')?.addEventListener('click', () => {
      closePaymentModal();
      openTrialModal();
    });

    // Skip → go to dashboard (no purchase)
    document.getElementById('payment-skip-btn')?.addEventListener('click', () => {
      console.log('Payment skipped → navigating to dashboard');
      closePaymentModal();
      navigateToDashboard();
    });

    // ESC close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) closePaymentModal();
    });

    // Input formatting + card-brand detection
    const cardNum = document.getElementById('payment-card-number');
    cardNum?.addEventListener('input', () => {
      cardNum.value = formatCardNumber(cardNum.value);
      updateCardBrandIcon(detectCardBrand(cardNum.value));
    });
    const cardExp = document.getElementById('payment-card-exp');
    cardExp?.addEventListener('input', () => {
      cardExp.value = formatCardExp(cardExp.value);
    });
    const cardCvv = document.getElementById('payment-card-cvv');
    cardCvv?.addEventListener('input', () => {
      cardCvv.value = cardCvv.value.replace(/\D/g, '').slice(0, 4);
    });

    // CVV info popover toggle
    const infoBtn = document.getElementById('payment-cvv-info');
    const popover = document.getElementById('payment-cvv-popover');
    infoBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      popover?.classList.toggle('hidden');
    });
    document.addEventListener('click', (e) => {
      if (!popover || popover.classList.contains('hidden')) return;
      if (e.target === infoBtn || infoBtn?.contains(e.target)) return;
      if (popover.contains(e.target)) return;
      popover.classList.add('hidden');
    });

    // Add-on checkbox → update renewal note live
    document.getElementById('payment-addon-checkbox')?.addEventListener('change', renderPaymentRenewalNote);

    // No card validation per user request — accept any input

    // Submit → proceed to thank-you (no validation gate)
    document.getElementById('payment-submit-btn')?.addEventListener('click', () => {
      const planKey = getTrialPlanKey();
      const addonChecked = !!document.getElementById('payment-addon-checkbox')?.checked;
      console.log('Trial started:', {
        plan: planKey,
        billing: trialState.billing,
        currency: state.currency,
        addon: addonChecked,
        trialEnd: addDays(new Date(), 3).toISOString(),
        firstRenewal: addDays(new Date(), 33).toISOString(),
      });
      closePaymentModal();
      openThankYouModal();
    });
  }

  /* ───────────────────────────────────────────────────
     CARD VALIDATION — Luhn + expiry (must be future) + CVV length.
     Errors render inline under each field; cleared as the user fixes.
     ─────────────────────────────────────────────────── */
  /* Card-number validation: digit count only (13–19 digits).
     We intentionally skip Luhn so any reasonably-shaped number passes. */
  function cardNumberHasValidLength(num) {
    const digits = num.replace(/\D/g, '');
    return digits.length >= 13 && digits.length <= 19;
  }
  function validExpiry(value) {
    const m = value.match(/^(\d{2})\s*\/\s*(\d{2})$/);
    if (!m) return false;
    const month = parseInt(m[1], 10);
    const year2 = parseInt(m[2], 10);
    if (month < 1 || month > 12) return false;
    const fullYear = 2000 + year2;
    const now = new Date();
    const endOfMonth = new Date(fullYear, month, 0, 23, 59, 59);  // last day of expiry month
    return endOfMonth >= now;
  }
  function validCvv(value, brand) {
    const v = value.replace(/\D/g, '');
    // AmEx requires 4 digits; everyone else 3
    if (brand === 'amex') return v.length === 4;
    return v.length === 3;
  }
  function ensureErrorEl(input, key) {
    // Insert an error <p> as the next sibling of the field's .float-input wrapper, once.
    const wrap = input.closest('.float-input');
    if (!wrap) return null;
    let el = wrap.nextElementSibling;
    if (!el || !el.classList || !el.classList.contains('payment-input-error') || el.dataset.errorFor !== key) {
      el = document.createElement('p');
      el.className = 'payment-input-error';
      el.dataset.errorFor = key;
      wrap.insertAdjacentElement('afterend', el);
    }
    return el;
  }
  function setFieldError(input, message) {
    const wrap = input.closest('.float-input');
    const errEl = ensureErrorEl(input, input.id);
    if (message) {
      wrap?.classList.add('has-error');
      if (errEl) { errEl.textContent = message; errEl.classList.add('is-visible'); }
    } else {
      wrap?.classList.remove('has-error');
      errEl?.classList.remove('is-visible');
    }
  }
  function validateCardForm(opts = {}) {
    const num = document.getElementById('payment-card-number');
    const exp = document.getElementById('payment-card-exp');
    const cvv = document.getElementById('payment-card-cvv');
    const mark = opts.markErrors === true;
    let ok = true;
    // Number — only check digit count, not Luhn
    const cleanedNum = (num?.value || '').replace(/\D/g, '');
    if (!cleanedNum) {
      if (mark) setFieldError(num, 'يرجى إدخال رقم البطاقة.');
      ok = false;
    } else if (!cardNumberHasValidLength(cleanedNum)) {
      if (mark) setFieldError(num, 'يجب أن يتكون رقم البطاقة من 13 إلى 19 رقماً.');
      ok = false;
    } else if (mark) {
      setFieldError(num, null);
    }
    // Expiry
    const expVal = (exp?.value || '').trim();
    if (!expVal) {
      if (mark) setFieldError(exp, 'يرجى إدخال تاريخ الانتهاء.');
      ok = false;
    } else if (!validExpiry(expVal)) {
      if (mark) setFieldError(exp, 'تاريخ الانتهاء غير صحيح أو منتهٍ.');
      ok = false;
    } else if (mark) {
      setFieldError(exp, null);
    }
    // CVV
    const brand = detectCardBrand(num?.value || '');
    const cvvVal = (cvv?.value || '');
    if (!cvvVal) {
      if (mark) setFieldError(cvv, 'يرجى إدخال كود التحقق.');
      ok = false;
    } else if (!validCvv(cvvVal, brand)) {
      if (mark) setFieldError(cvv, brand === 'amex' ? 'كود التحقق يجب أن يكون 4 أرقام.' : 'كود التحقق يجب أن يكون 3 أرقام.');
      ok = false;
    } else if (mark) {
      setFieldError(cvv, null);
    }
    return ok;
  }
  function initCardValidation() {
    const num = document.getElementById('payment-card-number');
    const exp = document.getElementById('payment-card-exp');
    const cvv = document.getElementById('payment-card-cvv');
    // Clear errors as user types (re-validate after blur)
    [num, exp, cvv].forEach((el) => {
      if (!el) return;
      el.addEventListener('input', () => setFieldError(el, null));
      el.addEventListener('blur', () => {
        // Validate just this field on blur, mark only if it has content
        if (!el.value.trim()) return;
        if (el === num) {
          if (!cardNumberHasValidLength(el.value)) setFieldError(el, 'يجب أن يتكون رقم البطاقة من 13 إلى 19 رقماً.');
        } else if (el === exp) {
          if (!validExpiry(el.value)) setFieldError(el, 'تاريخ الانتهاء غير صحيح أو منتهٍ.');
        } else if (el === cvv) {
          const brand = detectCardBrand(num?.value || '');
          if (!validCvv(el.value, brand)) setFieldError(el, brand === 'amex' ? 'كود التحقق يجب أن يكون 4 أرقام.' : 'كود التحقق يجب أن يكون 3 أرقام.');
        }
      });
    });
  }

  /* ───────────────────────────────────────────────────
     THANK-YOU MODAL — success state after payment
     ─────────────────────────────────────────────────── */
  function navigateToDashboard() {
    // Static prototype: no real dashboard route exists. Log + simulate.
    console.log('Navigate to dashboard');
    location.hash = 'dashboard';
  }

  function fireConfetti() {
    if (typeof window.confetti !== 'function') return;
    const end = Date.now() + 1200;
    (function frame() {
      window.confetti({
        particleCount: 4,
        angle: 60,
        spread: 65,
        origin: { x: 0, y: 0.5 },
        colors: ['#6B3A8C', '#E056A7', '#F2C94C', '#1F8A4C'],
      });
      window.confetti({
        particleCount: 4,
        angle: 120,
        spread: 65,
        origin: { x: 1, y: 0.5 },
        colors: ['#6B3A8C', '#E056A7', '#F2C94C', '#1F8A4C'],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
    // Big burst at the start
    window.confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.45 },
      colors: ['#6B3A8C', '#E056A7', '#F2C94C', '#1F8A4C'],
    });
  }

  function renderThankYouRenewalNote() {
    const note = document.getElementById('thankyou-renewal-note');
    if (!note) return;
    const planKey = getTrialPlanKey();
    const plan = PLANS[planKey];
    if (!plan) return;
    const renewDate = addDays(new Date(), 33); // trial end (today+3) + 30 days
    const isYearly = trialState.billing === 'yearly';
    const priceVal = state.currency === 'USD'
      ? (isYearly ? plan.yearlyTotalUsd : plan.monthlyUsd)
      : (isYearly ? plan.yearlyTotalSar : plan.monthlySar);
    const suffix = isYearly ? 'سنويًا' : 'شهريًا';
    const em = (val) => `<span class="font-medium">${val}</span>`;
    note.innerHTML =
      `سيتم تجديد الاشتراك تلقائياً بتاريخ ${em(formatArabicDate(renewDate))} ` +
      `بسعر ${em(formatPrice(priceVal) + ' / ' + suffix)} ` +
      `بعد انتهاء الفترة التجريبية.`;
  }

  function openThankYouModal() {
    const modal = document.getElementById('thankyou-modal');
    if (!modal) return;
    renderThankYouRenewalNote();
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    setTimeout(() => document.getElementById('thankyou-dashboard-btn')?.focus(), 50);
    // Fire confetti after the modal becomes visible
    setTimeout(fireConfetti, 120);
  }

  function closeThankYouModal() {
    const modal = document.getElementById('thankyou-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  function initThankYouModal() {
    const modal = document.getElementById('thankyou-modal');
    if (!modal) return;
    document.getElementById('thankyou-dashboard-btn')?.addEventListener('click', () => {
      closeThankYouModal();
      navigateToDashboard();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeThankYouModal();
    });
  }

  function initOnboardingModal() {
    const modal = document.getElementById('onboarding-modal');
    if (!modal) return;

    // Chip multi-select
    modal.querySelectorAll('[data-chip-group]').forEach((group) => {
      const isMulti = group.dataset.multi === 'true';
      group.addEventListener('click', (e) => {
        const chip = e.target.closest('.chip');
        if (!chip) return;
        const value = chip.dataset.value;
        const currentlySelected = chip.dataset.selected === 'true';
        if (isMulti) {
          chip.dataset.selected = currentlySelected ? 'false' : 'true';
        } else {
          // Single select: unselect siblings
          group.querySelectorAll('.chip').forEach((c) => (c.dataset.selected = 'false'));
          chip.dataset.selected = 'true';
        }
        // Update state for any known chip group
        const groupKey = group.dataset.chipGroup;
        if (groupKey && onboardingState.answers[groupKey] !== undefined) {
          if (isMulti) {
            if (currentlySelected) {
              onboardingState.answers[groupKey] = onboardingState.answers[groupKey].filter((v) => v !== value);
            } else {
              onboardingState.answers[groupKey].push(value);
            }
          } else {
            onboardingState.answers[groupKey] = [value];
          }
        }
      });
    });

    // Academy name validation
    const nameInput = document.getElementById('onboarding-academy-name');
    nameInput?.addEventListener('input', () => {
      onboardingState.answers.academyName = nameInput.value.trim();
      updateOnboardingNextState();
    });

    // Close handlers
    modal.querySelectorAll('[data-onboarding-close]').forEach((el) => {
      el.addEventListener('click', closeOnboardingModal);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeOnboardingModal();
    });

    // Next button → advance to next screen
    document.getElementById('onboarding-next')?.addEventListener('click', advanceOnboarding);
    // Previous button → go back one screen
    document.getElementById('onboarding-prev')?.addEventListener('click', goBackOnboarding);
    // Skip All → skip the QUESTIONS but continue to trial/payment flow
    document.getElementById('onboarding-skip-all')?.addEventListener('click', () => {
      onboardingState.step = onboardingState.totalSteps;
      console.log('Onboarding skipped — partial answers:', { ...onboardingState.answers });
      closeOnboardingModal();
      openTrialModal();
    });

    // Wire signup → onboarding triggers
    const signupModal = document.getElementById('signup-modal');
    const signupEmail = signupModal?.querySelector('#signup-email');
    const signupContinueBtn = document.getElementById('signup-continue-btn');

    // Enable/disable continue based on email validity
    function refreshContinueBtn() {
      if (!signupContinueBtn || !signupEmail) return;
      const val = signupEmail.value.trim();
      signupContinueBtn.disabled = val.length < 4 || !val.includes('@');
    }
    signupEmail?.addEventListener('input', refreshContinueBtn);
    refreshContinueBtn();

    // Email path → run verify-code step first, then continue to onboarding
    signupContinueBtn?.addEventListener('click', () => {
      if (signupContinueBtn.disabled) return;
      const email = (signupEmail?.value || '').trim();
      closeSignupModal();
      openVerifyCodeModal(email, 'email', 'signup');
    });

    // SSO paths (Google + Apple in signup modal) skip email-verification and
    // go straight to onboarding (the SSO provider already verified them)
    signupModal?.querySelectorAll('.signup-method').forEach((btn) => {
      if (btn.id === 'signup-continue-btn') return;
      btn.addEventListener('click', () => openOnboardingModal());
    });

    renderOnboardingStep();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
