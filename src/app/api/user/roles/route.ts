import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { apiError, apiSuccess, parseJsonBody, toErrorResponse } from "@/lib/api-utils";
import { RolesBodySchema } from "@/lib/schemas";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return apiError("Unauthorized", 401, "UNAUTHORIZED");
        }

        const { roles } = await parseJsonBody(request, RolesBodySchema);

        const client = await clientPromise;
        const db = client.db();

        // Update user with roles
        await db.collection("users").updateOne(
            { _id: new ObjectId(session.user.id) },
            {
                $set: {
                    roles: roles,
                    selectedRoleAt: new Date()
                }
            }
        );

        return apiSuccess({ success: true });
    } catch (error) {
        return toErrorResponse(error, "Role update failed");
    }
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return apiError("Unauthorized", 401, "UNAUTHORIZED");
        }

        const client = await clientPromise;
        const db = client.db();

        const user = await db.collection("users").findOne(
            { _id: new ObjectId(session.user.id) },
            { projection: { roles: 1 } }
        );

        return apiSuccess({ roles: user?.roles || [] });
    } catch (error) {
        return toErrorResponse(error, "Role fetch failed");
    }
}
