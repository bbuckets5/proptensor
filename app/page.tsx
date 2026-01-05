'use client'; 

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs'; // <--- CHANGED THIS
import TeamSelector from "@/components/TeamSelector";
import PlayerSelector from "@/components/PlayerSelector";
import AnalysisView from "@/components/AnalysisView";
import Disclaimer from "@/components/Disclaimer";
import ParlayGenerator from "@/components/ParlayGenerator"; 
import UpgradeButton from "@/components/UpgradeButton"; 

export default function Home() {
  const [hasAgreed, setHasAgreed] = useState(false);
  const { user, isLoaded } = useUser(); // <--- Get the User Data (Metadata)
  
  // 🟢 THE FIX: Check the Metadata Sticker, not the Permission
  const isPro = isLoaded && user?.publicMetadata?.plan === 'pro';
  
  // Navigation State
  const [matchup, setMatchup] = useState<{home: string, away: string} | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);

  useEffect(() => {
    const agreed = localStorage.getItem('propTensorAgreed');
    if (agreed === 'true') setHasAgreed(true);
  }, []);

  const handleAgree = () => {
    setHasAgreed(true);
    localStorage.setItem('propTensorAgreed', 'true');
  };

  if (!hasAgreed) return <Disclaimer onAgree={handleAgree} />;

  return (
    <main className="min-h-screen bg-[#e8e8e5] text-black p-8 font-mono selection:bg-orange-300">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-6xl font-black uppercase tracking-tighter mb-2" style={{ textShadow: "4px 4px 0px #000" }}>
            PropTensor
          </h1>
          <div className="inline-block bg-blue-600 text-white px-4 py-1 font-bold text-sm border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            NBA AI PREDICTION ENGINE
          </div>
          
          {/* 🟢 NEW: VISIBLE PRO BADGE */}
          {isPro && (
            <div className="mt-4 animate-in fade-in zoom-in duration-500">
              <span className="bg-green-500 text-white px-3 py-1 font-bold text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                ✅ PRO MEMBERSHIP ACTIVE
              </span>
            </div>
          )}
        </div>
        
        {/* VIEW 1: HOME SCREEN (Teams + Parlay) */}
        {!matchup && (
          <div className="space-y-12">
            {/* The New Parlay Generator Button */}
            <div className="animate-in slide-in-from-top-4 duration-500">
                <ParlayGenerator />
            </div>

            {/* The Existing Game Selector */}
            <div>
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-1 bg-black flex-1"></div>
                    <span className="font-black text-xl uppercase opacity-50">OR SELECT A MATCHUP</span>
                    <div className="h-1 bg-black flex-1"></div>
                </div>
                <TeamSelector onAnalyze={(home, away) => setMatchup({ home, away })} />
            </div>
          </div>
        )}

        {/* VIEW 2: SELECT PLAYER */}
        {matchup && !selectedPlayer && (
          <PlayerSelector 
            homeTeam={matchup.home} 
            awayTeam={matchup.away} 
            onBack={() => setMatchup(null)}
            onSelect={(player) => setSelectedPlayer(player)} 
          />
        )}

        {/* VIEW 3: ANALYSIS */}
        {matchup && selectedPlayer && (
          <AnalysisView 
            player={selectedPlayer}
            opponent={selectedPlayer.team === matchup.home ? matchup.away : matchup.home}
            onBack={() => setSelectedPlayer(null)}
          />
        )}

        {/* --- FOOTER: UPGRADE BUTTON (ONLY IF NOT PRO) --- */}
        {!isPro && (
          <div className="mt-16 flex justify-center">
            <div className="w-full max-w-md">
                <UpgradeButton />
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
