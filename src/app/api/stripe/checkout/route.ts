import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2025-01-27.acacia" as any, // Use latest or stable
});

export async function POST(request: Request) {
    try {
        const { amount, currency, candidateAddress, skill } = await request.json();

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: currency || "usd",
                        product_data: {
                            name: "EduProof Verifier Monthly Access",
                            description: `Unlimited credential checks for 30 days.`,
                        },
                        unit_amount: 3000, // $30.00
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${request.headers.get("origin")}/verifier?session_id={CHECKOUT_SESSION_ID}&subscribed=true`,
            cancel_url: `${request.headers.get("origin")}/verifier`,
            metadata: {
                type: "subscription_payment",
            },
        });

        return NextResponse.json({ id: session.id, url: session.url });
    } catch (error: any) {
        console.error("Stripe Checkout Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
