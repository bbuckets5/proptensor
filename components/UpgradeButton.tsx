'use client';

import { createCheckoutSession } from "@/app/actions/stripe";
import { useState } from "react";

export default function UpgradeButton() {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    // This calls the server action we just wrote
    await createCheckoutSession();
    // No need to set loading false, because the user will be redirected away
  };

  return (
    <div className="bg-yellow-50 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center mb-8">
      <h3 className="text-2xl font-black uppercase mb-2">🏆 Upgrade to Pro</h3>
      <p className="font-bold text-gray-600 mb-4">
        Unlock unlimited AI parlays & strict injury analysis.
      </p>
      
      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="w-full bg-black text-white font-black uppercase py-4 text-xl hover:bg-gray-800 transition-transform active:scale-95 disabled:opacity-50"
      >
        {loading ? "Loading Stripe..." : "Unlock Now - $10/mo"}
      </button>
    </div>
  );
}
