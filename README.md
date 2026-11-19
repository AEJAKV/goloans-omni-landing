# GoLoans $1 Loan — Omni landing page

Static page (HTML/CSS/JS, no build step) for the $1 loan Omni campaign. Two paths:

- **Already applied** → IBV (bank verification): `https://onyx.goloans.ca/clients/inverite/add/`
- **New to GoLoans** → Express form: `https://onyx.goloans.ca/clients/application/express/`

## Files

```
index.html     page markup
styles.css     all styles (mobile first; tablet ≥720px, desktop ≥1024px)
app.js         links + UTM passthrough, GTM events, payday check, sticky mobile buttons
img/           relief-square.webp (desktop), relief-4x3.webp (tablet/mobile), logo, favicon
```

## Deploy on Vercel

New project → import this folder/repo → Framework preset **Other** → no build command → deploy.
Then add the domain/path you want (e.g. `offers.goloans.ca`) under Project → Domains.

## Config (top of app.js)

- `IBV_URL`, `EXPRESS_URL`: the two destination links. HTML `href`s are fallbacks; app.js sets the final links.
- `CAMPAIGN`: default `utm_campaign` added to the express link when the ad URL has none.
- `UTM_ON_IBV`: `false` keeps the IBV link exactly as given. Set to `true` to pass ad UTMs to it too.
- `PAYDAY_FEE_PER_100`: federal payday cap used for the "$70" comparison. Verify before launch.

## Tracking (dataLayer events for GTM)

- `cta_click` with `path` (`ibv` | `express`) and `location` (`hero`, `routes`, `check`, `closing`, `sticky`, `faq`)
- `call_click`, `payday_check` (answer), `faq_open` (question)

GTM container `GTM-MR27TSS`, Zoho PageSense and Vercel Web Analytics are included, same as the $1 page.

## Before launch: confirm

Search `CONFIRM` in index.html. Items: IBV step wording, the IBV FAQ answer, and every figure in the terms section.
Page is `noindex` (paid-traffic page). Remove the robots meta tag to allow indexing.
