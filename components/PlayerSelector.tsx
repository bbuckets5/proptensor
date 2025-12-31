'use client';

import { useState, useEffect } from 'react';
import { getRoster } from '@/lib/nba';

interface Player {
  id: string;
  name: string;
  position: string;
  headshot: string;
  jersey: string;
}

interface Props {
  homeTeam: string;
  awayTeam: string;
  onBack: () => void;
  // NEW: We added this so the component can send the player data back up
  onSelect: (player: any) => void; 
}

export default function PlayerSelector({ homeTeam, awayTeam, onBack, onSelect }: Props) {
  // We track ID now to be more precise
  const [selectedPlayerId, setSelectedPlayerId] = useState(""); 
  const [loading, setLoading] = useState(true);
  
  const [homeRoster, setHomeRoster] = useState<Player[]>([]);
  const [awayRoster, setAwayRoster] = useState<Player[]>([]);
  
  const [activeTab, setActiveTab] = useState<'home'|'away'>('away'); 

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [homeData, awayData] = await Promise.all([
          getRoster(homeTeam),
          getRoster(awayTeam)
        ]);
        setHomeRoster(homeData);
        setAwayRoster(awayData);
      } catch (error) {
        console.error("Error fetching rosters:", error);
      }
      setLoading(false);
    };

    fetchData();
  }, [homeTeam, awayTeam]);

  const currentRoster = activeTab === 'home' ? homeRoster : awayRoster;

  // Helper function to find the full player object based on the ID
  const getSelectedPlayerObj = () => {
    return [...homeRoster, ...awayRoster].find(p => p.id === selectedPlayerId);
  };

  return (
    <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] min-h-[600px]">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b-4 border-black pb-4">
        <div>
          <h2 className="text-3xl font-black uppercase">Select Player</h2>
          <p className="text-lg font-bold text-gray-500">
            {awayTeam} @ {homeTeam}
          </p>
        </div>
        <button 
          onClick={onBack}
          className="text-sm font-bold underline hover:text-blue-600 uppercase"
        >
          &larr; Change Matchup
        </button>
      </div>

      {/* Team Tabs */}
      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => setActiveTab('away')}
          className={`flex-1 py-3 font-black border-4 border-black uppercase transition-all
            ${activeTab === 'away' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}
          `}
        >
          {awayTeam} Roster
        </button>
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex-1 py-3 font-black border-4 border-black uppercase transition-all
            ${activeTab === 'home' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}
          `}
        >
          {homeTeam} Roster
        </button>
      </div>

      {/* Loading vs Grid */}
      {loading ? (
        <div className="text-center py-20">
          <p className="text-2xl font-black animate-pulse">LOADING ROSTERS...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 max-h-[500px] overflow-y-auto pr-2">
          {currentRoster.map((player) => (
            <div 
              key={player.id}
              onClick={() => setSelectedPlayerId(player.id)}
              className={`
                cursor-pointer p-3 border-4 border-black font-bold uppercase transition-all flex items-center gap-4
                ${selectedPlayerId === player.id 
                  ? 'bg-blue-500 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-1 translate-y-1' 
                  : 'bg-zinc-100 hover:bg-orange-200 hover:-translate-y-1 shadow-[4px_4px_0px_0px_#cbd5e1]'}
              `}
            >
              <img 
                src={player.headshot} 
                alt={player.name} 
                className="w-12 h-12 rounded-full border-2 border-black bg-white object-cover" 
              />
              <div className="flex flex-col">
                <span className="leading-tight text-sm">{player.name}</span>
                <span className="text-xs opacity-70">#{player.jersey} | {player.position}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generate Button - NOW CONNECTED */}
      {selectedPlayerId && (
        <button 
          onClick={() => {
            const player = getSelectedPlayerObj();
            if (player) {
                // This is the magic line that sends the player to the next screen
                onSelect({ ...player, team: activeTab === 'home' ? homeTeam : awayTeam });
            }
          }}
          className="w-full bg-orange-500 border-4 border-black text-black font-black text-xl py-4 hover:bg-orange-400 hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all uppercase sticky bottom-0"
        >
          Generate Props for {getSelectedPlayerObj()?.name}
        </button>
      )}
    </div>
  );
}
