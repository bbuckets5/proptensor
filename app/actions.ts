'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { auth, currentUser } from '@clerk/nextjs/server';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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
  // user.createdAt is in milliseconds. 
  // 24 hours = 1000 * 60 * 60 * 24 = 86400000 ms
  const oneDay = 86400000;
  const isFreeTrial = (Date.now() - user.createdAt) < oneDay;

  // Grant access if either is true
  return isPro || isFreeTrial;
}

// --- 1. SINGLE PREDICTION ---
export async function generatePrediction(data: PredictionData) {
  // 🟢 SECURITY GATE
  const isAllowed = await checkProStatus();
  if (!isAllowed) {
    return { error: "Upgrade Required: You must be a Pro member to use the AI." };
  }

  if (!process.env.GEMINI_API_KEY) {
    return { error: "Missing Gemini API Key. Please add it to .env.local" };
  }

  const trendSource = data.manualTrend 
    ? `USER ANALYST DATA & NOTES:\n${data.manualTrend}` 
    : `RAW GAME LOG:\n${JSON.stringify(data.recentGames)}`;

  const prompt = `
    You are a professional NBA Betting Strategist.
    
    ### THE MATCHUP
    - Player: ${data.player}
    - Opponent: ${data.opponent}
    - BET: ${data.betType} @ ${data.line}

    ### 1. THE DATA
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
    1. TRUST THE USER NOTES ABOVE ALL ELSE.
    2. Analyze efficiency (shooting splits) over raw points.
    3. Be decisive.

    ### OUTPUT (JSON ONLY):
    {
      "pick": "OVER" or "UNDER",
      "confidence": "Strong/Medium/Risky",
      "thought_process": ["Step 1...", "Step 2...", "Step 3...", "Step 4..."],
      "safe_line": "Alternative safe bet",
      "risky_line": "High risk ladder play",
      "better_prop": "Pivot suggestion"
    }
  `;

  try {
    const model = genAI.getGenerativeModel({ 
        model: "gemini-flash-latest", 
        generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return JSON.parse(responseText);

  } catch (error: any) {
    console.error("Gemini Error:", error);
    return { error: `AI Error: ${error.message}` };
  }
}

// --- 2. PARLAY GENERATOR ---
export async function generateParlay(data: ParlayRequest) {
  // 🟢 SECURITY GATE
  const isAllowed = await checkProStatus();
  if (!isAllowed) {
    return { error: "Upgrade Required: You must be a Pro member to generate Parlays." };
  }

  const prompt = `
    You are a High-Stakes Vegas Handicapper.
    
    ### CRITICAL INSTRUCTION:
    You DO NOT have access to live internet. You DO NOT know today's specific injuries or schedule unless the user provided them below.
    
    If the user provided specific teams and injury news in the "NOTES" section below, analyze that strictly.
    
    IF THE USER DID NOT PROVIDE SPECIFIC GAMES/INJURIES:
    - Do NOT make up a "hypothetical slate".
    - Instead, generate a response that says: "⚠️ I need the slate! Please paste today's matchups and injury report in the box so I can give you a real lock."
    - Do NOT return a fake bet.
    
    ### USER NOTES (THE SOURCE OF TRUTH):
    "${data.notes}"

    ### TASK:
    Construct a 3-Leg Parlay based ONLY on the user notes above. 
    If they mentioned specific players being OUT (like Sabonis), FACTOR THAT IN IMMEDIATELY.
    
    ### OUTPUT (JSON ONLY):
    {
      "parlay_name": "The Custom Lock",
      "total_odds": "+400 (Estimate)",
      "risk_level": "Medium",
      "legs": [
        { 
            "game": "Matchup Name", 
            "bet": "Player Prop or Team ML", 
            "reason": "Specific reason based on user notes..." 
        }
      ],
      "analysis": "Summary of your logic based on the user's provided context."
    }
  `;

  try {
    const model = genAI.getGenerativeModel({ 
        model: "gemini-flash-latest", 
        generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());

  } catch (error: any) {
    console.error("Parlay Error:", error);
    return { error: "Failed to generate parlay." };
  }
}

// --- 3. CHAT / DEBATE (UPDATED WITH REALITY CHECK) ---
export async function chatWithAI(data: ChatRequest) {
    // 🟢 SECURITY GATE
    const isAllowed = await checkProStatus();
    if (!isAllowed) {
      return { error: "Upgrade Required" };
    }

    // 🗓️ FORCE THE DATE & CONTEXT
    // This fixes the issue where the AI thinks it's 2024.
    const today = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
  
    const prompt = `
      You are a stubborn but logical NBA Analyst. 
      
      ### CRITICAL REALITY CHECK:
      - **CURRENT DATE:** ${today}
      - **SEASON:** 2025-26 NBA Season.
      - **ROSTER RULES:** The user is providing live, real-time data from the future (relative to your training data). 
      - **DO NOT** use your internal training data to contradict the user's roster or stats. 
      - If the user says Brandon Ingram is on the Raptors, **HE IS ON THE RAPTORS**.
      - If the user says it is 2026, **IT IS 2026**.
  
      ### PREVIOUS PREDICTION CONTEXT:
      ${JSON.stringify(data.originalContext)}
  
      ### USER'S ARGUMENT:
      "${data.userMessage}"
  
      ### INSTRUCTIONS:
      1. Analyze the user's point based on the *current* 2025-26 reality, not 2024.
      2. If the user mentions a trade or injury that contradicts your training data, **ASSUME THE USER IS CORRECT**.
      3. If they are right, admit it and adjust the pick.
      4. If they are wrong (e.g. relying on emotion), double down.
      5. Keep it short, conversational, and slightly edgy.
  
      ### OUTPUT (JSON ONLY):
      {
        "reply": "Your text response to the user...",
        "adjusted_pick": "OVER (or SAME)",
        "confidence_change": "Increased/Decreased/Same"
      }
    `;
  
    try {
      const model = genAI.getGenerativeModel({ 
          model: "gemini-flash-latest", 
          generationConfig: { responseMimeType: "application/json" }
      });
  
      const result = await model.generateContent(prompt);
      return JSON.parse(result.response.text());
  
    } catch (error: any) {
      console.error("Chat Error:", error);
      return { error: "Failed to reply." };
    }
}
