import { NextResponse } from "next/server";
import Stripe from "stripe";

import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2025-01-27.acacia" as any,
});

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
        return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.payment_status === "paid") {
            // Update User in MongoDB
            const authSession = await getServerSession(authOptions);
            if (authSession?.user?.id) {
                const client = await clientPromise;
                const db = client.db();
                await db.collection("users").updateOne(
                    { _id: new ObjectId(authSession.user.id) },
                    {
                        $set: {
                            isSubscribed: true,
                            subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
                        }
                    }
                );

                // Record detailed billing in a new collection
                await db.collection("billings").insertOne({
                    userId: new ObjectId(authSession.user.id),
                    amount: session.amount_total ? session.amount_total / 100 : 30,
                    currency: session.currency || "usd",
                    status: "paid",
                    stripeSessionId: sessionId,
                    date: new Date(),
                    userName: authSession.user.name,
                    userEmail: authSession.user.email
                });
            }

            return NextResponse.json({ success: true, metadata: session.metadata });
        } else {
            return NextResponse.json({ success: false, status: session.payment_status });
        }
    } catch (error: any) {
        console.error("Stripe Verification Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
