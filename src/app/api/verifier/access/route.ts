import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "../../auth/[...nextauth]/route";
import { apiError, getRequestIp, parseQuery, toErrorResponse } from "@/lib/api-utils";
import { getUserEntitlement } from "@/lib/entitlement";
import { enforceRateLimit } from "@/lib/rate-limit";

const AccessQuerySchema = z.object({
  wallet: z.string().trim().optional(),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const rate = await enforceRateLimit({
      key: `verifier-access:${session.user.id}:${getRequestIp(request)}`,
      limit: 120,
      windowMs: 60_000,
    });
    if (!rate.allowed) {
      return apiError("Too many access resolution requests", 429, "RATE_LIMITED");
    }

    const query = parseQuery(request, AccessQuerySchema);
    const entitlement = await getUserEntitlement(session.user.id, query.wallet);

    return NextResponse.json(entitlement);
  } catch (error) {
    return toErrorResponse(error, "Failed to resolve verifier access");
  }
}
