import { getServerSession } from "next-auth";

import { authOptions } from "../../auth/[...nextauth]/route";
import {
  isEvaluatorActive,
  registerEvaluatorSigner,
  revokeEvaluatorSigner,
} from "@/lib/attestations";
import { apiError, apiSuccess, parseJsonBody, parseQuery, toErrorResponse } from "@/lib/api-utils";
import { EvaluatorSchema } from "@/lib/schemas";

function isAdmin(session: Awaited<ReturnType<typeof getServerSession>>) {
  const typedSession = session as { user?: { id?: string } } | null;
  if (!typedSession?.user?.id) return false;
  const allowed = (process.env.EVALUATOR_ADMIN_IDS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return allowed.length > 0 && allowed.includes(typedSession.user.id);
}

export async function GET(request: Request) {
  try {
    const query = parseQuery(request, EvaluatorSchema);
    const active = await isEvaluatorActive(query.signer);
    return apiSuccess({ signer: query.signer, active });
  } catch (error) {
    return toErrorResponse(error, "Failed to fetch evaluator");
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return apiError("Forbidden", 403, "FORBIDDEN");
    }

    const body = await parseJsonBody(request, EvaluatorSchema);
    await registerEvaluatorSigner(body.signer, session?.user?.id || "unknown");
    return apiSuccess({ signer: body.signer, active: true });
  } catch (error) {
    return toErrorResponse(error, "Failed to register evaluator");
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return apiError("Forbidden", 403, "FORBIDDEN");
    }

    const body = await parseJsonBody(request, EvaluatorSchema);
    await revokeEvaluatorSigner(body.signer, session?.user?.id || "unknown");
    return apiSuccess({ signer: body.signer, active: false });
  } catch (error) {
    return toErrorResponse(error, "Failed to revoke evaluator");
  }
}
