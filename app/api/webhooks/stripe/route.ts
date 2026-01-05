import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Stripe } from "stripe";
import { clerkClient } from "@clerk/nextjs/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-12-18.acacia' as any,
});

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (event.type === "checkout.session.completed") {
    const clerkUserId = session.metadata?.clerkUserId;

    if (clerkUserId) {
        // This is the magic part: it updates Clerk to say "User is Pro"
        const client = await clerkClient();
        await client.users.updateUserMetadata(clerkUserId, {
            publicMetadata: {
                plan: "pro", 
            }
        });
    }
  }

  return new NextResponse("Webhook received", { status: 200 });
}
