# online_annavaram

Andhra Pradesh–style foods website. Built step‑by‑step, referencing `MERN_Stack_Project_Ecommerce_Hayroo` only for layout ideas. This repo is independent.

## Homepage (Andhra Foods)
- Slider shows three placeholder images: `home_image_1/2/3` (replace later).
- All images link to the Instagram handle (configurable).
- Categories tailored for Andhra foods: wheat (dalia), jaggery, sugar, ghee.
- Prices shown in rupees (₹).

Config: `online_annavaram/client/src/config/site.js`
- `instagramUrl`: set to your real Instagram handle.
- `currencySymbol`: default `₹`.
- `categories`: homepage/category dropdown.

## Prerequisites
- Node.js 18+ and npm

## Run (Dev)
```
cd online_annavaram/client
npm install
npm run dev
```
Open the URL printed by Vite (typically `http://localhost:5173`).

## Build (Prod)
```
cd online_annavaram/client
npm run build
```
Output in `online_annavaram/client/dist`.

## Deploy (Vercel)
Option A (via UI):
- Import the Git repo into Vercel.
- Set Project Root to `online_annavaram/client`.
- Framework preset: Vite.
- Build Command: `npm run build`. Output Directory: `dist`.

Option B (via config):
- The repo includes `vercel.json` that builds `online_annavaram/client` with `@vercel/static-build` and serves as a SPA with rewrites.

## Roadmap
- Wire real product data and cart/checkout.
- Add product detail routes and SEO meta.
- Integrate order/contact flows suitable for Andhra foods.
