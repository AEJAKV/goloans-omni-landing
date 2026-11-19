(function () {
  "use strict";

  /* ---------- CONFIG ---------- */
  var IBV_URL = "https://onyx.goloans.ca/clients/inverite/add/";
  var EXPRESS_URL = "https://onyx.goloans.ca/clients/application/express/";
  var CAMPAIGN = "omni-one-dollar-loan";
  var LOAN = 500;
  var PAYDAY_FEE_PER_100 = 14; // VERIFY BEFORE LAUNCH: federal cap as of Jan 1, 2025
  var GO_FEE = 1;
  // Pass ad UTMs to the IBV link too? Off by default so the verification link stays exactly as given.
  var UTM_ON_IBV = false;

  window.dataLayer = window.dataLayer || [];
  function track(ev, data) {
    var o = { event: ev };
    for (var k in data) o[k] = data[k];
    window.dataLayer.push(o);
  }

  /* ---------- CTA links + UTM passthrough ---------- */
  var incoming = new URLSearchParams(location.search);
  var keep = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid"];
  function withUtms(base) {
    var u = new URL(base);
    keep.forEach(function (k) { if (incoming.get(k)) u.searchParams.set(k, incoming.get(k)); });
    if (!u.searchParams.get("utm_campaign")) u.searchParams.set("utm_campaign", CAMPAIGN);
    return u.toString();
  }
  var expressHref = withUtms(EXPRESS_URL);
  var ibvHref = UTM_ON_IBV ? withUtms(IBV_URL) : IBV_URL;

  document.querySelectorAll("[data-cta]").forEach(function (a) {
    var path = a.getAttribute("data-cta");
    a.href = path === "ibv" ? ibvHref : expressHref;
    a.addEventListener("click", function () {
      track("cta_click", { path: path, location: a.getAttribute("data-loc") || "" });
    });
  });
  document.querySelectorAll("[data-call]").forEach(function (a) {
    a.addEventListener("click", function () { track("call_click", {}); });
  });

  /* ---------- Money math ---------- */
  var payday = LOAN / 100 * PAYDAY_FEE_PER_100;
  document.querySelectorAll("[data-payday]").forEach(function (el) { el.textContent = "$" + payday; });
  document.querySelectorAll("[data-save]").forEach(function (el) { el.textContent = "$" + (payday - GO_FEE); });
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Payday check ---------- */
  var answers = {
    "1": 'Borrow $500 and pay it off on payday. That’s well inside 14 days, so your total cost is <span class="figure">$1</span>.',
    "2": 'Pay off the $500 on payday, within 14 days of receiving it, and your total cost is <span class="figure">$1</span>.',
    "3": 'No problem. Your loan runs 91 to 120 days, so you can repay on your regular schedule. The $1 total applies if you pay it off within 14 days of receiving it; otherwise the standard cost applies. <a href="#terms">See the full terms.</a>'
  };
  var keys = document.querySelectorAll("[data-pay]");
  var box = document.getElementById("answer");
  var txt = document.getElementById("answer-text");
  keys.forEach(function (b) {
    b.addEventListener("click", function () {
      keys.forEach(function (k) { k.setAttribute("aria-pressed", k === b ? "true" : "false"); });
      txt.innerHTML = answers[b.getAttribute("data-pay")];
      box.hidden = false;
      box.classList.remove("show"); void box.offsetWidth; box.classList.add("show");
      track("payday_check", { answer: b.textContent.trim() });
    });
  });

  /* ---------- FAQ tracking ---------- */
  document.querySelectorAll(".faq details").forEach(function (d) {
    d.addEventListener("toggle", function () {
      if (d.open) track("faq_open", { question: d.querySelector("summary").textContent.trim() });
    });
  });

  /* ---------- Sticky mobile dock: shows after the hero choices scroll away, hides at the closing CTAs ---------- */
  var dock = document.getElementById("dock");
  var heroPaths = document.getElementById("hero-paths");
  var closeCtas = document.getElementById("close-ctas");
  if (dock && "IntersectionObserver" in window) {
    var heroGone = false, closeVisible = false;
    var links = dock.querySelectorAll("a");
    var update = function () {
      var on = heroGone && !closeVisible;
      dock.classList.toggle("on", on);
      dock.setAttribute("aria-hidden", on ? "false" : "true");
      links.forEach(function (l) { l.tabIndex = on ? 0 : -1; });
    };
    new IntersectionObserver(function (e) {
      heroGone = !e[0].isIntersecting && e[0].boundingClientRect.top < 0; update();
    }).observe(heroPaths);
    new IntersectionObserver(function (e) {
      closeVisible = e[0].isIntersecting; update();
    }).observe(closeCtas);
  }

  /* ---------- Motion (only when html.anim is set: visitor allows motion) ---------- */
  var root = document.documentElement;
  if (root.classList.contains("anim")) {
    var counters = document.querySelectorAll(".ledger [data-count]");
    var stamp = document.querySelector(".v-stamp");
    var total = stamp && stamp.closest(".cell--total");
    var shineBtn = document.querySelector(".paths .go--orange");
    counters.forEach(function (el) { el.textContent = "$0.00"; });

    var countUp = function (el, to, ms) {
      var t0 = null;
      var step = function (t) {
        if (!t0) t0 = t;
        var p = Math.min((t - t0) / ms, 1);
        var e = 1 - Math.pow(1 - p, 3);
        el.textContent = "$" + (to * e).toFixed(2);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    var playHero = function () {
      root.classList.add("hero-in");
      setTimeout(function () { counters.forEach(function (el) { countUp(el, +el.getAttribute("data-count"), 650); }); }, 500);
      setTimeout(function () {
        if (stamp) stamp.classList.add("is-stamped");
        if (total) { total.classList.add("flash"); setTimeout(function () { total.classList.remove("flash"); }, 400); }
      }, 1200);
      setTimeout(function () { if (shineBtn) shineBtn.classList.add("shine"); }, 1700);
    };

    // Wait until PageSense has revealed the page (it hides <body> while it loads), then play once.
    var started = false;
    var tryStart = function () {
      if (started) return;
      if (document.getElementById("zps-page-screen")) { requestAnimationFrame(tryStart); return; }
      started = true;
      requestAnimationFrame(playHero);
    };
    tryStart();
    setTimeout(function () { if (!started) { started = true; playHero(); } }, 11000);

    // Scroll-triggered: comparison bars and closing headline, once each.
    var once = document.querySelectorAll(".bars-card, .close");
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
        });
      }, { threshold: 0.35 });
      once.forEach(function (el) { io.observe(el); });
    } else {
      once.forEach(function (el) { el.classList.add("in"); });
    }
  }
})();
