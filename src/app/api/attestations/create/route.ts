import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "../../auth/[...nextauth]/route";
import { anchorAttestationHashOnChain } from "@/lib/attestation-chain";
import { createAndStoreAttestation, setAttestationTxHash } from "@/lib/attestations";
import { apiError, getRequestIp, parseJsonBody, toErrorResponse } from "@/lib/api-utils";
import { withReqContext } from "@/lib/logger";
import { enforceRateLimit } from "@/lib/rate-limit";
import { AttestationCreateSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const log = withReqContext(request);
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const limit = await enforceRateLimit({
      key: `attestation-create:${session.user.id}:${getRequestIp(request)}`,
      limit: 20,
      windowMs: 60_000,
    });
    if (!limit.allowed) {
      return apiError("Too many attestation requests", 429, "RATE_LIMITED");
    }

    const body = await parseJsonBody(request, AttestationCreateSchema);

    const { attestation } = await createAndStoreAttestation(body, null);
    const txHash = await anchorAttestationHashOnChain(attestation.attestationId, attestation.artifactHash);
    await setAttestationTxHash(attestation.attestationId, txHash);

    log.info(
      {
        userId: session.user.id,
        owner: body.owner,
        attestationId: attestation.attestationId,
        txHash,
      },
      "attestation create API success",
    );

    return NextResponse.json({
      attestationId: attestation.attestationId,
      artifactHash: attestation.artifactHash,
      txHash,
    });
  } catch (error) {
    return toErrorResponse(error, "Failed to create attestation");
  }
}
