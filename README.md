> **ARCHIVED.** This repo (`spoonie-me/soft-reset-school`) holds the old Bedcoders codebase, not the Soft Reset School app that actually runs at [softreset.school](https://softreset.school). The real app's source lives on `roismini` and hasn't been pushed to GitHub yet — once it is, it belongs in a separate repo (e.g. `spoonie-me/soft-reset-school-app`).
>
> Roi: this repo still needs the GitHub "Archive this repository" toggle flipped by hand (Settings → Danger Zone) — the GitHub App connected here doesn't have permission to do that or to create new repos.

# Bedcoders

Code from bed. Learn the Claude API, prompt engineering, agents, and tool-building — from your bed, your couch, wherever.

Sister project to [Spooniversity](../spooniversity). Resurrected 2026-05-07 from the pre-merger archive — the merger of Bedcoders into Spooniversity was reversed.

## Stack

- Vite 8 + React 19.2 + TypeScript
- Express 5 (`api/index.ts`) + Prisma 6
- Vercel deployment, custom domain `bedcoders.com`
- Stripe, Resend, Anthropic SDK

## Local dev

```bash
npm install
cp .env.example .env.local   # already populated locally; never committed
npm run dev
```

## Build

```bash
npm run build
```

Outputs to `dist/`. Vercel runs `prisma generate` via `vercel.json`.

## History

Archived as `~/roi-site/ARCHIVE-bedcoders-now-in-spooniversity/` when Bedcoders was folded into Spooniversity in early April 2026. On 2026-05-07 it was resurrected as a sister project — preserving the original techy aesthetic (void-dark, neon-signal, DM Mono) that didn't survive the merger.
