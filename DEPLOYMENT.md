# 🚀 Deployment Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Smart Contract Deployment

### Prerequisites

- [Soroban CLI](https://soroban.stellar.org/docs/getting-started/setup) installed
- Stellar Testnet account with XLM (use [Stellar Laboratory](https://laboratory.stellar.org/#account-creator?network=test))

### Build Contract

```bash
cd contracts
cargo build --target wasm32-unknown-unknown --release
```

### Deploy Contract

```bash
# Set your secret key (or use --source flag)
export SECRET_KEY="your-secret-key-here"

# Deploy to testnet
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/eduproof_contracts.wasm \
  --source $SECRET_KEY \
  --network testnet
```

### Update Contract ID

After deployment, copy the contract ID and update it in `src/lib/stellar.ts`:

```typescript
export const CONTRACT_ID = "YOUR_DEPLOYED_CONTRACT_ID";
```

## Production Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables if needed
4. Deploy!

### Other Platforms

The app is a standard Next.js app and can be deployed to:
- Netlify
- Railway
- AWS Amplify
- Any Node.js hosting platform

## Environment Variables

Create a `.env.local` file (optional):

```env
NEXT_PUBLIC_CONTRACT_ID=your-contract-id
NEXT_PUBLIC_NETWORK=testnet
```

## Testing

### Test Student Flow

1. Install [Freighter Wallet](https://freighter.app/)
2. Create/fund a testnet account
3. Go to `/student`
4. Connect wallet
5. Submit a GitHub repo URL
6. Mint credential

### Test Verifier Flow

1. Go to `/verifier`
2. Paste a wallet address that has minted credentials
3. View verified skills

## Troubleshooting

### Wallet Connection Issues

- Ensure Freighter extension is installed and unlocked
- Check that you're on Stellar Testnet
- Verify your account is funded with testnet XLM

### Contract Errors

- Verify contract ID is correct
- Check network (testnet vs mainnet)
- Ensure contract is deployed and initialized

### Evaluation API Errors

- Check that the evidence URL is publicly accessible
- GitHub repos must be public
- Verify URL format is correct

## Network Configuration

### Switch to Mainnet

Update `src/lib/stellar.ts`:

```typescript
export const NETWORK_PASSPHRASE = Networks.PUBLIC;
export const RPC_URL = "https://soroban-rpc.mainnet.stellar.org";
export const HORIZON_URL = "https://horizon.stellar.org";
```

**⚠️ Warning**: Only use mainnet with real XLM and after thorough testing!

## Support

For issues or questions:
- Check the [README.md](./README.md)
- Review Stellar [Soroban Documentation](https://soroban.stellar.org/docs)
- Check [Stellar Discord](https://discord.gg/stellar)

