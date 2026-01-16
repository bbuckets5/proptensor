'use client';

import { createCheckoutSession } from '../actions/stripe'; // 🟢 Connects to your working Stripe file
import { useState } from 'react';

export default function SubscribePage() {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      // This calls the code in app/actions/stripe.ts
      const result = await createCheckoutSession(); 
      if (result?.error) {
        alert(result.error);
        setLoading(false);
      }
      // If successful, the server action handles the redirect automatically
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#e8e8e5] text-black p-8 font-mono flex flex-col items-center justify-center">
      <div className="max-w-4xl mx-auto w-full text-center">
        
        {/* HEADER */}
        <div className="mb-12">
          <h1 className="text-5xl font-black uppercase tracking-tighter mb-4" style={{ textShadow: "4px 4px 0px #000" }}>
            Upgrade Status
          </h1>
          <div className="inline-block bg-blue-600 text-white px-4 py-1 font-bold text-sm border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            UNLOCK INTELLIGENCE
          </div>
        </div>

        {/* 🟢 CUSTOM PRICING CARD (Replaces the broken Clerk Widget) */}
        <div className="flex justify-center mb-12">
          <div className="bg-white border-2 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full">
            <h2 className="text-3xl font-black mb-2">PRO PLAN</h2>
            <div className="text-5xl font-black mb-6">$19<span className="text-xl text-gray-500 font-bold">/mo</span></div>
            
            <ul className="text-left mb-8 space-y-3 font-bold">
              <li className="flex items-center">✅ <span>Unlimited AI Predictions</span></li>
              <li className="flex items-center">✅ <span>Deep Roster Analysis</span></li>
              <li className="flex items-center">✅ <span>Parlay Generator</span></li>
              <li className="flex items-center">✅ <span>Live Chat with Analyst</span></li>
            </ul>

            <button 
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full bg-[#00ff00] hover:bg-[#00cc00] text-black font-black py-4 px-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all flex justify-center"
            >
              {loading ? (
                <span className="animate-pulse">REDIRECTING...</span>
              ) : (
                "UPGRADE NOW 🚀"
              )}
            </button>
            <p className="text-xs mt-4 text-gray-500 font-bold">Cancel anytime. Secure checkout via Stripe.</p>
          </div>
        </div>

        {/* BACK BUTTON */}
        <div className="mt-12">
          <a 
            href="/" 
            className="inline-block border-2 border-black bg-white px-6 py-2 font-bold hover:bg-black hover:text-white transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            ← RETURN TO DASHBOARD
          </a>
        </div>

      </div>
    </main>
  );
}
