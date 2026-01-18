'use client';

import { useState, useEffect } from 'react';
import { getRoster, getLast10Games } from '@/lib/nba';
import { generatePrediction, chatWithAI } from '@/app/actions'; 

interface Props {
  player: { id: string; name: string; position: string; headshot: string; team: string };
  opponent: string;
  onBack: () => void;
}

export default function AnalysisView({ player, opponent, onBack }: Props) {
  // 1. INPUTS
  const [recentGames, setRecentGames] = useState<any[]>([]);
  
  // Manual 5-Game Grid State
  const [manualGames, setManualGames] = useState(
    Array(5).fill({ value: '', opponent: '', result: '', minutes: '' })
  );

  // Analyst Notes State
  const [analystNotes, setAnalystNotes] = useState('');
  
  const [bettingLine, setBettingLine] = useState('');
  const [betType, setBetType] = useState('Points'); 

  // 2. CONTEXT INPUTS
  const [blowoutRisk, setBlowoutRisk] = useState('No'); 

  // 3. ROSTER DATA
  const [teammates, setTeammates] = useState<any[]>([]);
  const [opponents, setOpponents] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // 4. INJURY MANAGERS
  const [selectedTeammate, setSelectedTeammate] = useState('');
  const [teammateStatus, setTeammateStatus] = useState('OUT');
  const [teammateInjuries, setTeammateInjuries] = useState<{name: string, status: string}[]>([]);

  const [selectedOpponent, setSelectedOpponent] = useState('');
  const [opponentStatus, setOpponentStatus] = useState('OUT');
  const [opponentInjuries, setOpponentInjuries] = useState<{name: string, status: string}[]>([]);

  const [primaryDefender, setPrimaryDefender] = useState('');

  // 5. UI STATE
  const [showWarning, setShowWarning] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // --- NEW: CHAT STATE ---
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [chatResponse, setChatResponse] = useState<{reply: string, adjusted_pick: string} | null>(null);

  // FETCH DATA
  useEffect(() => {
    const loadContextData = async () => {
      setLoadingData(true);
      const [teamData, oppData] = await Promise.all([
        getRoster(player.team),
        getRoster(opponent)
      ]);
      setTeammates(teamData.filter((p: any) => p.name !== player.name));
      setOpponents(oppData);

      try {
        const games = await getLast10Games(player.id);
        setRecentGames(games);
        
        // Auto-fill the Grid with API data if available
        if (games.length > 0) {
          const newManualGames = Array(5).fill({ value: '', opponent: '', result: '', minutes: '' });
          
          games.slice(0, 5).forEach((g: any, i: number) => {
             let val = '0';
             
             // --- SMART MAPPING LOGIC ---
             if (betType === 'Points') val = g.points;
             else if (betType === 'Rebounds') val = g.rebounds;
             else if (betType === 'Assists') val = g.assists;
             else if (betType === 'Blocks') val = g.blocks;
             else if (betType === 'Steals') val = g.steals;
             else if (betType === 'Turnovers') val = g.turnovers;
             
             // Handle "Splits"
             else if (betType === 'FGA') val = g.fgSplit?.split('-')[1] || '0';
             else if (betType === 'FGM') val = g.fgSplit?.split('-')[0] || '0';
             else if (betType === '3PA') val = g.threePtSplit?.split('-')[1] || '0';
             else if (betType === 'Threes Made') val = g.threePtSplit?.split('-')[0] || '0';
             else if (betType === 'FTM') val = g.ftSplit?.split('-')[0] || '0';
             
             // Handle Combos
             else if (betType === 'Pts + Rebs + Asts') val = (parseFloat(g.points) + parseFloat(g.rebounds) + parseFloat(g.assists)).toString();
             else if (betType === 'Pts + Rebs') val = (parseFloat(g.points) + parseFloat(g.rebounds)).toString();
             else if (betType === 'Pts + Asts') val = (parseFloat(g.points) + parseFloat(g.assists)).toString();
             else if (betType === 'Rebs + Asts') val = (parseFloat(g.rebounds) + parseFloat(g.assists)).toString(); // 🟢 ADDED RA LOGIC
             else if (betType === 'Steals + Blocks') val = (parseFloat(g.steals) + parseFloat(g.blocks)).toString();
             
             // Fantasy Score
             else if (betType === 'Fantasy Score') {
                 const pts = parseFloat(g.points || 0);
                 const reb = parseFloat(g.rebounds || 0);
                 const ast = parseFloat(g.assists || 0);
                 const stl = parseFloat(g.steals || 0);
                 const blk = parseFloat(g.blocks || 0);
                 const to = parseFloat(g.turnovers || 0);
                 const threes = parseFloat(g.threePtSplit?.split('-')[0] || '0');
                 let fantasy = pts + (reb * 1.25) + (ast * 1.5) + (stl * 2) + (blk * 2) - (to * 0.5) + (threes * 0.5);
                 val = fantasy.toFixed(1);
             }
             
             newManualGames[i] = {
               value: val.toString(),
               opponent: g.opponent,
               result: g.result, 
               minutes: g.minutes.toString()
             };
          });
          setManualGames(newManualGames);
        }
      } catch (err) {
        console.error("Could not fetch game logs", err);
      }
      setLoadingData(false);
    };
    loadContextData();
  }, [player.id, player.team, opponent, betType]); 

  const addTeammateInjury = () => {
    if (!selectedTeammate) return;
    if (teammateInjuries.find(i => i.name === selectedTeammate)) return;
    setTeammateInjuries([...teammateInjuries, { name: selectedTeammate, status: teammateStatus }]);
    setSelectedTeammate('');
    setTeammateStatus('OUT');
  };

  const addOpponentInjury = () => {
    if (!selectedOpponent) return;
    if (opponentInjuries.find(i => i.name === selectedOpponent)) return;
    setOpponentInjuries([...opponentInjuries, { name: selectedOpponent, status: opponentStatus }]);
    setSelectedOpponent('');
    setOpponentStatus('OUT');
  };

  const updateManualGame = (index: number, field: string, value: string) => {
    const newGames = [...manualGames];
    newGames[index] = { ...newGames[index], [field]: value };
    setManualGames(newGames);
  };

  const clearGrid = () => {
    setManualGames(Array(5).fill({ value: '', opponent: '', result: '', minutes: '' }));
  };

  // PREDICTION ENGINE
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);

  const handleGenerateClick = () => {
    if (!bettingLine) {
        alert("Please enter a betting line (e.g. 24.5)");
        return;
    }
    setShowWarning(true);
  };

  const handleConfirmRun = async () => {
    setShowWarning(false);
    setIsAnalyzing(true);
    setChatResponse(null); // Reset chat on new run

    const injuryNotes = [
        ...teammateInjuries.map(i => `${i.name} is ${i.status} (Teammate)`),
        ...opponentInjuries.map(i => `${i.name} is ${i.status} (Opponent)`)
    ];

    const filledGames = manualGames.filter(g => g.value !== '');
    let trendDataString = '';
    
    if (filledGames.length > 0) {
        trendDataString = "RECENT GAME LOG:\n" + filledGames.map((g, i) => 
            `- Game ${i+1} vs ${g.opponent || '???'}: ${g.value} ${betType} (Result: ${g.result || '-'}, Mins: ${g.minutes || '?'})`
        ).join('\n');
    }

    if (analystNotes) {
        trendDataString += `\n\nUSER ANALYST NOTES (CRITICAL CONTEXT): ${analystNotes}`;
    }

    const lastGameRow = filledGames[0] || {};
    const derivedStats = {
        points: betType === 'Points' ? lastGameRow.value : 'N/A',
        rebounds: betType === 'Rebounds' ? lastGameRow.value : 'N/A',
        assists: betType === 'Assists' ? lastGameRow.value : 'N/A',
        minutes: lastGameRow.minutes || 'N/A'
    };

    // 🟢 UPDATED: Capture active roster list AND opponent roster to fix AI hallucinations
    const activeRoster = teammates.map((t: any) => t.name).join(', ');
    const opponentRoster = opponents.map((o: any) => o.name).join(', ');

    try {
        const result = await generatePrediction({
            player: player.name,
            opponent: opponent,
            stats: derivedStats, 
            recentGames: recentGames, 
            manualTrend: trendDataString, 
            line: parseFloat(bettingLine),
            betType: betType,
            context: {
                blowout: blowoutRisk,
                injuries: injuryNotes,
                matchup: primaryDefender || "General Defense",
                // 🟢 PASS ROSTERS TO BACKEND
                // @ts-ignore - Ignoring TS check until backend interface is updated
                roster: activeRoster,
                opponentRoster: opponentRoster
            }
        });

        if (result.error) {
            if (result.error.includes("Upgrade Required")) {
                setShowUpgradeModal(true); 
            } else {
                alert("Error: " + result.error);
            }
        } else {
            setPrediction(result);
        }
    } catch (e) {
        alert("Failed to run prediction. Check console.");
        console.error(e);
    }
    setIsAnalyzing(false);
  };

  // --- NEW: HANDLE CHAT SUBMIT ---
  const handleChatSubmit = async () => {
    if (!chatInput) return;
    setIsChatting(true);

    try {
        const result = await chatWithAI({
            originalContext: prediction,
            userMessage: chatInput
        });

        if (result.error) {
            alert(result.error);
        } else {
            setChatResponse(result);
            // If AI changes the pick, update the main display
            if (result.adjusted_pick && result.adjusted_pick !== prediction.pick) {
                setPrediction((prev: any) => ({ ...prev, pick: result.adjusted_pick }));
            }
        }
    } catch (e) {
        console.error("Chat error", e);
    }
    setIsChatting(false);
    setChatInput('');
  };

  return (
    // 🟢 MOBILE FIX 1: Reduced padding from p-8 to p-4 on mobile
    <div className="bg-white border-4 border-black p-4 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] min-h-[600px] relative">
      
      {/* WARNING MODAL */}
      {showWarning && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-yellow-300 border-4 border-black max-w-md w-full shadow-[12px_12px_0px_0px_#000] p-6 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-3xl font-black uppercase leading-none">Wait! Read This.</h3>
                    <button onClick={() => setShowWarning(false)} className="text-black font-bold text-xl hover:scale-110">X</button>
                </div>
                <div className="bg-white border-4 border-black p-4 mb-6 font-mono text-sm font-bold">
                    <p className="mb-2">⚠️ THIS IS NOT A CRYSTAL BALL.</p>
                    <p>
                        Warning: This AI models <strong>gameplans</strong> and <strong>strategy</strong> other than just looking at trends.
                        This is here to help you THINK about what to pick, not tell you!
                        It is NOT a crystal ball. Use this to help you think, not to blindly follow.
                    </p>
                    <p className="mt-2 text-red-600 uppercase underline">Sports are unpredictable. Use responsibly.</p>
                </div>
                <button onClick={handleConfirmRun} className="w-full bg-black text-white border-4 border-black py-4 font-black text-xl hover:bg-zinc-800 transition-all uppercase">
                    I Understand - Run Model
                </button>
            </div>
        </div>
      )}

      {/* PAYWALL MODAL */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border-4 border-black max-w-md w-full shadow-[12px_12px_0px_0px_#000] p-8 text-center animate-in zoom-in-95 duration-200">
                <div className="text-6xl mb-4">🔒</div>
                <h3 className="text-3xl font-black uppercase mb-4">Pro Feature Locked</h3>
                <p className="font-mono mb-8 font-bold leading-relaxed">
                   You must be a Pro member to generate AI predictions. Upgrade now to unlock the full engine.
                </p>
                <a 
                   href="/subscribe" 
                   className="block w-full bg-blue-600 text-white border-4 border-black py-4 font-black text-xl hover:bg-blue-700 transition-all uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
                >
                   UNLOCK NOW
                </a>
                <button 
                    onClick={() => setShowUpgradeModal(false)} 
                    className="mt-6 text-sm font-bold underline text-gray-500 hover:text-black uppercase"
                >
                    Return to Analysis
                </button>
            </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-8 border-b-4 border-black pb-4">
        <div className="flex gap-4 items-center">
          <img src={player.headshot} className="w-20 h-20 rounded-full border-4 border-black bg-zinc-100 object-cover" />
          <div>
            {/* 🟢 MOBILE FIX 2: Text size */}
            <h2 className="text-2xl md:text-3xl font-black uppercase">{player.name}</h2>
            <p className="text-xl font-bold text-gray-500">vs {opponent}</p>
          </div>
        </div>
        <button onClick={onBack} className="text-sm font-bold underline hover:text-blue-600 uppercase">&larr; Back</button>
      </div>

      {/* RESULTS VIEW */}
      {prediction ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between bg-zinc-50 p-6 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div>
              <span className="block font-black text-3xl uppercase">{betType}: {bettingLine}</span>
              <span className="text-sm font-bold text-gray-500">PRIMARY TARGET</span>
            </div>
            <div className="text-right">
              <span className={`block text-6xl font-black ${prediction.pick === 'OVER' ? 'text-green-600' : 'text-red-600'}`}>
                {prediction.pick}
              </span>
              <span className="text-sm font-bold bg-black text-white px-3 py-1 uppercase">{prediction.confidence} Confidence</span>
            </div>
          </div>

          {/* AI Thought Process */}
          <div className="bg-blue-50 border-4 border-black p-6">
            <h3 className="font-black text-xl mb-4 uppercase text-blue-800 flex items-center gap-2"><span>🧠</span> AI Thought Process</h3>
            <ul className="space-y-3">
              {prediction.thought_process?.map((step: string, i: number) => (
                <li key={i} className="font-mono text-sm md:text-base font-bold flex items-start gap-2"><span className="text-blue-500">➤</span> {step}</li>
              ))}
            </ul>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-green-100 border-4 border-black p-4"><h4 className="font-black text-sm uppercase text-green-800 mb-1">🛡 Safe Play</h4><p className="font-bold text-lg">{prediction.safe_line || "N/A"}</p></div>
            <div className="bg-red-100 border-4 border-black p-4"><h4 className="font-black text-sm uppercase text-red-800 mb-1">🔥 Lotto Play</h4><p className="font-bold text-lg">{prediction.risky_line || "N/A"}</p></div>
            <div className="bg-yellow-100 border-4 border-black p-4"><h4 className="font-black text-sm uppercase text-yellow-800 mb-1">💡 Smart Pivot</h4><p className="font-bold text-lg">{prediction.better_prop || "Stick to Main"}</p></div>
          </div>

          {/* --- NEW: CHAT / DEBATE SECTION --- */}
          <div className="bg-zinc-800 p-6 border-4 border-black text-white">
              <h3 className="font-black text-xl uppercase mb-4 flex items-center gap-2"><span>💬</span> Debate the AI</h3>
              
              {/* Chat History / Response */}
              {chatResponse && (
                  <div className="bg-zinc-700 border-2 border-white p-4 mb-4 animate-in slide-in-from-left-2">
                      <p className="font-mono font-bold text-sm mb-2 text-green-400">AI REPLY:</p>
                      <p className="mb-2">{chatResponse.reply}</p>
                      {chatResponse.adjusted_pick !== prediction.pick && (
                          <div className="bg-red-600 text-white px-2 py-1 inline-block text-xs font-black uppercase">
                              PICK CHANGED TO: {chatResponse.adjusted_pick}
                          </div>
                      )}
                  </div>
              )}

              {/* 🟢 MOBILE FIX 4: Flex-col on mobile, Row on desktop */}
              <div className="flex flex-col md:flex-row gap-2">
                  <input 
                    type="text" 
                    placeholder="E.g. But Curry is sitting out tonight..." 
                    className="w-full md:flex-1 p-3 text-black font-bold border-4 border-white focus:outline-none focus:bg-blue-50"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
                  />
                  <button 
                    onClick={handleChatSubmit} 
                    disabled={isChatting}
                    className="w-full md:w-auto bg-white text-black font-black uppercase px-6 py-3 md:py-0 hover:bg-gray-200 border-4 border-white disabled:opacity-50"
                  >
                    {isChatting ? '...' : 'Reply'}
                  </button>
              </div>
          </div>
          
          <button onClick={() => setPrediction(null)} className="w-full border-4 border-black py-4 font-black hover:bg-zinc-200 uppercase tracking-widest text-xl">Run New Simulation</button>
        </div>
      ) : (
        /* INPUT FORM (SAME AS BEFORE) */
        <div className="space-y-8">
            <div className="bg-orange-100 p-4 border-4 border-black">
                <h3 className="font-black text-lg uppercase mb-4 underline decoration-4 decoration-black">1. What is the Line?</h3>
                {/* 🟢 MOBILE FIX 3: Flex-col on mobile, Flex-row on desktop */}
                <div className="flex flex-col md:flex-row gap-4">
                    <select className="p-2 border-4 border-black font-bold w-full md:w-1/2" value={betType} onChange={e => setBetType(e.target.value)}>
                        <optgroup label="Main Stats"><option value="Points">Points</option><option value="Rebounds">Rebounds</option><option value="Assists">Assists</option><option value="Threes Made">Threes Made</option><option value="Fantasy Score">Fantasy Score</option></optgroup>
                        <optgroup label="Defense/Misc"><option value="Turnovers">Turnovers</option><option value="Steals">Steals</option><option value="Blocks">Blocks</option><option value="Steals + Blocks">Steals + Blocks</option></optgroup>
                        {/* 🟢 UPDATED COMBOS LIST */}
                        <optgroup label="Combos">
                            <option value="Pts + Rebs + Asts">Pts + Rebs + Asts</option>
                            <option value="Pts + Rebs">Pts + Rebs</option>
                            <option value="Pts + Asts">Pts + Asts</option>
                            <option value="Rebs + Asts">Rebs + Asts</option>
                            <option value="Double Double">Double Double</option>
                        </optgroup>
                        <optgroup label="Shooting Efficiency"><option value="FGA">FG Attempts</option><option value="FGM">FG Made</option><option value="3PA">3-Pt Attempts</option><option value="FTM">Free Throws Made</option></optgroup>
                    </select>
                    <input type="number" placeholder="e.g. 24.5" className="w-full md:flex-1 p-2 border-4 border-black font-mono text-xl focus:outline-none focus:bg-white" value={bettingLine} onChange={e => setBettingLine(e.target.value)} />
                </div>
            </div>
          
          <div className="bg-zinc-100 p-4 border-4 border-black">
             <h3 className="font-black text-lg uppercase mb-4">2. Game Context & Trends</h3>
             
             <div className="mb-4">
               {recentGames.length > 0 ? (
                 <div className="text-xs font-bold text-green-700 bg-green-100 border border-green-700 p-2 inline-block">
                   ✅ API Connected: Data Loaded.
                 </div>
               ) : (
                 <div className="text-xs font-bold text-red-600 bg-red-100 border border-red-600 p-2 inline-block">
                   ⚠️ API Warning: No data. Please type manually.
                 </div>
               )}
             </div>

             <div className="mb-6">
                <div className="flex justify-between items-end border-b-2 border-black pb-1 mb-2">
                    <label className="text-sm font-bold uppercase">
                        Log for <span className="text-blue-600">{betType}</span>
                    </label>
                    <button onClick={clearGrid} className="text-xs bg-red-100 text-red-600 font-bold px-2 py-1 border border-red-600 hover:bg-red-200">
                        🗑 Clear Data
                    </button>
                </div>
                
                <div className="grid grid-cols-4 gap-2 mb-1 text-xs font-black opacity-50 uppercase">
                    <span>{betType}</span>
                    <span>Opponent</span>
                    <span>Result</span>
                    <span>Minutes</span>
                </div>
                {manualGames.map((game, i) => (
                    <div key={i} className="grid grid-cols-4 gap-2 mb-2">
                        <input placeholder="#" className="p-2 border-2 border-black font-mono text-sm focus:bg-blue-100"
                            value={game.value} onChange={(e) => updateManualGame(i, 'value', e.target.value)} />
                        <input placeholder="e.g. BOS" className="p-2 border-2 border-black font-mono text-sm uppercase focus:bg-blue-100"
                            value={game.opponent} onChange={(e) => updateManualGame(i, 'opponent', e.target.value)} />
                        <input placeholder="W/L" className="p-2 border-2 border-black font-mono text-sm uppercase focus:bg-blue-100"
                            value={game.result} onChange={(e) => updateManualGame(i, 'result', e.target.value)} />
                        <input placeholder="MINS" className="p-2 border-2 border-black font-mono text-sm uppercase focus:bg-blue-100"
                            value={game.minutes} onChange={(e) => updateManualGame(i, 'minutes', e.target.value)} />
                    </div>
                ))}
             </div>

             <div>
                <label className="block text-sm font-bold mb-1 uppercase">📝 Analyst Context (The "Why")</label>
                
                {/* 🟢 NEW TIP BANNER IS HERE */}
                <div className="bg-blue-50 border-l-4 border-blue-600 p-2 mb-3">
                    <p className="text-xs text-blue-900 font-bold">
                        💡 <strong>Pro Tip:</strong> The AI gets smarter with context. The more details you paste here (injuries, narrative, fatigue), the sharper the edge.
                    </p>
                </div>

                <p className="text-xs text-gray-500 mb-2 font-bold">
                    Explain why the stats might be misleading. (e.g. "Star player returning", "Blowout minutes", "Flu game")
                </p>
                <textarea 
                    className="w-full p-2 border-4 border-black font-mono text-sm focus:outline-none focus:bg-yellow-50 h-24"
                    placeholder="Type details here..."
                    value={analystNotes}
                    onChange={(e) => setAnalystNotes(e.target.value)}
                />
             </div>
          </div>

          <div className="bg-zinc-100 p-4 border-4 border-black">
             <h3 className="font-black text-lg uppercase mb-4">3. Blowout Risk?</h3>
             <div className="flex gap-4">
               {['No', 'Maybe', 'Yes'].map((option) => (
                 <button key={option} onClick={() => setBlowoutRisk(option)} className={`flex-1 py-3 font-black border-4 border-black uppercase transition-all ${blowoutRisk === option ? 'bg-black text-white' : 'bg-white'}`}>{option}</button>
               ))}
             </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-zinc-100 p-4 border-4 border-black">
               <h3 className="font-black text-sm uppercase mb-2 text-blue-600">Teammate Status</h3>
               {loadingData ? <p className="animate-pulse font-bold">Loading...</p> : (
                 <div className="flex flex-col gap-2 mb-2">
                   <select className="w-full p-2 border-4 border-black font-bold" value={selectedTeammate} onChange={e => setSelectedTeammate(e.target.value)}>
                     <option value="">Select Player...</option>
                     {teammates.map((t: any) => <option key={t.id} value={t.name}>{t.name}</option>)}
                   </select>
                   <div className="flex gap-2">
                     <select className="flex-1 p-2 border-4 border-black font-bold" value={teammateStatus} onChange={e => setTeammateStatus(e.target.value)}>
                        <option value="OUT">OUT</option>
                        <option value="OUT FOR SEASON">OUT FOR SEASON</option>
                        <option value="DOUBTFUL">DOUBTFUL</option>
                        <option value="QUESTIONABLE">QUESTIONABLE</option>
                        <option value="PROBABLE">PROBABLE</option>
                     </select>
                     <button onClick={addTeammateInjury} className="bg-black text-white px-4 font-bold border-4 border-black hover:bg-zinc-800">ADD</button>
                   </div>
                 </div>
               )}
               <div className="mt-2 flex flex-wrap gap-1">{teammateInjuries.map((inj, i) => (<span key={i} className="text-xs bg-blue-200 border border-black px-1 font-bold flex items-center gap-1">{inj.name} ({inj.status}) <button onClick={() => setTeammateInjuries(teammateInjuries.filter(x => x.name !== inj.name))} className="text-red-600 ml-1">x</button></span>))}</div>
            </div>

            <div className="bg-zinc-100 p-4 border-4 border-black">
               <h3 className="font-black text-sm uppercase mb-2 text-red-600">Opponent Status</h3>
               {loadingData ? <p className="animate-pulse font-bold">Loading...</p> : (
                 <div className="flex flex-col gap-2 mb-2">
                   <select className="w-full p-2 border-4 border-black font-bold" value={selectedOpponent} onChange={e => setSelectedOpponent(e.target.value)}>
                     <option value="">Select Player...</option>
                     {opponents.map((t: any) => <option key={t.id} value={t.name}>{t.name}</option>)}
                   </select>
                   <div className="flex gap-2">
                     <select className="flex-1 p-2 border-4 border-black font-bold" value={opponentStatus} onChange={e => setOpponentStatus(e.target.value)}>
                        <option value="OUT">OUT</option>
                        <option value="OUT FOR SEASON">OUT FOR SEASON</option>
                        <option value="DOUBTFUL">DOUBTFUL</option>
                        <option value="QUESTIONABLE">QUESTIONABLE</option>
                        <option value="PROBABLE">PROBABLE</option>
                     </select>
                     <button onClick={addOpponentInjury} className="bg-black text-white px-4 font-bold border-4 border-black hover:bg-zinc-800">ADD</button>
                   </div>
                 </div>
               )}
               <div className="mt-2 flex flex-wrap gap-1">{opponentInjuries.map((inj, i) => (<span key={i} className="text-xs bg-red-200 border border-black px-1 font-bold flex items-center gap-1">{inj.name} ({inj.status}) <button onClick={() => setOpponentInjuries(opponentInjuries.filter(x => x.name !== inj.name))} className="text-red-600 ml-1">x</button></span>))}</div>
            </div>
          </div>

          <div className="bg-zinc-100 p-4 border-4 border-black">
             <h3 className="font-black text-lg uppercase mb-4">4. Primary Defender</h3>
             <select className="w-full p-2 border-4 border-black font-bold" value={primaryDefender} onChange={e => setPrimaryDefender(e.target.value)}>
                <option value="">Who is guarding {player.name}?</option>
                {opponents.map((o: any) => <option key={o.id} value={o.name}>{o.name} ({o.position})</option>)}
             </select>
          </div>

          <button onClick={handleGenerateClick} disabled={isAnalyzing} className="w-full bg-green-500 border-4 border-black text-black font-black text-xl py-4 hover:bg-green-400 hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all uppercase disabled:opacity-50">
            {isAnalyzing ? 'Analyzing with AI...' : 'Generate Prediction'}
          </button>
        </div>
      )}
    </div>
  );
}
