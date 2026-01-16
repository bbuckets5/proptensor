'use server';

import { auth, currentUser } from "@clerk/nextjs/server";
import { Stripe } from "stripe";
import { redirect } from "next/navigation";

// ❌ OLD SPOT: Initializing here caused the crash/spinning.

export async function createCheckoutSession() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    return { error: "Please log in to subscribe." };
  }

  // 🟢 NEW SPOT: Initialize Stripe INSIDE the function.
  // This is much safer and stops the "infinite loading" bug.
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2024-12-18.acacia' as any, 
  });

  // This uses your correct URL variable from the .env list
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  let sessionUrl: string | null = null;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID, 
          quantity: 1,
        },
      ],
      mode: "subscription",
      allow_promotion_codes: true,
      success_url: `${baseUrl}/?success=true`,
      cancel_url: `${baseUrl}/?canceled=true`,
      customer_email: user.emailAddresses[0].emailAddress,
      metadata: {
        clerkUserId: userId,
      },
    });

    if (session.url) {
      sessionUrl = session.url; 
    }

  } catch (error: any) {
    console.error("Stripe Error:", error);
    return { error: `Stripe Failed: ${error.message}` };
  }

  if (sessionUrl) {
    redirect(sessionUrl);
  }
}
