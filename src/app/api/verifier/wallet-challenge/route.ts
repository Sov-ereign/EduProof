import { getServerSession } from "next-auth";

import { authOptions } from "../../auth/[...nextauth]/route";
import { apiError, apiSuccess, getRequestIp, parseJsonBody, toErrorResponse } from "@/lib/api-utils";
import { withReqContext } from "@/lib/logger";
import { enforceRateLimit } from "@/lib/rate-limit";
import { WalletChallengeSchema } from "@/lib/schemas";
import { issueWalletChallenge } from "@/lib/wallet-challenge";

export async function POST(request: Request) {
  const log = withReqContext(request);
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const ip = getRequestIp(request);
    const limit = await enforceRateLimit({
      key: `wallet-challenge:${session.user.id}:${ip}`,
      limit: 15,
      windowMs: 60_000,
    });
    if (!limit.allowed) {
      return apiError("Too many wallet challenge requests", 429, "RATE_LIMITED");
    }

    const { wallet } = await parseJsonBody(request, WalletChallengeSchema);
    const challenge = await issueWalletChallenge(session.user.id, wallet, ip);

    log.info({ userId: session.user.id, wallet }, "wallet challenge issued");
    return apiSuccess(challenge);
  } catch (error) {
    return toErrorResponse(error, "Failed to issue wallet challenge");
  }
}

