import Stripe from "stripe";

import { apiError, apiSuccess } from "@/lib/api-utils";
import { logger, withReqContext } from "@/lib/logger";
import clientPromise from "@/lib/mongodb";
import { grantSubscriptionForUser } from "@/lib/subscription";

export const runtime = "nodejs";
let webhookIndexesReady = false;

function getStripeClient() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
        throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    return new Stripe(secretKey, {
        apiVersion: "2025-12-15.clover",
    });
}

export async function POST(request: Request) {
    const log = withReqContext(request);
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        return apiError("Missing STRIPE_WEBHOOK_SECRET", 500, "MISCONFIGURED");
    }

    const signature = request.headers.get("stripe-signature");
    if (!signature) {
        return apiError("Missing Stripe signature", 400, "MISSING_SIGNATURE");
    }

    try {
        const stripe = getStripeClient();
        const payload = await request.text();
        const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        const client = await clientPromise;
        const db = client.db();
        const webhookEvents = db.collection("stripeWebhookEvents");

        if (!webhookIndexesReady) {
            await webhookEvents.createIndex({ eventId: 1 }, { unique: true, name: "uniq_webhook_event_id" });
            webhookIndexesReady = true;
        }

        const replayInsert = await webhookEvents.updateOne(
            { eventId: event.id },
            {
                $setOnInsert: {
                    eventId: event.id,
                    type: event.type,
                    createdAt: new Date().toISOString(),
                },
                $set: {
                    updatedAt: new Date().toISOString(),
                },
            },
            { upsert: true },
        );

        if (!replayInsert.upsertedId) {
            log.info({ eventId: event.id, type: event.type }, "ignored replayed stripe webhook event");
            return apiSuccess({ received: true, replay: true });
        }

        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;

            if (session.payment_status === "paid") {
                const userId = session.metadata?.userId || session.client_reference_id;
                if (userId) {
                    const result = await grantSubscriptionForUser({
                        userId,
                        stripeSessionId: session.id,
                        amount: session.amount_total ? session.amount_total / 100 : 30,
                        currency: session.currency || "usd",
                        status: session.payment_status || "paid",
                        userName: null,
                        userEmail: null,
                        paymentIntentId:
                            typeof session.payment_intent === "string" ? session.payment_intent : null,
                    });
                    log.info(
                        { userId, sessionId: session.id, applied: result.applied },
                        "stripe webhook processed checkout completion",
                    );
                }
            }
        }

        return apiSuccess({ received: true });
    } catch (error: unknown) {
        logger.error({ err: error }, "stripe webhook error");
        const message = error instanceof Error ? error.message : "Invalid webhook payload";
        return apiError(message, 400, "WEBHOOK_ERROR");
    }
}
