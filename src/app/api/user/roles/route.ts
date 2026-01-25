import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { roles } = await request.json();

        // Validate roles
        if (!Array.isArray(roles) || roles.length === 0) {
            return NextResponse.json({ error: "Invalid roles" }, { status: 400 });
        }

        const validRoles = ["student", "verifier"];
        const isValid = roles.every(role => validRoles.includes(role));

        if (!isValid) {
            return NextResponse.json({ error: "Invalid role values" }, { status: 400 });
        }

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

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Role update error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const client = await clientPromise;
        const db = client.db();

        const user = await db.collection("users").findOne(
            { _id: new ObjectId(session.user.id) },
            { projection: { roles: 1 } }
        );

        return NextResponse.json({ roles: user?.roles || [] });
    } catch (error: any) {
        console.error("Role fetch error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
