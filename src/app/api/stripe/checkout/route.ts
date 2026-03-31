import Stripe from "stripe";
import { getServerSession } from "next-auth";

import { authOptions } from "../../auth/[...nextauth]/route";
import { apiError, apiSuccess, getRequestIp, parseJsonBody, toErrorResponse } from "@/lib/api-utils";
import { withReqContext } from "@/lib/logger";
import { enforceRateLimit } from "@/lib/rate-limit";
import { StripeCheckoutBodySchema } from "@/lib/schemas";

const SUBSCRIPTION_PRICE_USD_CENTS = 3000;

function getStripeClient() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
        throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    return new Stripe(secretKey, {
        apiVersion: "2025-12-15.clover",
    });
}

function getBaseUrl(request: Request): string {
    const configuredUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
    if (configuredUrl) {
        return configuredUrl.replace(/\/$/, "");
    }

    const origin = request.headers.get("origin");
    if (!origin) {
        throw new Error("Unable to resolve app origin for Stripe redirect URLs");
    }

    return origin.replace(/\/$/, "");
}

export async function POST(request: Request) {
    const log = withReqContext(request);
    try {
        const authSession = await getServerSession(authOptions);
        if (!authSession?.user?.id) {
            return apiError("Unauthorized", 401, "UNAUTHORIZED");
        }

        const rateLimit = await enforceRateLimit({
            key: `stripe-checkout:${authSession.user.id}:${getRequestIp(request)}`,
            limit: 10,
            windowMs: 60_000,
        });
        if (!rateLimit.allowed) {
            return apiError("Too many checkout attempts", 429, "RATE_LIMITED");
        }

        const payload = await parseJsonBody(request, StripeCheckoutBodySchema);
        const currency = payload.currency.toLowerCase();
        const candidateAddress = payload.candidateAddress;
        const skill = payload.skill;

        if (currency !== "usd") {
            return apiError("Unsupported currency. Only USD is supported.", 400, "UNSUPPORTED_CURRENCY");
        }

        const baseUrl = getBaseUrl(request);
        const stripe = getStripeClient();

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: "EduProof Verifier Monthly Access",
                            description: `Unlimited credential checks for 30 days.`,
                        },
                        unit_amount: SUBSCRIPTION_PRICE_USD_CENTS,
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${baseUrl}/verifier?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/verifier`,
            client_reference_id: authSession.user.id,
            metadata: {
                type: "subscription_payment",
                userId: authSession.user.id,
                candidateAddress,
                skill,
            },
        });

        log.info({ userId: authSession.user.id, sessionId: session.id }, "stripe checkout session created");
        return apiSuccess({ id: session.id, url: session.url });
    } catch (error) {
        return toErrorResponse(error, "Checkout creation failed");
    }
}
