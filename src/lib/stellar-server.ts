import { Horizon, Networks } from "@stellar/stellar-sdk";

const HORIZON_URL = process.env.STELLAR_HORIZON_URL || "https://horizon-testnet.stellar.org";
const NETWORK = process.env.STELLAR_NETWORK || Networks.TESTNET;

const horizonServer = new Horizon.Server(HORIZON_URL);

export interface OnChainSubscriptionStatus {
  active: boolean;
  expiresAt: Date | null;
  txHash: string | null;
  network: string;
}

const SUBSCRIPTION_DURATION_DAYS = 30;

export async function getOnChainSubscriptionStatus(
  walletAddress: string,
): Promise<OnChainSubscriptionStatus> {
  try {
    const history = await horizonServer
      .transactions()
      .forAccount(walletAddress)
      .limit(50)
      .order("desc")
      .call();

    for (const record of history.records) {
      if (!record.successful) continue;
      if (record.memo_type !== "text" || !record.memo?.startsWith("SUB:MONTHLY:")) continue;

      const startedAt = new Date(record.created_at);
      const expiresAt = new Date(startedAt.getTime() + SUBSCRIPTION_DURATION_DAYS * 24 * 60 * 60 * 1000);
      const active = expiresAt.getTime() > Date.now();

      return {
        active,
        expiresAt,
        txHash: record.hash,
        network: NETWORK,
      };
    }

    return { active: false, expiresAt: null, txHash: null, network: NETWORK };
  } catch {
    return { active: false, expiresAt: null, txHash: null, network: NETWORK };
  }
}
