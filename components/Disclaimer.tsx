'use client';

interface Props {
  onAgree: () => void;
}

export default function Disclaimer({ onAgree }: Props) {
  return (
    // 1. The Backdrop (Blurry and dark)
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      
      {/* 2. The Modal Box */}
      <div className="bg-[#e8e8e5] border-4 border-black max-w-2xl w-full shadow-[12px_12px_0px_0px_#ef4444] max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="bg-red-500 border-b-4 border-black p-6 sticky top-0 z-10">
          <h2 className="text-3xl md:text-4xl font-black uppercase text-black tracking-tighter">
            ⚠ Warning: Read First
          </h2>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6 text-lg font-mono font-medium">
          <p>
            You are about to access <strong>PropTensor</strong>, an AI-driven sports analytics engine.
          </p>

          <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="mb-4 font-bold uppercase underline">How this works:</p>
            <p className="text-sm mb-4">
              We do NOT provide "locks" or guaranteed winners. We model how a coach might manage their rotation based on:
            </p>
            
            {/* UPDATED LIST HERE */}
            <ul className="list-disc list-inside text-sm space-y-2">
              <li>
                <strong>Win/Loss & Home Court:</strong> How desperate is the team?
              </li>
              <li>
                <strong>Pace of Play:</strong> Is the game fast or slow? (More possessions = more opportunity).
              </li>
              <li>
                <strong>Defense vs. Position:</strong> Specific matchups (e.g., "Ranked 28th at defending Point Guards").
              </li>
              <li>
                <strong>Rest Days:</strong> Is the team tired from playing a "back-to-back"?
              </li>
              <li>
                <strong>Injury Reports:</strong> How usage rates change when a teammate sits out.
              </li>
            </ul>
          </div>

          <p className="text-red-600 font-bold text-sm md:text-base">
            This tool is for educational purposes only. Sports are unpredictable. 
            The AI predicts <span className="underline">probabilities</span>, not certainties.
          </p>
        </div>

        {/* Footer / Buttons */}
        <div className="p-6 border-t-4 border-black flex flex-col md:flex-row gap-4 sticky bottom-0 bg-[#e8e8e5]">
          <button 
            onClick={() => window.location.href = 'https://google.com'}
            className="flex-1 bg-white border-4 border-black py-4 font-black hover:bg-zinc-200 transition-colors uppercase text-sm md:text-base"
          >
            I Disagree (Exit)
          </button>
          
          <button 
            onClick={onAgree}
            className="flex-1 bg-green-500 border-4 border-black py-4 font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all uppercase text-sm md:text-base"
          >
            I Understand & Agree
          </button>
        </div>

      </div>
    </div>
  );
}
