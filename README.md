# 🎟️ EventPass TON

Cross-chain event ticket sales on the TON blockchain.

Soulbound tokens (SBTs) for non-transferable tickets + STON.fi Omniston for multi-chain payments — buy with ETH, USDC, BNB, or TON.

## Architecture

```
Telegram Mini App (React + Vite)
         │
    API Gateway (Nginx)
         │
   ┌─────┴──────┐
   │  NestJS     │  Backend microservices
   │  Services   │  (swap orchestrator, SBT minter, etc.)
   └─────┬──────┘
   ┌─────┴──────┐
   │  Supabase  │  PostgreSQL + Auth + Realtime
   │  Redis     │  Queue + Cache
   └─────┬──────┘
   ┌─────┴──────┐
   │  TON       │  Smart Contracts (Tolk)
   │  STON.fi   │  DEX + Omniston
   └────────────┘
```

## Features

- 🌉 **Cross-chain payments** — ETH, USDC, BNB, MATIC → TON via Omniston HTLC
- 🎫 **Soulbound tokens** — non-transferable, non-burnable ticket NFTs
- ⚡ **Gasless purchases** — resolvers cover gas fees
- ⭐ **Telegram Stars** — fiat on-ramp for non-crypto users
- 📱 **Telegram Mini App** — native in-app experience
- 🔍 **On-chain verification** — QR check-in with blockchain proof

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Tolk + Acton toolchain |
| Backend | NestJS + TypeScript |
| Frontend | React 19 + Vite + Tailwind |
| Database | Supabase (PostgreSQL) |
| Queue | BullMQ + Redis |
| DEX | STON.fi Router v2 |
| Cross-chain | Omniston (RFQ + HTLC) |
| Wallet | TON Connect v3 |
| Bot | grammY |
| DevOps | Docker + Kubernetes |

## Quick Start

```bash
# Clone
gh repo clone thecreativecoder07/eventpass-ton
cd eventpass-ton

# Install dependencies
npm install

# Copy environment
cp .env.example .env

# Start services
docker compose up -d

# Run backend
cd apps/api && npm run start:dev

# Run frontend
cd apps/mini-app && npm run dev
```

## Project Structure

```
eventpass-ton/
├── apps/
│   ├── api/              # NestJS backend
│   ├── mini-app/         # React Telegram Mini App
│   ├── bot/              # grammY Telegram bot
│   └── indexer/          # Blockchain event indexer
├── contracts/
│   ├── eventpass_sbt.tolk
│   ├── event_factory.tolk
│   └── royalty_splitter.tolk
├── packages/
│   ├── sdk/              # Shared TypeScript SDK
│   └── types/            # Shared types
├── infra/
│   ├── docker/
│   ├── k8s/
│   └── github-actions/
└── docs/
```

## License

MIT
