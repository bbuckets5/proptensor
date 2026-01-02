'use server';

import { auth, currentUser } from "@clerk/nextjs/server";
import { Stripe } from "stripe";
import { redirect } from "next/navigation";

// Initialize Stripe
// We use 'as any' here to prevent TypeScript from complaining about the specific version date
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-12-18.acacia' as any, 
});

export async function createCheckoutSession() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    return { error: "Please log in to subscribe." };
  }

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
      success_url: `${process.env.NEXT_PUBLIC_URL}/?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/?canceled=true`,
      customer_email: user.emailAddresses[0].emailAddress,
      metadata: {
        clerkUserId: userId,
      },
    });

    if (session.url) {
      redirect(session.url);
    }
  } catch (error: any) {
    console.error("Stripe Error:", error);
    return { error: error.message };
  }
}
