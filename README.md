# EduProof

EduProof is a Next.js + Stellar project for issuing and verifying skill credentials with:
- AI-assisted evaluation
- on-chain credential evidence
- hybrid verifier monetization (Stripe + on-chain pass signal)
- signed evaluator attestations and replay-safe payment handling

## Current Status

This repository is in active upgrade mode toward a production-grade web3 app.

Implemented in the current codebase:
- Idempotent Stripe checkout/verify/webhook subscription grants
- Verifier authority endpoint: `GET /api/verifier/access`
- Attestation APIs:
  - `POST /api/attestations/create`
  - `GET /api/attestations/:id`
  - `POST /api/attestations/verify`
  - `GET|POST|DELETE /api/attestations/evaluators`
- Wallet challenge APIs for sensitive verifier actions:
  - `POST /api/verifier/wallet-challenge`
  - `POST /api/verifier/wallet-verify`
- Soroban contract v2 model in `contracts/src/lib.rs` with evaluator and attestation flows
- Event indexer worker: `scripts/indexer.ts`
- Structured API logging via `pino`
- CI workflow in `.github/workflows/ci.yml`

## Stack

- Frontend: Next.js 16, React 19, TypeScript
- Backend: Next.js route handlers
- Database: MongoDB
- Chain: Stellar + Soroban (testnet-oriented in current setup)
- Auth: NextAuth (GitHub)
- Payments: Stripe
- AI: OpenRouter-backed evaluation flows

## Architecture

- Student flow:
  - Submit evidence URL/repo
  - Generate test prep + questions/challenges
  - Evaluate and mint credential proof on Stellar
- Verifier flow:
  - Search candidate wallet
  - Resolve server-authoritative entitlement using `GET /api/verifier/access`
  - Unlock details when Stripe or on-chain entitlement is active
- Attestation flow:
  - Build canonical artifact metadata
  - Hash + evaluator-sign artifact hash
  - Persist artifact/read-model in Mongo
  - Anchor attestation reference on-chain
  - Verify integrity via `/api/attestations/verify`

## API Contracts

### Verifier Access

`GET /api/verifier/access?wallet=<optional_wallet>`

Response shape:
```json
{
  "allowed": true,
  "source": "stripe",
  "expiresAt": "2026-04-30T10:00:00.000Z"
}
```

`source` is one of: `"stripe" | "onchain" | "both" | "none"`.

### Create Attestation

`POST /api/attestations/create`

Request:
```json
{
  "owner": "G...",
  "repositoryUrl": "https://github.com/org/repo",
  "repositorySnapshotHash": "abc123...",
  "rubricVersion": "v1",
  "promptVersion": "v1",
  "modelId": "model-name",
  "score": 87
}
```

Response:
```json
{
  "attestationId": "hex-id",
  "artifactHash": "sha256hex",
  "txHash": "stellar-tx-hash-or-null"
}
```

### Verify Attestation

`POST /api/attestations/verify`

Request:
```json
{
  "attestationId": "hex-id",
  "artifactHash": "optional-sha256hex",
  "signer": "optional-signer",
  "rubricVersion": "optional-version",
  "modelId": "optional-model"
}
```

Response:
```json
{
  "valid": true,
  "signer": "G...",
  "rubricVersion": "v1",
  "modelId": "model-name",
  "artifactHash": "sha256hex"
}
```

## Local Development

### Prerequisites

- Node.js 22+ and npm
- MongoDB connection string
- GitHub OAuth app for NextAuth
- Stripe test keys/webhook secret
- Stellar/Freighter for on-chain interactions

### Install

```bash
npm install
```

### Environment

Copy `.env.example` to `.env.local` and fill values:

```env
# Auth
GITHUB_ID=
GITHUB_SECRET=
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

# Database
MONGODB_URI=

# AI / Evaluation
OPENROUTER_API_KEY=
GITHUB_TOKEN=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Attestations / Evaluator signing
EVALUATOR_SECRET_KEY=
EVALUATOR_ADMIN_IDS=
ATTESTATION_ANCHOR_SECRET_KEY=
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015

# Security controls
ENFORCE_WALLET_CHALLENGE=false
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
LOG_LEVEL=info

# Optional app URL override for redirects
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Run

```bash
npm run dev
```

### Checks

```bash
npm run lint
npm run typecheck
npm run build
```

Contract checks:

```bash
cd contracts
cargo check --target wasm32-unknown-unknown
```

## CI

CI workflow is defined in `.github/workflows/ci.yml` and runs:
- `npm ci`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `cargo check --target wasm32-unknown-unknown` (contracts)

## Contracts

Soroban contract source:
- `contracts/src/lib.rs`

Current v2 contract model includes:
- Evaluator registry (`register_evaluator`, `revoke_evaluator`)
- Attestation submission (`submit_attestation`)
- On-chain validity check (`verify_attestation`)
- User attestation lookup (`get_attestations_by_user`)

## Important Notes

- `npm run build` requires `MONGODB_URI` to be present because API routes are evaluated during build data collection.
- Lint currently permits `any` and some strict React text/effect rules to keep CI unblocked while codebase typing cleanup is in progress.
- `contracts/target` artifacts are intentionally not tracked.

## License

MIT. See `LICENSE`.
