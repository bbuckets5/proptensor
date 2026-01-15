'use server';

// 🟢 ROBUST TEAM MAP: Ensures ESPN never rejects a team code
const TEAM_MAP: Record<string, string> = {
  // Common Issues Fixed
  "UTA": "utah",
  "NOP": "no",
  "SAS": "sa",
  "GSW": "gs",
  "NYK": "ny",
  "WAS": "wsh",
  "PHX": "phx", // Sometimes PHO, but PHX usually works on v2
  "BKN": "bkn",
  "OKC": "okc",
  // Standard (Just in case)
  "ATL": "atl", "BOS": "bos", "CHA": "cha", "CHI": "chi", "CLE": "cle",
  "DAL": "dal", "DEN": "den", "DET": "det", "HOU": "hou", "IND": "ind",
  "LAC": "lac", "LAL": "lal", "MEM": "mem", "MIA": "mia", "MIL": "mil",
  "MIN": "min", "ORL": "orl", "PHI": "phi", "POR": "por", "SAC": "sac",
  "TOR": "tor"
};

export async function getRoster(teamAbbrev: string) {
  const upper = teamAbbrev.toUpperCase();
  // Use the map, or fallback to the original if not found
  const cleanAbbrev = TEAM_MAP[upper] || teamAbbrev.toLowerCase();

  const response = await fetch(
    `http://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${cleanAbbrev}/roster`,
    { cache: 'no-store' }
  );

  if (!response.ok) {
    console.error(`Failed to fetch roster for ${teamAbbrev} (mapped to: ${cleanAbbrev})`);
    return [];
  }

  const data = await response.json();
  const athletes = data.athletes || [];

  return athletes.map((player: any) => ({
    id: player.id,
    name: player.fullName,
    position: player.position.abbreviation,
    headshot: player.headshot?.href || "https://cdn.nba.com/headshots/nba/latest/1040x760/fallback.png",
    jersey: player.jersey
  }));
}

// --- UPDATED FUNCTION WITH CORRECT REVERSE LOGIC ---

export async function getLast10Games(playerId: string) {
  try {
    const response = await fetch(
      `https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${playerId}/gamelog`,
      { cache: 'no-store' }
    );

    if (!response.ok) return [];

    const data = await response.json();
    
    // Specifically look for the Regular Season (id "2")
    const seasonTypes = data.seasonTypes || [];
    const regularSeason = seasonTypes.find((s: any) => s.id === "2" || s.slug === "regular-season") || seasonTypes[0];
    
    const events = regularSeason?.categories?.[0]?.events || [];
    
    // 🟢 THE FIX: Reverse the array to get NEWEST games first, then take 10
    const last10 = events.reverse().slice(0, 10);

    return last10.map((game: any) => {
      const stats = game.stats; 
      
      // ESPN 2024-25 Stat Map:
      // 0:MIN, 1:FG, 2:FG%, 3:3PT, 4:3P%, 5:FT, 6:FT%, 7:REB, 8:AST, 9:BLK, 10:STL, 11:PF, 12:TO, 13:PTS
      
      return {
        // UI DATA (Seen by User in Grid)
        date: game.gameDate,
        opponent: game.opponent?.abbreviation || "OPP",
        result: game.gameResult || "-",
        score: game.score || "",
        
        minutes: stats[0] || "0",
        points: stats[13] || "0",
        rebounds: stats[7] || "0",
        assists: stats[8] || "0",

        // DEEP DATA (Hidden for AI Analysis)
        steals: stats[10] || "0",
        blocks: stats[9] || "0",
        turnovers: stats[12] || "0",
        fgSplit: stats[1] || "0-0",   // e.g. "7-14"
        threePtSplit: stats[3] || "0-0", // e.g. "2-5"
        ftSplit: stats[5] || "0-0"    // e.g. "5-6"
      };
    });
  } catch (error) {
    console.error("Failed to fetch game log:", error);
    return [];
  }
}
