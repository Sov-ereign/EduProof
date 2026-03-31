import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { apiError, apiSuccess, getRequestIp, parseJsonBody, toErrorResponse } from "@/lib/api-utils";
import { withReqContext } from "@/lib/logger";
import { enforceRateLimit } from "@/lib/rate-limit";
import { BillingUpdateBodySchema } from "@/lib/schemas";
import { hasRecentWalletVerification } from "@/lib/wallet-challenge";

export async function GET() {
    try {
        const authSession = await getServerSession(authOptions);
        if (!authSession?.user?.id) {
            return apiError("Unauthorized", 401, "UNAUTHORIZED");
        }

        const client = await clientPromise;
        const db = client.db();

        const history = await db.collection("billings")
            .find({ userId: new ObjectId(authSession.user.id) })
            .sort({ date: -1 })
            .toArray();

        return apiSuccess({ success: true, history });
    } catch (error) {
        return toErrorResponse(error, "Failed to fetch billing history");
    }
}

export async function POST(request: Request) {
    const log = withReqContext(request);
    try {
        const authSession = await getServerSession(authOptions);
        if (!authSession?.user?.id) {
            return apiError("Unauthorized", 401, "UNAUTHORIZED");
        }

        const rate = await enforceRateLimit({
            key: `verifier-billing-update:${authSession.user.id}:${getRequestIp(request)}`,
            limit: 25,
            windowMs: 60_000,
        });
        if (!rate.allowed) {
            return apiError("Too many billing update attempts", 429, "RATE_LIMITED");
        }

        const body = await parseJsonBody(request, BillingUpdateBodySchema);
        const { sessionId, txHash, wallet } = body;

        if (process.env.ENFORCE_WALLET_CHALLENGE === "true") {
            if (!wallet) {
                return apiError("Wallet is required when challenge enforcement is enabled", 400, "MISSING_WALLET");
            }
            const verified = await hasRecentWalletVerification(authSession.user.id, wallet);
            if (!verified) {
                return apiError("Recent wallet signature verification required", 403, "WALLET_CHALLENGE_REQUIRED");
            }
        }

        const client = await clientPromise;
        const db = client.db();

        await db.collection("billings").updateOne(
            { stripeSessionId: sessionId, userId: new ObjectId(authSession.user.id) },
            { $set: { txHash: txHash } }
        );

        log.info({ userId: authSession.user.id, sessionId, wallet }, "billing hash updated");
        return apiSuccess({ success: true });
    } catch (error) {
        return toErrorResponse(error, "Failed to update billing hash");
    }
}
