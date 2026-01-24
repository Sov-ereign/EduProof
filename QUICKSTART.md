# ⚡ Quick Start Guide

Get EduProof Zero running in 5 minutes!

## 🚀 Fast Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Check Setup

```bash
npm run check-setup
```

### 3. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` 🎉

## 📱 First Time Setup

### Install Freighter Wallet

1. Go to [freighter.app](https://freighter.app/)
2. Install the browser extension
3. Create a new wallet or import existing
4. **Switch to Testnet** in Freighter settings

### Get Testnet XLM

1. Visit [Stellar Laboratory](https://laboratory.stellar.org/#account-creator?network=test)
2. Generate a test account
3. Fund it with testnet XLM (free!)

## 🧪 Test the App

### Student Flow

1. Go to `/student`
2. Click "Connect Freighter"
3. Select a skill (e.g., Python)
4. Paste a GitHub repo URL (e.g., `https://github.com/yourusername/yourrepo`)
5. Click "Run AI Evaluation"
6. If score ≥ 70, click "Mint Credential NFT"

### Verifier Flow

1. Go to `/verifier`
2. Paste a wallet address that has credentials
3. View all verified skills!

## 🔧 Deploy Contract (Optional)

If you want to deploy your own contract:

### Windows (PowerShell)

```powershell
$env:SECRET_KEY="your-secret-key"
.\scripts\deploy-contract.ps1 -Network testnet
```

### Mac/Linux

```bash
SECRET_KEY=your-secret-key ./scripts/deploy-contract.sh testnet
```

Then update `src/lib/stellar.ts` with your contract ID.

## 🚢 Deploy to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Deploy! (It auto-detects Next.js)

## ❓ Troubleshooting

### Wallet won't connect
- ✅ Make sure Freighter is installed and unlocked
- ✅ Check you're on Testnet in Freighter settings
- ✅ Refresh the page

### Contract errors
- ✅ Verify contract ID in `src/lib/stellar.ts`
- ✅ Check network (testnet vs mainnet)
- ✅ Ensure account has XLM for fees

### Build errors
- ✅ Run `npm install` again
- ✅ Check Node.js version (need 18+)
- ✅ Delete `node_modules` and `.next`, then reinstall

## 🎯 Next Steps

- Read [README.md](./README.md) for full documentation
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment details
- Start proving your skills! 🚀

