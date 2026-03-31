import crypto from "crypto";

import { Keypair } from "@stellar/stellar-sdk";
import { ObjectId } from "mongodb";

import clientPromise from "@/lib/mongodb";

const CHALLENGE_TTL_MS = 10 * 60 * 1000;
const VERIFICATION_TTL_MS = 30 * 60 * 1000;
let indexesReady = false;

interface StoredChallenge {
  userId: ObjectId;
  wallet: string;
  nonce: string;
  message: string;
  createdAt: string;
  expiresAt: string;
  usedAt?: string | null;
  createdIp?: string | null;
}

function buildChallengeMessage(wallet: string, nonce: string, issuedAt: string) {
  return [
    "EduProof Wallet Verification",
    `wallet:${wallet}`,
    `nonce:${nonce}`,
    `issuedAt:${issuedAt}`,
  ].join("\n");
}

function assertObjectId(id: string): ObjectId {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid user id");
  }
  return new ObjectId(id);
}

async function ensureIndexes() {
  if (indexesReady) return;

  const client = await clientPromise;
  const db = client.db();
  const challenges = db.collection("walletChallenges");

  await challenges.createIndex({ nonce: 1 }, { unique: true, name: "uniq_wallet_nonce" });
  await challenges.createIndex({ userId: 1, wallet: 1, expiresAt: 1 }, { name: "idx_wallet_user_expiry" });
  await challenges.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "ttl_wallet_challenge" });
  indexesReady = true;
}

export async function issueWalletChallenge(userId: string, wallet: string, ip?: string | null) {
  await ensureIndexes();

  const client = await clientPromise;
  const db = client.db();
  const challenges = db.collection("walletChallenges");

  const normalizedWallet = wallet.trim();
  const objectId = assertObjectId(userId);
  const nonce = crypto.randomBytes(18).toString("base64url");
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS).toISOString();
  const message = buildChallengeMessage(normalizedWallet, nonce, createdAt);

  const doc: StoredChallenge = {
    userId: objectId,
    wallet: normalizedWallet,
    nonce,
    message,
    createdAt,
    expiresAt,
    createdIp: ip || null,
  };

  await challenges.insertOne(doc);

  return {
    wallet: normalizedWallet,
    nonce,
    message,
    expiresAt,
  };
}

export async function verifyWalletChallenge(
  userId: string,
  wallet: string,
  nonce: string,
  signature: string,
) {
  await ensureIndexes();

  const client = await clientPromise;
  const db = client.db();
  const challenges = db.collection("walletChallenges");
  const users = db.collection("users");

  const normalizedWallet = wallet.trim();
  const objectId = assertObjectId(userId);
  const now = new Date();

  const challenge = await challenges.findOne<StoredChallenge>({
    userId: objectId,
    wallet: normalizedWallet,
    nonce,
    usedAt: { $exists: false },
    expiresAt: { $gt: now.toISOString() },
  });

  if (!challenge) {
    return {
      verified: false,
      reason: "Challenge not found, expired, or already used",
    };
  }

  const signatureBuffer = Buffer.from(signature, "base64");
  const messageBuffer = Buffer.from(challenge.message, "utf8");
  const isValidSignature = Keypair.fromPublicKey(normalizedWallet).verify(messageBuffer, signatureBuffer);

  if (!isValidSignature) {
    return {
      verified: false,
      reason: "Invalid signature",
    };
  }

  const usedAt = now.toISOString();
  await challenges.updateOne(
    { nonce: challenge.nonce },
    {
      $set: {
        usedAt,
      },
    },
  );

  const verifiedUntil = new Date(Date.now() + VERIFICATION_TTL_MS).toISOString();
  await users.updateOne(
    { _id: objectId },
    {
      $set: {
        walletVerification: {
          wallet: normalizedWallet,
          verifiedAt: usedAt,
          verifiedUntil,
        },
      },
    },
  );

  return {
    verified: true,
    wallet: normalizedWallet,
    verifiedUntil,
  };
}

export async function hasRecentWalletVerification(userId: string, wallet: string) {
  const client = await clientPromise;
  const db = client.db();
  const objectId = assertObjectId(userId);
  const normalizedWallet = wallet.trim();

  const user = await db.collection("users").findOne<{
    walletVerification?: {
      wallet?: string;
      verifiedUntil?: string;
    };
  }>(
    { _id: objectId },
    { projection: { walletVerification: 1 } },
  );

  const verification = user?.walletVerification;
  if (!verification?.wallet || !verification.verifiedUntil) {
    return false;
  }

  return (
    verification.wallet === normalizedWallet &&
    new Date(verification.verifiedUntil).getTime() > Date.now()
  );
}
