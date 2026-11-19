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
})();
