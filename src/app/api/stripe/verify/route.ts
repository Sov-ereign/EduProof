import Stripe from "stripe";

import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { apiError, apiSuccess, getRequestIp, parseQuery, toErrorResponse } from "@/lib/api-utils";
import { withReqContext } from "@/lib/logger";
import { enforceRateLimit } from "@/lib/rate-limit";
import { StripeVerifyQuerySchema } from "@/lib/schemas";
import { grantSubscriptionForUser } from "@/lib/subscription";

function getStripeClient() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
        throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    return new Stripe(secretKey, {
        apiVersion: "2025-12-15.clover",
    });
}

export async function GET(request: Request) {
    const log = withReqContext(request);
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user?.id) {
        return apiError("Unauthorized", 401, "UNAUTHORIZED");
    }

    try {
        const rateLimit = await enforceRateLimit({
            key: `stripe-verify:${authSession.user.id}:${getRequestIp(request)}`,
            limit: 30,
            windowMs: 60_000,
        });
        if (!rateLimit.allowed) {
            return apiError("Too many verification attempts", 429, "RATE_LIMITED");
        }

        const query = parseQuery(request, StripeVerifyQuerySchema);
        const sessionId = query.session_id;

        const stripe = getStripeClient();
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        const boundUserId = session.metadata?.userId || session.client_reference_id;
        if (!boundUserId || boundUserId !== authSession.user.id) {
            return apiError("Checkout session does not belong to current user", 403, "FORBIDDEN");
        }

        if (session.payment_status !== "paid") {
            return apiSuccess({ success: false, granted: false, status: session.payment_status });
        }

        const grantResult = await grantSubscriptionForUser({
            userId: authSession.user.id,
            stripeSessionId: sessionId,
            amount: session.amount_total ? session.amount_total / 100 : 30,
            currency: session.currency || "usd",
            status: session.payment_status || "paid",
            userName: authSession.user.name,
            userEmail: authSession.user.email,
            paymentIntentId:
                typeof session.payment_intent === "string" ? session.payment_intent : null,
        });

        log.info({ userId: authSession.user.id, sessionId, alreadyGranted: !grantResult.applied }, "stripe verification success");
        return apiSuccess({
            success: true,
            granted: true,
            alreadyGranted: !grantResult.applied,
            expiresAt: grantResult.expiresAt.toISOString(),
        });
    } catch (error) {
        return toErrorResponse(error, "Stripe verification failed");
    }
}
