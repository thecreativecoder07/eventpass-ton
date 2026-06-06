# 🎟️ EventPass TON

Cross-chain event ticketing as **Soulbound Tokens (SBTs)** on the TON blockchain.

Buy tickets with **any token on any chain** — ETH, USDC, BNB, MATIC — powered by **STON.fi Router v2 + Omniston** for atomic cross-chain swaps.

## 🌉 Architecture

```
Telegram Mini App (React)
        │
        ▼
  NestJS Backend (API + Swap Orchestrator + SBT Minter)
        │
        ├── STON.fi Router v2 (same-chain DEX)
        ├── Omniston (cross-chain swaps via HTLC)
        ├── TON Connect (wallet auth)
        └── Telegram Bot (Stars payments + notifications)
        │
        ▼
  TON Blockchain (Tolk Smart Contracts)
        ├── EventPassSBT — Soulbound ticket token
        ├── EventFactory — Event creation & management
        └── RoyaltySplitter — Revenue distribution
```

## 📦 Monorepo Structure

```
eventpass-ton/
├── contracts/          # Tolk smart contracts (Acton toolchain)
├── backend/            # NestJS microservices
│   ├── api-gateway/
│   ├── event-service/
│   ├── swap-orchestrator/
│   ├── sbt-minter/
│   ├── indexer/
│   └── notification-service/
├── mini-app/           # React + Vite Telegram Mini App
├── bot/                # grammY Telegram bot
├── infra/              # Docker, K8s, CI/CD
└── docs/               # Architecture & API docs
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start backend in dev mode
cd backend && npm run start:dev

# Start Mini App in dev mode
cd mini-app && npm run dev

# Start Telegram bot
cd bot && npm run dev
```

## 🔗 Key Integrations

- **STON.fi Router v2** — Same-chain DEX swaps on TON
- **Omniston** — Cross-chain atomic swaps (ETH/USDC/BNB → TON)
- **TON Connect** — Wallet authentication & transaction signing
- **Telegram Stars** — Fiat on-ramp for non-crypto users
- **Acton** — Tolk smart contract toolchain

## 📄 License

MIT
