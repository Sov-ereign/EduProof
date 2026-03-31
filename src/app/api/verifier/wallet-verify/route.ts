import { getServerSession } from "next-auth";

import { authOptions } from "../../auth/[...nextauth]/route";
import { apiError, apiSuccess, getRequestIp, parseJsonBody, toErrorResponse } from "@/lib/api-utils";
import { withReqContext } from "@/lib/logger";
import { enforceRateLimit } from "@/lib/rate-limit";
import { WalletVerifySchema } from "@/lib/schemas";
import { verifyWalletChallenge } from "@/lib/wallet-challenge";

export async function POST(request: Request) {
  const log = withReqContext(request);
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const ip = getRequestIp(request);
    const limit = await enforceRateLimit({
      key: `wallet-verify:${session.user.id}:${ip}`,
      limit: 20,
      windowMs: 60_000,
    });
    if (!limit.allowed) {
      return apiError("Too many wallet verification attempts", 429, "RATE_LIMITED");
    }

    const body = await parseJsonBody(request, WalletVerifySchema);
    const verification = await verifyWalletChallenge(
      session.user.id,
      body.wallet,
      body.nonce,
      body.signature,
    );

    if (!verification.verified) {
      return apiError(verification.reason || "Wallet verification failed", 401, "INVALID_SIGNATURE");
    }

    log.info({ userId: session.user.id, wallet: body.wallet }, "wallet challenge verified");
    return apiSuccess(verification);
  } catch (error) {
    return toErrorResponse(error, "Failed to verify wallet challenge");
  }
}

