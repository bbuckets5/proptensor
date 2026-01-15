'use server';

import OpenAI from 'openai';
import { auth, currentUser } from '@clerk/nextjs/server';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this is in .env.local
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
    roster?: string;         // 🟢 Teammates (Live from ESPN)
    opponentRoster?: string; // 🟢 Opponents (Live from ESPN)
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

// --- HELPER: CHECK IF USER IS PRO OR IN FREE TRIAL ---
async function checkProStatus() {
  const user = await currentUser();
  
  if (!user) return false;

  // 1. Check if they bought the plan (Stripe)
  const isPro = user.publicMetadata?.plan === 'pro';

  // 2. Check if they are in the 24-Hour Free Trial
  const oneDay = 86400000;
  const isFreeTrial = (Date.now() - user.createdAt) < oneDay;

  return isPro || isFreeTrial;
}

// --- 1. SINGLE PREDICTION (OPENAI VERSION) ---
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

    ### 0. 🚨 CRITICAL REALITY CHECK (2026 SEASON)
    
    **A. TEAMMATE CHECK (Usage & Volume)**
    - **Active Roster:** [ ${activeRoster} ]
    - **Instruction:** This is the LIVE 2026 Roster. If you see stars (e.g. Brandon Ingram, Zion) listed here who are NOT in the historical logs, **THEY ARE PLAYING**. You MUST assume they will take shots away from ${data.player}.
    - **Note:** Ignore your internal training data if it says these players are on other teams. This list is the source of truth.
    
    **B. OPPONENT CHECK (Defense & Matchups)**
    - **Opponent Roster:** [ ${opponentRoster} ]
    - **Instruction:** Look for elite defenders (e.g. Gobert, Wemby, Bam) in this list to determine matchup difficulty.

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
    2. Analyze efficiency (shooting splits) over raw points.
    3. Be decisive.

    ### OUTPUT (JSON ONLY):
    Return a valid JSON object with these keys: pick, confidence, thought_process (array), safe_line, risky_line, better_prop.
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Strongest model for reasoning
      messages: [
        { role: "system", content: "You are a helpful sports betting assistant that outputs JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }, 
    });

    const responseText = completion.choices[0].message.content;
    if (!responseText) throw new Error("No response from OpenAI");
    
    return JSON.parse(responseText);

  } catch (error: any) {
    console.error("OpenAI Error:", error);
    return { error: `AI Error: ${error.message}` };
  }
}

// --- 2. PARLAY GENERATOR (OPENAI VERSION) ---
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
    });

    const responseText = completion.choices[0].message.content;
    if (!responseText) throw new Error("No response");
    return JSON.parse(responseText);

  } catch (error: any) {
    console.error("Parlay Error:", error);
    return { error: "Failed to generate parlay." };
  }
}

// --- 3. CHAT / DEBATE (OPENAI VERSION) ---
export async function chatWithAI(data: ChatRequest) {
    const isAllowed = await checkProStatus();
    if (!isAllowed) {
      return { error: "Upgrade Required" };
    }

    const today = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
  
    const prompt = `
      You are a stubborn but logical NBA Analyst. 
      
      ### CRITICAL REALITY CHECK:
      - **CURRENT DATE:** ${today}
      - **SEASON:** 2025-26 NBA Season.
      - **ROSTER RULES:** The user is providing live, real-time data from the future. 
      - If the user says Brandon Ingram is on the Raptors, **HE IS ON THE RAPTORS**.
  
      ### PREVIOUS CONTEXT:
      ${JSON.stringify(data.originalContext)}
  
      ### USER'S ARGUMENT:
      "${data.userMessage}"
  
      ### OUTPUT (JSON ONLY):
      Return valid JSON with: reply, adjusted_pick, confidence_change.
    `;
  
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a stubborn NBA analyst. Output JSON." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
      });
  
      const responseText = completion.choices[0].message.content;
      if (!responseText) throw new Error("No response");
      return JSON.parse(responseText);
  
    } catch (error: any) {
      console.error("Chat Error:", error);
      return { error: "Failed to reply." };
    }
}
