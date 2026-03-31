import { NextResponse } from "next/server";

import { getAttestationById } from "@/lib/attestations";
import { apiError, toErrorResponse } from "@/lib/api-utils";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: Params) {
  try {
    const { id } = await context.params;
    if (!id) {
      return apiError("Missing attestation id", 400, "MISSING_ID");
    }

    const data = await getAttestationById(id);
    if (!data) {
      return apiError("Attestation not found", 404, "NOT_FOUND");
    }

    return NextResponse.json(data);
  } catch (error) {
    return toErrorResponse(error, "Failed to fetch attestation");
  }
}
