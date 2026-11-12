(() => {
  const plans = [
    {
      name: "Free",
      price: 0,
      icon: "○",
      features: ["1 MultiSearch / day", "Masked result preview", "Community forum access", "Upgrade anytime"],
    },
    {
      name: "Beginner",
      price: 10, weeklyPrice: 5, yearlyPrice: 50, lifetimePrice: 120,
      icon: "ϟ",
      features: ["50 Searches/day", "25 IntelX Lookups/day", "All OSINT Sources", "Email Support"],
    },
    {
      name: "Pro",
      price: 20, weeklyPrice: 10, yearlyPrice: 80, lifetimePrice: 300,
      icon: "◇",
      popular: true,
      features: [
        "200 Searches/day",
        "Discord Stalker",
        "ECLYPS AI assistant",
        "100 IntelX Lookups/day",
        "Full Breach DB Access",
        "Priority Support",
      ],
    },
    {
      name: "Researcher",
      price: 35, weeklyPrice: 20, yearlyPrice: 150, lifetimePrice: 500,
      icon: "↗",
      features: [
        "500 Searches/day",
        "Discord Stalker",
        "ECLYPS AI assistant",
        "Unlimited IntelX Lookups",
        "Dark Web Monitoring",
        "Dedicated Account Manager",
      ],
    },
  ];

  const intervals = {
    Weekly: { priceKey: "weeklyPrice", suffix: "/week", note: "Billed weekly" },
    Monthly: { priceKey: "price", suffix: "/mo", note: "Billed monthly" },
    Yearly: { priceKey: "yearlyPrice", suffix: "/yr", note: "Billed once per year" },
    Lifetime: { priceKey: "lifetimePrice", suffix: " one-time", note: "Billed once" },
  };

  const languages = [
    { code: "en", label: "English", country: "gb" },
    { code: "tr", label: "Türkçe", country: "tr" },
    { code: "es", label: "Español", country: "es" },
    { code: "ru", label: "Русский", country: "ru" },
    { code: "de", label: "Deutsch", country: "de" },
    { code: "fr", label: "Français", country: "fr" },
    { code: "it", label: "Italiano", country: "it" },
    { code: "nl", label: "Nederlands", country: "nl" },
  ];

  const translations = window.ECLYPS_TRANSLATIONS || {};
  const originalTitle = document.title;
  const heroTitles = {
    en: ["Watch the ", "breached web", " move."],
    tr: ["", "İhlal edilen web'i", " izleyin."],
    es: ["Observa ", "la web vulnerada", " en movimiento."],
    ru: ["Наблюдайте за ", "взломанной сетью", " в движении."],
    de: ["Beobachte das ", "gehackte Web", " in Bewegung."],
    fr: ["Surveillez le ", "web compromis", " en mouvement."],
    it: ["Il ", "web violato", " è in movimento."],
    nl: ["Bekijk het ", "gehackte web", " in beweging."],
  };
  let overlay;
  let selectedPlan = plans[0];
  let selectedInterval = "Monthly";
  let selectedPayment = "";

  const money = (value) => `$${value.toFixed(2)}`;
  const planPrice = (plan, intervalName) => plan.name === "Free" ? 0 : plan[intervals[intervalName].priceKey];

  function initHeroBrand() {
    const reticle = document.querySelector(".vLC-DG_reticle");
    if (!reticle || reticle.querySelector(".eclyps-hero-brand")) return;

    const brand = document.createElement("span");
    brand.className = "eclyps-hero-brand";
    brand.setAttribute("aria-label", "ECLYPS");

    const logo = document.createElement("img");
    logo.src = "icons/logo-icon.png";
    logo.alt = "";

    const name = document.createElement("span");
    name.textContent = "ECLYPS";

    brand.append(logo, name);
    reticle.append(brand);
  }

  function initLanguageMenu() {
    const wrap = document.querySelector(".vLC-DG_langWrap");
    const toggle = wrap?.querySelector(".vLC-DG_langBtn");
    if (!wrap || !toggle) return;

    const currentCode = wrap.querySelector(".vLC-DG_langCode");
    const currentFlag = wrap.querySelector(".vLC-DG_langFlag");
    const menu = document.createElement("div");
    menu.className = "vLC-DG_langMenu";
    menu.setAttribute("role", "menu");
    menu.hidden = true;

    let activeLanguage = languages.find((language) => language.code === localStorage.getItem("eclyps.language")) || languages[0];
    const translatePage = () => {
      const dictionary = translations[activeLanguage.code] || {};
      const translateText = (node) => {
        const current = node.nodeValue;
        if (node.__eclypsLastValue !== undefined && current !== node.__eclypsLastValue) {
          node.__eclypsOriginalValue = current;
        } else if (node.__eclypsOriginalValue === undefined) {
          node.__eclypsOriginalValue = current;
        }

        const original = node.__eclypsOriginalValue;
        const match = original.match(/^(\s*)([\s\S]*?)(\s*)$/);
        const key = match[2].replace(/\s+/g, " ");
        const translated = `${match[1]}${dictionary[key] || key}${match[3]}`;
        if (current !== translated) node.nodeValue = translated;
        node.__eclypsLastValue = translated;
      };
      const translateAttributes = (element) => {
        const originals = element.__eclypsOriginalAttributes || (element.__eclypsOriginalAttributes = {});
        for (const name of ["aria-label", "title", "placeholder"]) {
          if (!element.hasAttribute(name)) continue;
          const current = element.getAttribute(name);
          if (originals[name] !== undefined && current !== element.__eclypsLastAttributes?.[name]) {
            originals[name] = current;
          } else if (originals[name] === undefined) {
            originals[name] = current;
          }
          const translated = dictionary[originals[name]] || originals[name];
          element.setAttribute(name, translated);
          element.__eclypsLastAttributes = { ...element.__eclypsLastAttributes, [name]: translated };
        }
      };
      const translateSubtree = (root) => {
        if (root.nodeType === Node.TEXT_NODE) {
          if (!root.parentElement?.closest("script,style,noscript,.vLC-DG_langMenu")) translateText(root);
          return;
        }
        if (root.nodeType !== Node.ELEMENT_NODE && root !== document.body) return;
        if (root.nodeType === Node.ELEMENT_NODE) translateAttributes(root);
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
          acceptNode: (node) => node.parentElement?.closest("script,style,noscript,.vLC-DG_langMenu") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
        });
        let node;
        while ((node = walker.nextNode())) translateText(node);
        root.querySelectorAll?.("*").forEach(translateAttributes);
      };
      translatePage.observer?.disconnect();
      translateSubtree(document.body);
      const heroHeading = document.querySelector(".vLC-DG_h1");
      const localizedHero = heroTitles[activeLanguage.code];
      if (heroHeading && localizedHero) {
        const [before, accent, after] = localizedHero;
        const highlighted = document.createElement("span");
        highlighted.className = "vLC-DG_accent";
        highlighted.textContent = accent;
        heroHeading.replaceChildren(document.createTextNode(before), highlighted, document.createTextNode(after));
      }
      document.title = dictionary[originalTitle] || originalTitle;
      translatePage.observer = new MutationObserver((records) => {
        for (const record of records) {
          if (record.type === "characterData") translateText(record.target);
          if (record.type === "childList") record.addedNodes.forEach(translateSubtree);
        }
      });
      translatePage.observer.observe(document.body, { childList: true, characterData: true, subtree: true });
    };
    const updateCurrentLanguage = () => {
      currentCode.textContent = activeLanguage.code.toUpperCase();
      currentFlag.src = `https://flagcdn.com/${activeLanguage.country}.svg`;
      currentFlag.alt = activeLanguage.label;
      document.documentElement.lang = activeLanguage.code;
      menu.querySelectorAll("button").forEach((button) => {
        const selected = button.dataset.language === activeLanguage.code;
        button.classList.toggle("vLC-DG_langItemActive", selected);
        button.setAttribute("aria-checked", String(selected));
      });
      translatePage();
    };

    for (const language of languages) {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "vLC-DG_langItem";
      option.setAttribute("role", "menuitemradio");
      option.dataset.language = language.code;

      const flag = document.createElement("img");
      flag.className = "vLC-DG_langItemFlag";
      flag.src = `https://flagcdn.com/${language.country}.svg`;
      flag.alt = "";
      flag.width = 18;
      flag.height = 13;

      option.append(flag, document.createTextNode(` ${language.label}`));
      option.addEventListener("click", () => {
        activeLanguage = language;
        localStorage.setItem("eclyps.language", language.code);
        updateCurrentLanguage();
        menu.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      });
      menu.append(option);
    }

    wrap.append(menu);
    updateCurrentLanguage();
    toggle.addEventListener("click", () => {
      menu.hidden = !menu.hidden;
      toggle.setAttribute("aria-expanded", String(!menu.hidden));
      if (!menu.hidden) menu.querySelector('[aria-checked="true"]')?.focus();
    });

    document.addEventListener("click", (event) => {
      if (!wrap.contains(event.target) && !menu.hidden) {
        menu.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !menu.hidden) {
        menu.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }

  function ensureOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.id = "eclyps-pricing-overlay";
    overlay.className = "eclyps-pricing-overlay";
    overlay.hidden = true;
    overlay.innerHTML = `
      <div class="eclyps-pricing-shell">
        <header class="eclyps-pricing-top">
          <div class="eclyps-pricing-brand" aria-label="ECLYPS">
            <img src="icons/logo-icon.png" alt="">
            <span>ECLYPS</span>
          </div>
          <button type="button" class="eclyps-pricing-close" data-action="close" aria-label="Close pricing">×</button>
        </header>
        <main class="eclyps-pricing-main" aria-live="polite"></main>
      </div>`;
    document.body.append(overlay);
    overlay.addEventListener("click", onOverlayClick);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !overlay.hidden) close();
    });
    return overlay;
  }

  function renderPlans() {
    const root = ensureOverlay().querySelector(".eclyps-pricing-main");
    root.innerHTML = `
      <div class="eclyps-pricing-heading">
        <div>
          <span class="eclyps-pricing-eyebrow"><span aria-hidden="true">♛</span> SUBSCRIPTION PLANS</span>
          <h1>Choose a plan</h1>
          <p>Choose the plan that fits your investigations, then select a billing interval and payment method.</p>
        </div>
        <div class="eclyps-pricing-stats">
          <div><span>CURRENT PLAN</span><strong>No active plan</strong></div>
          <div><span>WALLET BALANCE</span><strong>$0.00</strong></div>
        </div>
      </div>
      <div class="eclyps-plan-intervals" role="tablist" aria-label="Billing interval">
        ${Object.keys(intervals).map((name) => `
          <button type="button" role="tab" class="eclyps-plan-interval${selectedInterval === name ? " is-selected" : ""}" data-action="plan-interval" data-interval="${name}" aria-selected="${selectedInterval === name}">${name}</button>`).join("")}
      </div>
      <div class="eclyps-plan-grid">
        ${plans.map((plan) => `
          <article class="eclyps-plan-card${plan.popular ? " is-popular" : ""}">
            <div class="eclyps-plan-icon">${plan.icon}</div>
            ${plan.popular ? '<span class="eclyps-plan-badge"><span aria-hidden="true">✣</span> MOST POPULAR</span>' : ""}
            <h2>${plan.name}</h2>
            <div class="eclyps-plan-price">${money(planPrice(plan, selectedInterval))}<span>${plan.name === "Free" ? " /forever" : intervals[selectedInterval].suffix}</span></div>
            <ul>${plan.features.map((feature) => `<li>${feature}</li>`).join("")}</ul>
            <button type="button" class="eclyps-choose-plan" data-action="choose" data-plan="${plan.name}">${plan.name === "Free" ? "Get started" : `Choose ${plan.name}`}<span aria-hidden="true">→</span></button>
          </article>`).join("")}
      </div>`;
  }

  function renderCheckout() {
    const interval = intervals[selectedInterval];
    const amount = planPrice(selectedPlan, selectedInterval);
    const root = ensureOverlay().querySelector(".eclyps-pricing-main");
    root.innerHTML = `
      <div class="eclyps-pricing-heading eclyps-checkout-heading">
        <div>
          <span class="eclyps-pricing-eyebrow"><span aria-hidden="true">♛</span> SUBSCRIPTION PLANS</span>
          <h1>Complete your purchase</h1>
        </div>
        <div class="eclyps-pricing-stats">
          <div><span>CURRENT PLAN</span><strong>No active plan</strong></div>
          <div><span>WALLET BALANCE</span><strong>$0.00</strong></div>
        </div>
      </div>
      <div class="eclyps-checkout-grid">
        <section class="eclyps-checkout-summary">
          <div class="eclyps-plan-icon">${selectedPlan.icon}</div>
          <strong class="eclyps-checkout-price">${money(amount)}<span>${interval.suffix}</span></strong>
          <span class="eclyps-pricing-eyebrow">SELECTED PLAN</span>
          <h2>${selectedPlan.name}</h2>
          <ul>${selectedPlan.features.map((feature) => `<li>${feature}</li>`).join("")}</ul>
          <button type="button" class="eclyps-change-plan" data-action="back"><span aria-hidden="true">←</span> &nbsp; Change plan</button>
        </section>
        <section class="eclyps-checkout-panel">
          <h2><span>✣</span> Checkout</h2>
          <p><span>Complete your subscription to</span> ${selectedPlan.name}</p>
          <h3><span aria-hidden="true">▣</span> &nbsp; Billing interval</h3>
          <div class="eclyps-interval-grid">
            ${Object.entries(intervals).map(([name, option]) => `
              <button type="button" class="eclyps-interval${selectedInterval === name ? " is-selected" : ""}" data-action="interval" data-interval="${name}" aria-pressed="${selectedInterval === name}">
                <strong><span aria-hidden="true">♧</span> &nbsp; ${name}</strong>
                <span>${name === "Weekly" ? "Short commitment, full access" : name === "Monthly" ? "Pay monthly — more flexibility" : name === "Yearly" ? "Best value — pay once per year" : "One payment, forever"}</span>
                <b>${money(planPrice(selectedPlan, name))}<small>${selectedPlan.name === "Free" ? "/forever" : option.suffix}</small></b>
                <span>${option.note}</span>
              </button>`).join("")}
          </div>
          <h3 class="eclyps-payment-heading"><span aria-hidden="true">▣</span> &nbsp; Payment method</h3>
          <div class="eclyps-payment-options">
            ${["Wallet balance", "Crypto", "Gift card"].map((method) => `
              <button type="button" data-action="payment" data-payment="${method}" aria-pressed="${selectedPayment === method}"><span aria-hidden="true">${method === "Crypto" ? "₿" : method === "Gift card" ? "♔" : "▣"}</span> &nbsp; ${method}</button>`).join("")}
          </div>
          <h3 class="eclyps-summary-heading"><span aria-hidden="true">▣</span> &nbsp; Summary</h3>
          <div class="eclyps-summary-line"><span><span>${selectedPlan.name}</span> · <span>${selectedInterval}</span></span><strong>${money(amount)}</strong></div>
          <div class="eclyps-summary-total"><strong>Total due today</strong><b>${money(amount)}</b></div>
          <label class="eclyps-terms"><input type="checkbox" data-action="terms"> I have read and agree to the Terms of Service.</label>
          <button type="button" class="eclyps-payment-submit" disabled>Payment setup required</button>
          <p class="eclyps-payment-notice">Payments aren't configured for this static preview. Prices are illustrative; no charge will be made.</p>
        </section>
      </div>`;
  }

  function openPlans() {
    selectedPayment = "";
    renderPlans();
    overlay.hidden = false;
    document.body.classList.add("eclyps-pricing-open");
    overlay.querySelector('[data-action="close"]').focus();
  }

  function close() {
    overlay.hidden = true;
    document.body.classList.remove("eclyps-pricing-open");
  }

  function onOverlayClick(event) {
    const control = event.target.closest("[data-action]");
    if (!control) return;
    const action = control.dataset.action;
    if (action === "close") close();
    if (action === "back") renderPlans();
    if (action === "choose") {
      selectedPlan = plans.find((plan) => plan.name === control.dataset.plan) || plans[0];
      selectedPayment = "";
      renderCheckout();
    }
    if (action === "interval") {
      selectedInterval = control.dataset.interval;
      renderCheckout();
    }
    if (action === "plan-interval") {
      selectedInterval = control.dataset.interval;
      renderPlans();
    }
    if (action === "payment") {
      selectedPayment = control.dataset.payment;
      overlay.querySelectorAll('[data-action="payment"]').forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.payment === selectedPayment));
      });
    }
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href="#pricing"]');
    if (link) {
      event.preventDefault();
      event.stopPropagation();
      openPlans();
      return;
    }
    const planButton = event.target.closest(".vLC-DG_planBtn, .vLC-DG_planBtnPrimary");
    if (planButton && ["Beginner", "Pro", "Researcher"].includes(planButton.dataset.plan)) {
      event.preventDefault();
      event.stopPropagation();
      selectedPlan = plans.find((plan) => plan.name === planButton.textContent.trim().replace("Choose ", "")) || plans[0];
      selectedInterval = "Monthly";
      selectedPayment = "";
      ensureOverlay();
      renderCheckout();
      overlay.hidden = false;
      document.body.classList.add("eclyps-pricing-open");
      overlay.querySelector('[data-action="close"]').focus();
    }
  }, true);

  initHeroBrand();
  document.querySelectorAll(".vLC-DG_planBtn, .vLC-DG_planBtnPrimary").forEach((button) => {
    button.dataset.plan = button.closest(".vLC-DG_plan, .vLC-DG_planFeatured")
      ?.querySelector(".vLC-DG_planName")?.textContent.trim() || "";
  });
  initLanguageMenu();
})();
