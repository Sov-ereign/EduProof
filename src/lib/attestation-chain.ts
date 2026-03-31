import {
  Asset,
  Horizon,
  Keypair,
  Memo,
  Networks,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";

import { logger } from "@/lib/logger";

const HORIZON_URL = process.env.STELLAR_HORIZON_URL || "https://horizon-testnet.stellar.org";
const NETWORK_PASSPHRASE = process.env.STELLAR_NETWORK_PASSPHRASE || Networks.TESTNET;

const horizon = new Horizon.Server(HORIZON_URL);

function getAnchorKeypair() {
  const secret = process.env.ATTESTATION_ANCHOR_SECRET_KEY;
  if (!secret) {
    throw new Error("ATTESTATION_ANCHOR_SECRET_KEY is not configured");
  }
  return Keypair.fromSecret(secret);
}

export async function anchorAttestationHashOnChain(
  attestationId: string,
  artifactHash: string,
): Promise<string | null> {
  try {
    const keypair = getAnchorKeypair();
    const publicKey = keypair.publicKey();
    const account = await horizon.loadAccount(publicKey);

    const memoText = `AT:${attestationId.slice(0, 8)}:${artifactHash.slice(0, 12)}`.slice(0, 28);
    const tx = new TransactionBuilder(account, { fee: "100" })
      .addOperation(
        Operation.payment({
          destination: publicKey,
          asset: Asset.native(),
          amount: "0.00001",
        }),
      )
      .addMemo(Memo.text(memoText))
      .setTimeout(30)
      .setNetworkPassphrase(NETWORK_PASSPHRASE)
      .build();

    tx.sign(keypair);
    const response = await horizon.submitTransaction(tx);
    return response.hash;
  } catch (error) {
    logger.error({ err: error, attestationId }, "failed to anchor attestation hash on chain");
    return null;
  }
}
