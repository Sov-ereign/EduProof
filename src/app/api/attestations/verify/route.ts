import { NextResponse } from "next/server";

import { verifyStoredAttestation } from "@/lib/attestations";
import { apiError, parseJsonBody, toErrorResponse } from "@/lib/api-utils";
import { AttestationVerifySchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request, AttestationVerifySchema);
    const result = await verifyStoredAttestation(body.attestationId, {
      artifactHash: body.artifactHash,
      signer: body.signer,
      rubricVersion: body.rubricVersion,
      modelId: body.modelId,
    });

    if (!result) {
      return apiError("Attestation not found", 404, "NOT_FOUND");
    }

    return NextResponse.json({
      valid: result.valid,
      signer: result.signer,
      rubricVersion: result.rubricVersion,
      modelId: result.modelId,
      artifactHash: result.artifactHash,
    });
  } catch (error) {
    return toErrorResponse(error, "Failed to verify attestation");
  }
}
