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
