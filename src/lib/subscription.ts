import { ObjectId } from "mongodb";

import clientPromise from "@/lib/mongodb";

const SUBSCRIPTION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
let indexesReady = false;

export interface GrantSubscriptionInput {
  userId: string;
  stripeSessionId: string;
  amount?: number | null;
  currency?: string | null;
  status?: string;
  userName?: string | null;
  userEmail?: string | null;
  paymentIntentId?: string | null;
}

export interface GrantSubscriptionResult {
  applied: boolean;
  expiresAt: Date;
}

function toObjectId(id: string): ObjectId {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid user id");
  }
  return new ObjectId(id);
}

export async function grantSubscriptionForUser(
  input: GrantSubscriptionInput,
): Promise<GrantSubscriptionResult> {
  const client = await clientPromise;
  const db = client.db();

  const userObjectId = toObjectId(input.userId);
  const users = db.collection("users");
  const billings = db.collection("billings");

  if (!indexesReady) {
    await billings.createIndex({ userId: 1, stripeSessionId: 1 }, { unique: true, name: "uniq_user_session" });
    await billings.createIndex({ stripeSessionId: 1 }, { name: "idx_session" });
    indexesReady = true;
  }

  const user = await users.findOne<{ subscriptionExpiry?: Date }>(
    { _id: userObjectId },
    { projection: { subscriptionExpiry: 1 } },
  );

  const existingExpiry = user?.subscriptionExpiry ? new Date(user.subscriptionExpiry) : null;
  const safeExistingExpiry =
    existingExpiry && !Number.isNaN(existingExpiry.getTime()) ? existingExpiry : null;

  const billingFilter = {
    stripeSessionId: input.stripeSessionId,
    userId: userObjectId,
  };

  const billingUpsert = await billings.updateOne(
    billingFilter,
    {
      $setOnInsert: {
        userId: userObjectId,
        stripeSessionId: input.stripeSessionId,
        amount: input.amount ?? 30,
        currency: (input.currency ?? "usd").toLowerCase(),
        status: input.status ?? "paid",
        paymentIntentId: input.paymentIntentId ?? null,
        userName: input.userName ?? null,
        userEmail: input.userEmail ?? null,
        date: new Date(),
      },
      $set: {
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );

  const newlyInserted = Boolean(billingUpsert.upsertedId);
  if (!newlyInserted) {
    return {
      applied: false,
      expiresAt: safeExistingExpiry ?? new Date(Date.now()),
    };
  }

  const now = Date.now();
  const baseTimestamp =
    safeExistingExpiry && safeExistingExpiry.getTime() > now ? safeExistingExpiry.getTime() : now;
  const expiresAt = new Date(baseTimestamp + SUBSCRIPTION_DURATION_MS);

  await users.updateOne(
    { _id: userObjectId },
    {
      $set: {
        isSubscribed: true,
        subscriptionExpiry: expiresAt,
      },
    },
  );

  return { applied: true, expiresAt };
}
