import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export async function POST(req: NextRequest) {
      try {
        const { amount } = await req.json();
    
        if (!amount) {
          return NextResponse.json({ error: "Amount is required" }, { status: 400 });
        }
    
        // Convert amount to cents (Stripe requires it)
        const amountInCents = Math.round(amount * 100);
    
        // Create a PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: "usd", // Change if needed
          payment_method_types: ["card"],
        });
    
        return NextResponse.json({ clientSecret: paymentIntent.client_secret });
      } catch (error) {
        console.error("Stripe Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
      }
    }
    