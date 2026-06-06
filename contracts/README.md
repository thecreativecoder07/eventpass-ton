# EventPass TON — Smart Contracts

## Overview

Soulbound Token (SBT) smart contracts for event ticketing on TON blockchain.

Written in **Tolk** using the **Acton** toolchain.

## Contracts

| Contract | Description |
|---|---|
| `EventPassSBT` | Non-transferable ticket NFT with cross-chain payment tracking |
| `EventFactory` | Event creation, management, and SBT deployment |
| `RoyaltySplitter` | Revenue distribution between organizer and platform |
| `CrossChainClaim` | Prevents double-minting from cross-chain swaps |

## Key Properties

- **Soulbound**: Tickets cannot be transferred — `transfer()` throws
- **Cross-chain provenance**: Each ticket records `paymentChain` and `paymentTxHash`
- **Check-in**: On-site verification via `checkIn()` — only ticket owner
- **Tier pricing**: General (1x), VIP (2x), Premium (5x)
- **Anti-double-mint**: `swapClaims` map ensures each swap ID mints exactly once

## Development

```bash
# Build contracts
npm run build

# Run tests
npm run test

# Deploy to testnet
npm run deploy:testnet

# Gas profiling
npm run gas-profile
```

## Architecture Notes

- Tolk is the primary smart contract language for TON (Tact is deprecated)
- Acton provides: compile, test, debug, deploy, TypeScript wrapper generation
- All contracts compile to TVM bytecode
- Gas costs are profiled during testing to optimize on-chain execution