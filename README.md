# online_annavaram

Stepwise rebuild of an e‑commerce platform UI and APIs, replicated feature‑by‑feature from the reference project `MERN_Stack_Project_Ecommerce_Hayroo`, but implemented independently here.

## Step 1: Home Page (Complete)

What’s done:
- New React client scaffolded with Vite in `online_annavaram/client`.
- Tailwind CSS configured for styling to match the reference layout classes.
- Base layout with `NavBar` and `Footer` (`src/components/layout/Layout.jsx`).
- Home page composed of `Slider`, `ProductCategory` (category/search/price slider), and `SingleProduct` (product grid) in `src/components/shop/home/`.
- Verified production build.

Next steps will bring real data, routing, and server integration.

## Prerequisites
- Node.js 18+ and npm

## Run the client (Dev)
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
Build output is in `online_annavaram/client/dist`.

## Notes
- The reference repository is used only for guidance; code is re‑implemented here.
- Server/API and real data wiring will be added in subsequent steps.

