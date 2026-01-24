import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
    try {
        const authSession = await getServerSession(authOptions);
        if (!authSession?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const client = await clientPromise;
        const db = client.db();

        const history = await db.collection("billings")
            .find({ userId: new ObjectId(authSession.user.id) })
            .sort({ date: -1 })
            .toArray();

        return NextResponse.json({ success: true, history });
    } catch (error: any) {
        console.error("Billing History Fetch Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const authSession = await getServerSession(authOptions);
        if (!authSession?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { sessionId, txHash } = await request.json();
        if (!sessionId || !txHash) {
            return NextResponse.json({ error: "Missing sessionId or txHash" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();

        await db.collection("billings").updateOne(
            { stripeSessionId: sessionId, userId: new ObjectId(authSession.user.id) },
            { $set: { txHash: txHash } }
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Billing Hash Update Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
