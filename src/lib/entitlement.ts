import { ObjectId } from "mongodb";

import clientPromise from "@/lib/mongodb";
import { getOnChainSubscriptionStatus } from "@/lib/stellar-server";
import type { Entitlement, EntitlementSource } from "@/types/attestation";

export async function getUserEntitlement(
  userId: string,
  walletAddress?: string | null,
): Promise<Entitlement> {
  const client = await clientPromise;
  const db = client.db();

  const user = await db.collection("users").findOne<{
    isSubscribed?: boolean;
    subscriptionExpiry?: Date;
  }>({ _id: new ObjectId(userId) });

  const stripeExpiry = user?.subscriptionExpiry ? new Date(user.subscriptionExpiry) : null;
  const stripeActive = Boolean(user?.isSubscribed && stripeExpiry && stripeExpiry.getTime() > Date.now());

  let onChainActive = false;
  let onChainExpiry: Date | null = null;

  if (walletAddress) {
    const onChain = await getOnChainSubscriptionStatus(walletAddress);
    onChainActive = onChain.active;
    onChainExpiry = onChain.expiresAt;
  }

  let source: EntitlementSource = "none";
  if (stripeActive && onChainActive) source = "both";
  else if (stripeActive) source = "stripe";
  else if (onChainActive) source = "onchain";

  const expiresAtDate =
    source === "both"
      ? new Date(Math.max(stripeExpiry?.getTime() || 0, onChainExpiry?.getTime() || 0))
      : source === "stripe"
        ? stripeExpiry
        : source === "onchain"
          ? onChainExpiry
          : null;

  return {
    allowed: source !== "none",
    source,
    expiresAt: expiresAtDate ? expiresAtDate.toISOString() : null,
  };
}
