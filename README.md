# 🥇 EduProof Zero

**Skill Credentials That Can't Be Faked**

EduProof Zero is a Web3-based system that issues tamper-proof, wallet-bound credentials backed by real evidence. Verified by AI and stored permanently on the Stellar blockchain.

## 🚀 Features

- **Evidence-Based Evaluation**: Submit GitHub repos, Google Docs, Loom videos, or portfolio links
- **AI-Powered Scoring**: Transparent rubric-based evaluation system
- **Soulbound NFTs**: Non-transferable credentials minted on Stellar (Soroban)
- **Zero-Trust Verification**: Anyone can verify credentials on-chain without login
- **Public Rubrics**: Transparent evaluation criteria for each skill

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS, Framer Motion
- **Blockchain**: Stellar (Soroban Smart Contracts)
- **Wallet**: Freighter Extension
- **Language**: TypeScript, Rust (for contracts)

## 📋 Prerequisites

1. **Node.js** 18+ and npm/yarn
2. **Freighter Wallet Extension** - [Install here](https://freighter.app/)
3. **Stellar Testnet Account** - Funded with testnet XLM (use [Stellar Laboratory](https://laboratory.stellar.org/#account-creator?network=test))

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment (Recommended)

To avoid GitHub API rate limits (which cause 403 errors), create a `.env.local` file in the root directory:

```bash
touch .env.local
```

Add your GitHub Personal Access Token:

```env
GITHUB_TOKEN=your_github_token_here
```

1. Go to [GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)](https://github.com/settings/tokens)
2. Generate a new token with `public_repo` scope.
3. Paste it into `.env.local`.

### 3. Deploy Smart Contract (Optional)

If you want to deploy your own contract:

```bash
cd contracts
# Build the contract
cargo build --target wasm32-unknown-unknown --release

# Deploy using Soroban CLI
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/eduproof_contracts.wasm \
  --source <your-secret-key> \
  --network testnet
```

Update `CONTRACT_ID` in `src/lib/stellar.ts` with your deployed contract ID.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage

### For Students

1. **Connect Wallet**: Click "Connect Freighter" and approve the connection
2. **Select Skill**: Choose from Python, Rust, React, JavaScript, or TypeScript
3. **Submit Evidence**: Paste your GitHub repo, Google Doc, Loom video, or portfolio link
4. **Get Evaluated**: AI analyzes your evidence against a public rubric
5. **Mint Credential**: If you pass (score ≥ 70), mint your credential as an NFT

### For Verifiers/Employers

1. **Enter Wallet Address**: Paste any Stellar wallet address
2. **View Credentials**: See all verified skills with scores and evidence links
3. **Verify on Explorer**: Click to verify the transaction on Stellar Explorer

## 🏗️ Project Structure

```
├── contracts/          # Soroban smart contracts (Rust)
│   └── src/
│       └── lib.rs      # Main contract logic
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── evaluate/  # AI evaluation endpoint
│   │   ├── student/        # Student dashboard
│   │   ├── verifier/       # Verifier dashboard
│   │   └── page.tsx        # Landing page
│   └── lib/
│       ├── stellar.ts      # Stellar blockchain integration
│       └── ipfs.ts         # IPFS helpers (future)
```

## 🔧 Configuration

### Contract Address

Update the contract ID in `src/lib/stellar.ts`:

```typescript
export const CONTRACT_ID = "YOUR_CONTRACT_ID_HERE";
```

### Network

Currently configured for Stellar Testnet. To switch to mainnet:

```typescript
export const NETWORK_PASSPHRASE = Networks.PUBLIC;
export const RPC_URL = "https://soroban-rpc.mainnet.stellar.org";
export const HORIZON_URL = "https://horizon.stellar.org";
```

## 🎯 Evaluation Rubrics

Each skill has a transparent rubric:

- **Python**: Code Readability (30%), Logic Correctness (30%), Use of Concepts (20%), Explanation Clarity (20%)
- **Rust**: Memory Safety (35%), Code Quality (25%), Error Handling (25%), Documentation (15%)
- **React**: Component Design (30%), State Management (25%), Code Quality (25%), User Experience (20%)

## 🔒 Security Features

- **Soulbound Tokens**: Credentials are non-transferable
- **On-Chain Storage**: All credentials stored on Stellar blockchain
- **Public Verification**: No centralized database
- **Evidence Hashing**: Evidence links are stored and verifiable

## 🚧 Future Enhancements

- [ ] Full IPFS integration for evidence storage
- [ ] Multi-chain support
- [ ] DAO governance for rubric updates
- [ ] Skill reputation system
- [ ] Industry-specific credential standards
- [ ] Government-backed credential support

## 📝 License

MIT License - Built for Stellar Hackathon

## 🤝 Contributing

This is a hackathon project. Contributions welcome!

## 🎉 Demo

Live demo available at: [Your deployment URL]

---

**Built with ❤️ for the Stellar Hackathon**
