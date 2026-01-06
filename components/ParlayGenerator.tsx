'use client';

import { useState } from 'react';
import { generateParlay } from '@/app/actions'; 

// --- THE SMART PROMPTS ---
const QUICK_PROMPTS = [
  { 
    emoji: "🚀", 
    label: "Late Night Special", 
    text: "Only one game left: [ENTER HOME TEAM] vs [ENTER AWAY TEAM]. \n\nCONTEXT:\n- Home Team Injuries: [PASTE HERE]\n- Away Team Injuries: [PASTE HERE]\n\nAnalyze fatigue and give me the best prop." 
  },
  { 
    emoji: "🔒", 
    label: "Best Locks Only", 
    text: "Look at these matchups: [PASTE MATCHUPS HERE]. \n\nINJURY NEWS: [PASTE INJURIES HERE].\n\nWhat are the absolute best locks? Analyze everything based on this news." 
  },
  { 
    emoji: "💸", 
    label: "2-Leg All-In", 
    text: "I want a 2-leg ALL-IN parlay for [ENTER TEAM NAME] right now. \n\nNOTE: [PLAYER NAME] is OUT today.\n\nGive me the safest, most logical plays based on that outage." 
  },
  { 
    emoji: "🧱", 
    label: "8-Leg Blowout Unders", 
    text: "Analyze [ENTER TEAMS]. Give me an 8-leg parlay of UNDERS assuming a blowout. \n\nCONTEXT: [Explain why you think it's a blowout]" 
  },
  { 
    emoji: "🧠", 
    label: "Coach's Mindset", 
    text: "For the [ENTER TEAM NAME] game: Who do you think will be the top scorer? \n\nOPPONENT DEFENSE: [Paste Defensive Stats or Ranking]\n\nThink like a coach countering AI-driven game plans." 
  },
  { 
    emoji: "💎", 
    label: "Hidden Gems", 
    text: "Since [ENTER TEAM NAME] is an inside team, who should I take OVER or UNDER on rebounds for [ENTER OPPONENT NAME]? Find me hidden gems." 
  }
];

export default function ParlayGenerator() {
  const [loading, setLoading] = useState(false);
  const [parlay, setParlay] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [customNotes, setCustomNotes] = useState('');

  const handleGenerate = async () => {
    // 1. Validation
    if (!customNotes.trim()) {
      alert("⚠️ MISSING DATA! \n\nPlease paste today's matchups and injury news in the box.\n\nThe AI does not have a live TV feed, so it needs your notes to be accurate.");
      return;
    }

    setLoading(true);
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    
    // 2. Send the notes
    const result = await generateParlay({
        date: today,
        games: [], 
        notes: customNotes
    });

    if (result.error) {
        alert(result.error);
    } else {
        setParlay(result);
    }
    setLoading(false);
  };

  return (
    <>
      {/* THE BUTTON */}
      <button 
        onClick={() => setShowModal(true)}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black uppercase py-4 text-xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all mb-8"
      >
        ✨ Generate Daily Parlay
      </button>

      {/* THE MODAL */}
      {showModal && (
        // 🟢 FIX IS HERE: Changed 'items-center' to 'items-start md:items-center'
        // This ensures on mobile it starts at the top so you can scroll to the X button
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-start md:items-center justify-center p-4 overflow-y-auto">
            
            <div className="bg-white border-4 border-black w-full max-w-2xl shadow-[12px_12px_0px_0px_#fff] animate-in zoom-in-95 duration-200 my-8 md:my-0">
                
                {/* Header */}
                <div className="bg-black text-white p-4 flex justify-between items-center sticky top-0 z-10">
                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest">💰 The Daily 3-Leg</h2>
                    <button 
                        onClick={() => setShowModal(false)} 
                        className="text-white hover:text-red-500 font-bold text-4xl px-2 leading-none"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    
                    {!parlay ? (
                        /* INPUT STATE */
                        <div className="space-y-4">
                            
                            {/* --- 🚨 ALERT BANNER --- */}
                            <div className="bg-blue-50 border-l-8 border-blue-600 p-4 shadow-sm">
                                <div className="flex items-start gap-4">
                                    <div className="text-4xl select-none">ℹ️</div>
                                    <div>
                                        <h4 className="text-blue-900 font-black uppercase text-lg tracking-wide">How to get a Lock</h4>
                                        <p className="text-blue-800 font-bold text-sm leading-snug mt-1">
                                            The AI acts as a <span className="underline decoration-2 underline-offset-2">Strategist</span>. It needs the raw data from you.
                                            <br className="mb-2"/>
                                            <strong>Paste the slate & injuries below</strong> so it knows who is playing!
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <p className="font-bold text-lg">
                                Paste Data Here <span className="text-red-600 text-sm ml-2 font-mono">(Required)</span>:
                            </p>
                            
                            {/* --- TEXT AREA --- */}
                            <textarea 
                                className="w-full p-4 border-4 border-black font-mono focus:bg-yellow-50 focus:outline-none min-h-[200px] text-sm font-bold placeholder:text-gray-400"
                                placeholder={`STEP 1: Paste today's matchups (e.g. Lakers vs Heat)\nSTEP 2: Paste key injuries (e.g. Butler is OUT)\nSTEP 3: Ask for what you want (e.g. "Give me a safe 3-leg parlay")\n\n(The AI relies on this info to be accurate!)`}
                                value={customNotes}
                                onChange={(e) => setCustomNotes(e.target.value)}
                            />

                            {/* --- QUICK PROMPTS --- */}
                            <div className="flex flex-wrap gap-2">
                                {QUICK_PROMPTS.map((prompt, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => setCustomNotes(prompt.text)}
                                        className="text-xs font-bold bg-zinc-100 border-2 border-black px-3 py-2 hover:bg-blue-100 transition-colors uppercase flex items-center gap-1"
                                    >
                                        <span>{prompt.emoji}</span> {prompt.label}
                                    </button>
                                ))}
                            </div>

                            <button 
                                onClick={handleGenerate} 
                                disabled={loading}
                                className="w-full bg-green-500 border-4 border-black py-4 font-black uppercase text-xl hover:bg-green-400 disabled:opacity-50 mt-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                            >
                                {loading ? "Scanning Slate..." : "Build Parlay"}
                            </button>
                        </div>
                    ) : (
                        /* RESULT STATE */
                        <div className="space-y-6">
                            <div className="flex justify-between items-end border-b-4 border-black pb-2">
                                <div>
                                    <h3 className="text-2xl md:text-3xl font-black uppercase text-purple-700">{parlay.parlay_name}</h3>
                                    <span className="bg-black text-white px-2 py-1 font-bold text-sm uppercase">{parlay.risk_level} Risk</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-gray-500 uppercase">Est. Odds</p>
                                    <p className="text-3xl md:text-4xl font-black">{parlay.total_odds}</p>
                                </div>
                            </div>

                            {/* LEGS */}
                            <div className="space-y-4">
                                {parlay.legs.map((leg: any, i: number) => (
                                    <div key={i} className="bg-zinc-100 border-4 border-black p-4 flex flex-col md:flex-row gap-4 items-center">
                                        <div className="bg-black text-white font-black text-2xl w-12 h-12 flex items-center justify-center rounded-full shrink-0">
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 text-center md:text-left">
                                            <p className="font-bold text-gray-500 text-sm uppercase">{leg.game}</p>
                                            <p className="font-black text-xl uppercase">{leg.bet}</p>
                                            <p className="font-mono text-xs text-blue-600 font-bold mt-1">{leg.reason}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-yellow-100 p-4 border-4 border-black font-mono text-sm font-bold">
                                🤖 <span className="underline">AI LOGIC:</span> {parlay.analysis}
                            </div>

                            <button 
                                onClick={() => setParlay(null)} 
                                className="w-full border-4 border-black py-3 font-black uppercase hover:bg-gray-200"
                            >
                                Reset / Try Again
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
      )}
    </>
  );
}
