'use server';

import OpenAI from 'openai';
import { auth, currentUser } from '@clerk/nextjs/server';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
});

// --- INTERFACES ---

interface PredictionData {
  player: string;
  opponent: string;
  stats: any;
  recentGames: any[];
  manualTrend?: string;
  line: number;
  betType: string;
  context: {
    blowout: string;
    injuries: string[];
    matchup: string;
    roster?: string;         
    opponentRoster?: string; 
  };
}

interface ParlayRequest {
  date: string;
  games: string[]; 
  notes?: string; 
}

interface ChatRequest {
  originalContext: any; 
  userMessage: string;  
}

// --- HELPER: STRICT PRO CHECK (NO FREE TRIAL) ---
async function checkProStatus() {
  const user = await currentUser();
  
  if (!user) return false;

  // 🟢 STRICT MODE: Only allow if metadata says 'pro'
  const isPro = user.publicMetadata?.plan === 'pro';

  return isPro; 
}

// --- 1. SINGLE PREDICTION (OPENAI STRICT MODE) ---
export async function generatePrediction(data: PredictionData) {
  // 🟢 SECURITY GATE
  const isAllowed = await checkProStatus();
  if (!isAllowed) {
    return { error: "Upgrade Required: You must be a Pro member to use the AI." };
  }

  if (!process.env.OPENAI_API_KEY) {
    return { error: "Missing OpenAI API Key. Please add it to .env.local" };
  }

  const trendSource = data.manualTrend 
    ? `USER ANALYST DATA & NOTES:\n${data.manualTrend}` 
    : `RAW GAME LOG (Past Performance):\n${JSON.stringify(data.recentGames)}`;

  // 🟢 ROSTER INJECTION
  const activeRoster = data.context.roster || "Unknown";
  const opponentRoster = data.context.opponentRoster || "Unknown";

  const prompt = `
    You are a professional NBA Betting Strategist.
    
    ### 0. 🚨 CRITICAL ROSTER CHECK (LIVE DATA)
    **A. TEAMMATE CHECK (Usage & Volume)**
    - **Active Roster:** [ ${activeRoster} ]
    - **Instruction:** Compare this Active Roster to the Historical Game Logs. 
    - **Logic:** If a high-usage starter is **ACTIVE** today but was **MISSING** from the recent logs (Returning from Injury), you MUST assume they will take usage away from ${data.player}.
    
    **B. OPPONENT CHECK (Defense & Matchups)**
    - **Opponent Roster:** [ ${opponentRoster} ]
    - **Instruction:** Look for elite defenders (e.g. Gobert, Wemby, Bam) in this list.

    ### THE MATCHUP
    - Player: ${data.player}
    - Opponent: ${data.opponent}
    - BET: ${data.betType} @ ${data.line}

    ### 1. THE DATA (HISTORY)
    ${trendSource}
    
    ### 2. DEEP STAT CONTEXT
    - Shooting Splits: ${data.stats.fgSplit || '?'} / ${data.stats.threePtSplit || '?'}
    - Defense: ${data.stats.steals || '0'} Stl, ${data.stats.blocks || '0'} Blk
    - Turnovers: ${data.stats.turnovers || '0'}
    - Minutes: ${data.stats.minutes || '0'}

    ### 3. CONTEXT
    - Blowout Risk: ${data.context.blowout}
    - Injuries: ${data.context.injuries.join(', ') || "None"}
    - Matchup: ${data.context.matchup}

    ### RULES:
    1. TRUST THE ROSTER LIST ABOVE ALL ELSE.
    2. Analyze efficiency over raw points.
    3. Be decisive.

    ### OUTPUT FORMAT (JSON ONLY):
    You must return a valid JSON object. Do not add markdown formatting.
    {
      "pick": "OVER" or "UNDER", 
      "confidence": "Strong" or "Medium" or "Risky",
      "thought_process": [
          "1. Roster Check: I see [Star Name] is ACTIVE...", 
          "2. Step 2...", 
          "3. Step 3..."
      ],
      "safe_line": "Alternative safe bet",
      "risky_line": "High risk ladder play",
      "better_prop": "Pivot suggestion"
    }
    
    IMPORTANT: "pick" MUST be exactly "OVER" or "UNDER". No other words.
    IMPORTANT: "confidence" MUST be exactly "Strong", "Medium", or "Risky".
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [
        { role: "system", content: "You are a helpful sports betting assistant that outputs strict JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }, 
      temperature: 0, 
    });

    const responseText = completion.choices[0].message.content;
    if (!responseText) throw new Error("No response from OpenAI");
    
    return JSON.parse(responseText);

  } catch (error: any) {
    console.error("OpenAI Error:", error);
    return { error: `AI Error: ${error.message}` };
  }
}

// --- 2. PARLAY GENERATOR (OPENAI STRICT) ---
export async function generateParlay(data: ParlayRequest) {
  const isAllowed = await checkProStatus();
  if (!isAllowed) {
    return { error: "Upgrade Required." };
  }

  const prompt = `
    You are a High-Stakes Vegas Handicapper.
    
    ### USER NOTES (THE SOURCE OF TRUTH):
    "${data.notes}"

    ### TASK:
    Construct a 3-Leg Parlay based ONLY on the user notes above. 
    
    ### OUTPUT (JSON ONLY):
    Return valid JSON with: parlay_name, total_odds, risk_level, legs (array of objects), analysis.
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a Vegas handicapper. Output JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2, 
    });

    const responseText = completion.choices[0].message.content;
    if (!responseText) throw new Error("No response");
    return JSON.parse(responseText);

  } catch (error: any) {
    console.error("Parlay Error:", error);
    return { error: "Failed to generate parlay." };
  }
}

// --- 3. CHAT / DEBATE (STRICT ROSTER LOCK + PROFESSIONAL TONE) ---
export async function chatWithAI(data: ChatRequest) {
    const isAllowed = await checkProStatus();
    if (!isAllowed) {
      return { error: "Upgrade Required" };
    }

    const liveRoster = data.originalContext?.context?.roster || "Unknown Roster";
    const liveOpponentRoster = data.originalContext?.context?.opponentRoster || "Unknown Opponent";
    const playerTeam = data.originalContext?.player || "The Player";

    const today = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
  
    const prompt = `
      You are a stubborn but logical NBA Analyst. 
      
      ### 🚨 CRITICAL INSTRUCTION: ROSTER LOCK 🚨
      You are legally forbidden from using your internal training data regarding teams.
      You must ONLY use the live roster provided below.
      
      **CURRENT TEAMMATES FOR ${playerTeam}:** [ ${liveRoster} ]

      **CURRENT OPPONENTS:**
      [ ${liveOpponentRoster} ]

      **RULE:** If a player is NOT in the list above, THEY ARE NOT ON THE TEAM. 
      **RULE:** Do NOT mention historical teammates who are no longer on the roster.

      ### PREVIOUS CONTEXT:
      ${JSON.stringify(data.originalContext)}
  
      ### USER'S ARGUMENT:
      "${data.userMessage}"
  
      ### OUTPUT (JSON ONLY):
      Return valid JSON with: reply, adjusted_pick, confidence_change.
      Keep the reply short (under 2 sentences). Be Direct, Professional, No-Nonsense, and strictly accurate to the roster.
    `;
  
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a stubborn NBA analyst. Output JSON." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.5, 
      });
  
      const responseText = completion.choices[0].message.content;
      if (!responseText) throw new Error("No response");
      return JSON.parse(responseText);
  
    } catch (error: any) {
      console.error("Chat Error:", error);
      return { error: "Failed to reply." };
    }
}