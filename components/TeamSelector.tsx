'use client';

import { useState } from 'react';

const NBA_TEAMS = [
  "ATL", "BOS", "BKN", "CHA", "CHI", "CLE", "DAL", "DEN", "DET", "GSW",
  "HOU", "IND", "LAC", "LAL", "MEM", "MIA", "MIL", "MIN", "NOP", "NYK",
  "OKC", "ORL", "PHI", "PHX", "POR", "SAC", "SAS", "TOR", "UTA", "WAS"
];

// 1. We define the "Props" (inputs) this component accepts
interface Props {
  onAnalyze: (home: string, away: string) => void;
}

// 2. We tell the function to use those props
export default function TeamSelector({ onAnalyze }: Props) {
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");

  return (
    <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <h2 className="text-3xl font-black mb-8 border-b-4 border-black pb-2 uppercase flex items-center gap-3">
        <span className="w-6 h-6 bg-orange-500 border-2 border-black block"></span>
        Select Matchup
      </h2>
      
      <div className="flex flex-col md:flex-row gap-8 justify-between items-center">
        {/* Away Team */}
        <div className="w-full">
          <label className="block text-lg font-bold mb-2 uppercase">Away Team</label>
          <select 
            className="w-full p-4 bg-white border-4 border-black font-bold focus:outline-none focus:bg-blue-100 transition-colors cursor-pointer appearance-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            value={awayTeam}
            onChange={(e) => setAwayTeam(e.target.value)}
          >
            <option value="">CHOOSE...</option>
            {NBA_TEAMS.map(team => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>
        </div>

        <div className="text-4xl font-black italic bg-black text-white px-4 py-2 transform -skew-x-12 shadow-[4px_4px_0px_0px_#2563eb]">
          VS
        </div>

        {/* Home Team */}
        <div className="w-full">
          <label className="block text-lg font-bold mb-2 uppercase">Home Team</label>
          <select 
            className="w-full p-4 bg-white border-4 border-black font-bold focus:outline-none focus:bg-blue-100 transition-colors cursor-pointer appearance-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            value={homeTeam}
            onChange={(e) => setHomeTeam(e.target.value)}
          >
            <option value="">CHOOSE...</option>
            {NBA_TEAMS.map(team => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Button */}
      {homeTeam && awayTeam && (
        <button 
          // 3. We attach the function to the click event
          onClick={() => onAnalyze(homeTeam, awayTeam)}
          className="w-full mt-10 bg-orange-500 border-4 border-black text-black font-black text-2xl py-4 hover:bg-orange-400 hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all uppercase flex items-center justify-center gap-2"
        >
           Analyze Matchup 
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={4} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="square" strokeLinejoin="miter" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      )}
    </div>
  );
}
