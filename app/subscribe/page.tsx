'use client';

import { PricingTable } from '@clerk/nextjs';

export default function SubscribePage() {
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

        {/* CLERK PRICING TABLE - Loads your Pro Plan automatically */}
        <div className="flex justify-center">
          <PricingTable />
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
