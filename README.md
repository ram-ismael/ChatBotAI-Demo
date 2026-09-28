# ChatBotAI — Business Assistant Demo

A responsive, static demo of AI-assisted customer conversations across 13 business sectors.

**Live demo:** https://ram-ismael.github.io/ChatBotAI-Demo/

## Features

- Business-specific prompts and deterministic, streamed sample replies.
- Conversation search, local history, resolution/reopening, deletion and text export.
- Simulated metrics and an activity feed.
- Responsive conversation and insights drawers.
- Saved compact-density and reduced-motion preferences.
- Local replies continue to work if connectivity is lost after loading the app.

## Demo boundaries

AI replies, customer records and metrics are simulated. There is no language-model API,
backend, authentication, booking, payment, CRM or medical service. Nothing is sent to an AI provider.
Conversations are stored only in this browser (up to 80 conversations, 200 messages each).
Clearing browser data removes history; use Export chat to save a copy. Older entries roll off these limits.
Google Fonts may be requested for typography; system fonts are the fallback.

## Development

Use Node.js 24.15+ (Node 24 LTS recommended) and npm.

```sh
npm ci
npm start
```

Open http://localhost:4200. All application files are in this repository root; no backend is required.

```sh
npm run test:ci
npm run build:pages
```

The deployable static files are generated in `dist/chatbotai-demo/browser/`.
For another hosting path, run `npm run build -- --base-href /your-path/`.

## Deployment

GitHub Actions tests, builds and deploys to GitHub Pages when `main` is updated.
In repository Settings → Pages, the publishing source is GitHub Actions.

## Technology

Angular 22, TypeScript, Tailwind CSS 4 and Vitest. See LICENSE for the project license.
