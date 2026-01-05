'use server';

import { auth, currentUser } from "@clerk/nextjs/server";
import { Stripe } from "stripe";
import { redirect } from "next/navigation";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-12-18.acacia' as any, 
});

export async function createCheckoutSession() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    return { error: "Please log in to subscribe." };
  }

  // 1. Create a variable to store the URL so we can use it later
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
      allow_promotion_codes: true, // <--- 🟢 THIS ENABLES THE COUPON BOX
      success_url: `${process.env.NEXT_PUBLIC_URL}/?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/?canceled=true`,
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
    return { error: error.message };
  }

  // 3. Redirect HERE (Outside the try/catch block)
  if (sessionUrl) {
    redirect(sessionUrl);
  }
}
