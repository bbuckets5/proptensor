'use client'; 

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs'; 
import TeamSelector from "@/components/TeamSelector";
import PlayerSelector from "@/components/PlayerSelector";
import AnalysisView from "@/components/AnalysisView";
import Disclaimer from "@/components/Disclaimer";
import ParlayGenerator from "@/components/ParlayGenerator"; 
import UpgradeButton from "@/components/UpgradeButton"; 

export default function Home() {
  const [hasAgreed, setHasAgreed] = useState(false);
  const { user, isLoaded } = useUser(); 
  
  // 🟢 Check Metadata Sticker (The Fix)
  const isPro = isLoaded && user?.publicMetadata?.plan === 'pro';
  
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
    // 🟢 MOBILE FIX 1: Responsive padding (p-4 on mobile, p-8 on desktop)
    <main className="min-h-screen bg-[#e8e8e5] text-black p-4 md:p-8 font-mono selection:bg-orange-300">
      <div className="max-w-4xl mx-auto">
        
        <div className="mb-8 md:mb-12 text-center">
          {/* 🟢 MOBILE FIX 2: Responsive Text Size (text-4xl on phone, 6xl on desktop) */}
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-2 break-words" style={{ textShadow: "3px 3px 0px #000" }}>
            PropTensor
          </h1>
          <div className="inline-block bg-blue-600 text-white px-3 py-1 font-bold text-xs md:text-sm border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            NBA AI PREDICTION ENGINE
          </div>
          
          {/* 🟢 PRO BADGE (Visible if Pro) */}
          {isPro && (
            <div className="mt-4 animate-in fade-in zoom-in duration-500">
              <span className="bg-green-500 text-white px-3 py-1 font-bold text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                ✅ PRO MEMBERSHIP ACTIVE
              </span>
            </div>
          )}
        </div>
        
        {/* VIEW 1: HOME SCREEN */}
        {!matchup && (
          <div className="space-y-8 md:space-y-12">
            
            <div className="animate-in slide-in-from-top-4 duration-500">
                <ParlayGenerator />
            </div>

            <div>
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-1 bg-black flex-1"></div>
                    {/* 🟢 MOBILE FIX 3: Smaller text for the divider */}
                    <span className="font-black text-lg md:text-xl uppercase opacity-50">OR SELECT MATCHUP</span>
                    <div className="h-1 bg-black flex-1"></div>
                </div>
                
                {/* 🟢 MOBILE FIX 4: Prevent horizontal overflow */}
                <div className="overflow-x-hidden">
                    <TeamSelector onAnalyze={(home, away) => setMatchup({ home, away })} />
                </div>
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

        {/* FOOTER: UPGRADE BUTTON (Only if NOT Pro) */}
        {!isPro && (
          <div className="mt-12 md:mt-16 flex justify-center">
            <div className="w-full max-w-md">
                <UpgradeButton />
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
