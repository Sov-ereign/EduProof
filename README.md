# 🥇 EduProof - Verifiable Skill Credentials on Stellar

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16.1-black)](https://nextjs.org/)
[![Stellar](https://img.shields.io/badge/Stellar-Soroban-7D00FF)](https://stellar.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6)](https://www.typescriptlang.org/)

> **Skill Credentials That Can't Be Faked**  
> A decentralized credentialing platform that issues tamper-proof, AI-verified credentials as Soulbound NFTs on the Stellar blockchain.

---

## 📜 Smart Contract Address

```
CDLZFC3SYJYDZT7KPHTZMVJJG7546OCNJS7VYM23LV7C7I2E3X5O75TE
```

**Network:** Stellar Testnet  
**Explorer:** [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CDLZFC3SYJYDZT7KPHTZMVJJG7546OCNJS7VYM23LV7C7I2E3X5O75TE)

---

## 🌐 Deployed Application

**Live Demo:** [Add your Vercel/Netlify URL here]

> Try it out with your Freighter wallet on Stellar Testnet!

---

## 🎯 Problem Statement

### The Credential Crisis

In today's digital world, **credentials are broken**:

- 📄 **Easy to Fake** - Anyone can Photoshop a certificate or claim false qualifications
- 🔓 **Hard to Verify** - Employers waste hours manually verifying credentials
- 🏢 **Centralized Control** - Universities and authorities can revoke or lose records
- 💰 **Verification Costs** - Background checks cost companies billions annually
- 🌍 **Global Barriers** - Cross-border credential verification is nearly impossible

### The Real-World Impact

- **86% of employers** have caught lies on resumes
- **$600B+ annually** spent on background verification globally
- **Weeks of delays** in hiring due to credential verification
- **Millions of refugees** cannot prove their qualifications

### Our Solution: EduProof

EduProof solves these problems by:

✅ **Issuing Soulbound NFTs** - Non-transferable credentials bound to your cryptographic identity  
✅ **AI-Powered Verification** - Automated evaluation of real work evidence (GitHub repos, portfolios)  
✅ **Blockchain Storage** - Permanent, tamper-proof records on Stellar  
✅ **Instant Verification** - Anyone can verify credentials in seconds, without centralized databases  
✅ **Global Accessibility** - Works anywhere, no paperwork or authorities needed

---

## ✨ Features

### For Students/Candidates

- 🔗 **Connect Wallet** - Use Freighter to connect your Stellar wallet
- 📂 **Submit Evidence** - Provide GitHub repos, portfolios, or project links
- 🤖 **AI Evaluation** - Get evaluated by AI agents using transparent, public rubrics
- 📝 **Interactive Tests** - Complete MCQ tests and coding challenges tailored to your work
- 🎖️ **Mint Credentials** - Earn Soulbound NFT credentials stored permanently on-chain

### For Verifiers/Employers

- 🔍 **Zero-Trust Verification** - Verify credentials without requiring login or third parties
- ⚡ **Instant Lookup** - Enter any wallet address to see all verified skills
- 🔗 **On-Chain Proof** - Click to verify transactions on Stellar Explorer
- 📊 **Transparent Scores** - See evaluation scores and evidence links
- 💼 **No Subscription Required** - Free, permissionless verification

### Platform Features

- 🛡️ **Soulbound NFTs** - Credentials are non-transferable and bound to wallets
- 📖 **Public Rubrics** - Transparent evaluation criteria for every skill
- 🌐 **Decentralized** - No centralized database or single point of failure
- 🔐 **Evidence-Backed** - Every credential links to real work samples
- 💎 **Multi-Skill Support** - Python, Rust, React, JavaScript, TypeScript, and more

---

## 🏗️ Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────┐   │
│  │  Landing Page  │  │ Student Portal │  │ Verifier Portal │   │
│  │   (Next.js)    │  │   (React 19)   │  │   (React 19)    │   │
│  └────────────────┘  └────────────────┘  └─────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                ┌───────────┴──────────┐
                │                      │
        ┌───────▼────────┐    ┌────────▼────────┐
        │  Freighter API │    │   Next.js API   │
        │ (Wallet Connect)│    │    Routes       │
        └───────┬────────┘    └────────┬────────┘
                │                      │
                │              ┌───────▼────────┐
                │              │  AI Services   │
                │              │  (OpenRouter)  │
                │              │  GitHub API    │
                │              └───────┬────────┘
                │                      │
        ┌───────▼──────────────────────▼────────┐
        │         STELLAR BLOCKCHAIN             │
        │  ┌──────────────────────────────────┐  │
        │  │    Soroban Smart Contracts       │  │
        │  │  (Rust - Soulbound NFT Logic)    │  │
        │  └──────────────────────────────────┘  │
        │                                         │
        │  ┌──────────────────────────────────┐  │
        │  │   Stellar Testnet Network        │  │
        │  │   (Transaction History & Memos)  │  │
        │  └──────────────────────────────────┘  │
        └─────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 16, React 19, TypeScript | Modern web application framework |
| **Styling** | Tailwind CSS 4, Framer Motion | Beautiful, animated UI components |
| **Blockchain** | Stellar (Soroban Testnet) | Smart contract platform |
| **Smart Contracts** | Rust (Soroban SDK) | Soulbound NFT minting logic |
| **Wallet** | Freighter Wallet | Stellar wallet integration |
| **AI Services** | OpenRouter API (Gemini) | Code evaluation and test generation |
| **APIs** | GitHub API | Repository analysis |
| **Database** | None (fully on-chain) | Decentralized data storage |

### Data Flow

1. **Student Submits Evidence**
   - Student connects Freighter wallet → Submits GitHub repo URL
   - Next.js API fetches repository data via GitHub API
   - OpenRouter AI analyzes code quality, architecture, best practices

2. **AI Evaluation**
   - AI generates rubric-based scores (0-100)
   - Creates personalized MCQ tests and coding challenges
   - Student must score ≥70% to proceed

3. **Credential Minting**
   - Smart contract called via Stellar SDK
   - Soulbound NFT minted to student's wallet address
   - Transaction memo stores credential metadata
   - Permanent record created on Stellar blockchain

4. **Verification**
   - Verifier enters wallet address on verifier portal
   - System queries Stellar blockchain for transaction history
   - Parses memos to extract credentials
   - Displays all verified skills with scores and evidence links

---

## 📸 Screenshots

### Landing Page
![Landing Page](./screenshots/landing-page.png)
*Modern, professional landing page with clear call-to-action*

### Student Portal - Credential Pipeline
![Student Portal](./screenshots/student-portal.png)
*Submit evidence, complete assessments, and mint your credentials*

### Verifier Portal - Instant Verification
![Verifier Portal](./screenshots/verifier-portal.png)
*Enter any wallet address to instantly verify credentials*

### Credential Display
![Credential Display](./screenshots/credential-view.png)
*View detailed credential information with on-chain proof*

> **Note:** Please add screenshots by taking screenshots of your running application at http://localhost:3000, saving them in a `screenshots/` folder, and updating the image paths above.

---

## � Getting Started

### Prerequisites

1. **Node.js** (v18 or higher) and **npm**
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify: `node --version` and `npm --version`

2. **Freighter Wallet** (browser extension)
   - Install from [freighter.app](https://freighter.app/)
   - Create a wallet and switch to **Testnet**

3. **Stellar Testnet Account** with test XLM
   - Use [Stellar Laboratory](https://laboratory.stellar.org/#account-creator?network=test) to create and fund

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/yourusername/EduProof.git
cd EduProof
```

**2. Install dependencies**

```bash
npm install
```

**3. Configure environment variables**

Create a `.env.local` file:

```bash
# Windows (PowerShell)
New-Item .env.local

# macOS/Linux
touch .env.local
```

Add your API keys to `.env.local`:

```env
# GitHub Personal Access Token (Required)
GITHUB_TOKEN=your_github_token_here

# OpenRouter API Key (Required)
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

**How to get API keys:**

- **GitHub Token**: Go to [GitHub Settings → Tokens](https://github.com/settings/tokens) → Generate new token (classic) → Select `public_repo` scope
- **OpenRouter Key**: Sign up at [OpenRouter.ai](https://openrouter.ai/) → Go to [Keys page](https://openrouter.ai/keys) → Create API key (free tier works!)

**4. Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser 🎉

---

## 📖 How It Works

### For Students (Earning Credentials)

1. **Access Pipeline** → Navigate to `/student` and connect your Freighter wallet
2. **Select Skill** → Choose from Python, Rust, React, JavaScript, TypeScript
3. **Submit Evidence** → Paste your GitHub repository URL for AI analysis
4. **Complete Assessments** → Pass MCQ test (≥70%) and solve coding challenges
5. **Mint Credential** → Sign the transaction to mint your Soulbound NFT
6. **Share & Verify** → Share your wallet address with employers for instant verification

### For Verifiers (Checking Credentials)

1. **Validation Node** → Navigate to `/verifier` portal
2. **Enter Address** → Paste any Stellar wallet address
3. **View Credentials** → See all verified skills with scores and dates
4. **Verify On-Chain** → Click links to verify transactions on Stellar Explorer

---

## 🔧 Smart Contract Details

### Contract Deployment

Our Soroban smart contract is deployed on **Stellar Testnet**:

```
Contract ID: CDLZFC3SYJYDZT7KPHTZMVJJG7546OCNJS7VYM23LV7C7I2E3X5O75TE
Network: Testnet
```

### Contract Functions

```rust
// Mint a new credential (Soulbound NFT)
pub fn mint_credential(
    env: Env,
    to: Address,
    skill: String,
    level: String,
    evidence: String,
    score: u32,
    category: String
) -> Result<(), ContractError>

// Get all skills for a user
pub fn get_user_skills(env: Env, user: Address) -> Vec<String>

// Get specific credential details
pub fn get_credential(env: Env, user: Address, skill: String) -> Credential
```

### Building Contracts (Optional)

If you want to deploy your own contract:

**1. Install Rust and Soroban CLI**

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add wasm32 target
rustup target add wasm32-unknown-unknown

# Install Soroban CLI
cargo install --locked soroban-cli
```

**2. Build the contract**

```bash
cd contracts
cargo build --target wasm32-unknown-unknown --release
```

**3. Deploy to Stellar Testnet**

```bash
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/eduproof_contracts.wasm \
  --source YOUR_SECRET_KEY \
  --network testnet
```

**4. Update contract ID in code**

Edit `src/lib/stellar.ts`:

```typescript
export const CONTRACT_ID = "YOUR_NEW_CONTRACT_ID";
```

---

## 🎯 Evaluation Rubrics

Each skill uses transparent, AI-evaluated rubrics:

### Python
- Code Readability (30%)
- Logic Correctness (30%)
- Use of Python Concepts (20%)
- Explanation Clarity (20%)

### Rust
- Memory Safety (35%)
- Code Quality (25%)
- Error Handling (25%)
- Documentation (15%)

### React
- Component Design (30%)
- State Management (25%)
- Code Quality (25%)
- User Experience (20%)

---

## � Future Scope and Plans

### Short-Term (Next 3 Months)

- [ ] **Mainnet Deployment** - Deploy contracts and dApp to Stellar mainnet
- [ ] **More Skills** - Add support for Solidity, Go, Swift, and design portfolios
- [ ] **Institutional Integration** - Partner with coding bootcamps and universities
- [ ] **Mobile App** - Native iOS/Android apps using Capacitor
- [ ] **Certificate Downloads** - Generate PDF certificates with QR codes linking to on-chain proof

### Medium-Term (6-12 Months)

- [ ] **IPFS Integration** - Store full evidence and test results on IPFS for permanence
- [ ] **Credential Stacking** - Combine multiple credentials into skill trees
- [ ] **DAO Governance** - Community voting on rubric updates and new skills
- [ ] **Employer Dashboard** - Advanced analytics and batch verification tools
- [ ] **Reputation System** - Build on-chain reputation based on credential history

### Long-Term Vision (1-2 Years)

- [ ] **Multi-Chain Support** - Expand to Ethereum, Polygon, and other chains
- [ ] **Government Recognition** - Work with governments to recognize blockchain credentials
- [ ] **Industry Standards** - Create open standards for blockchain-based credentials
- [ ] **Enterprise Solution** - White-label solution for companies to issue internal credentials
- [ ] **Global Credential Network** - Interoperable credentials across universities and employers worldwide

### How You Can Help

- 🌟 **Star this repo** - Help spread the word!
- 🐛 **Report issues** - Found a bug? Let us know
- 💡 **Suggest features** - Have ideas? Open an issue
- 🤝 **Contribute** - Pull requests are welcome!

---

## 🏗️ Project Structure

```
EduProof/
├── contracts/                 # Soroban smart contracts (Rust)
│   └── src/
│       └── lib.rs            # Soulbound NFT minting logic
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── evaluate/     # AI evaluation endpoints
│   │   │   └── github/       # GitHub API integration
│   │   ├── student/          # Student credential pipeline
│   │   ├── verifier/         # Verifier dashboard
│   │   └── page.tsx          # Landing page
│   ├── components/           # Reusable UI components
│   └── lib/
│       ├── stellar.ts        # Stellar blockchain integration
│       └── types.ts          # TypeScript type definitions
├── public/                   # Static assets
├── .env.local               # Environment variables (create this)
├── package.json             # Dependencies
└── README.md                # This file
```

---

## 🤝 Contributing

We welcome contributions! This project was built for the **Stellar Hackathon** and is open for improvements.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## � License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built for the **Stellar Meridian Hackathon 2025**
- Powered by **Stellar** and **Soroban** smart contracts
- AI evaluation by **OpenRouter** and **Google Gemini**
- Wallet integration via **Freighter**

---

## � Additional Resources

- [QUICKSTART.md](./QUICKSTART.md) - Quick setup guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment instructions
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues and solutions
- [Stellar Documentation](https://developers.stellar.org/)
- [Soroban Documentation](https://soroban.stellar.org/)

---

<div align="center">
  
### 🌟 Star this repo if you believe in decentralized, verifiable credentials!

**Built with ❤️ for the Stellar ecosystem**

[Report Bug](https://github.com/yourusername/EduProof/issues) · [Request Feature](https://github.com/yourusername/EduProof/issues) · [Documentation](./README.md)

</div>
