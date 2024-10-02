# OpenAI Realtime Worker

This is an implementation of an [OpenAI Relay Server](https://github.com/openai/openai-realtime-console/tree/main/relay-server) using [Cloudflare Workers](https://developers.cloudflare.com/workers) and the delightful [Hono](https://honojs.dev) framework.

## Install

Copy [.dev.vars.example](./.dev.vars.example) to .dev.vars and add your [OpenAI API Key](https://platform.openai.com).

```bash
npm install
```

## Develop

```bash
npm run dev
```

## Deploy

Add your OpenAI API Key to secret management

```bash
npx wrangler secret put OPENAI_API_KEY
```

```bash
npm run deploy
```
