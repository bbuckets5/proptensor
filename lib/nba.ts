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

// --- UPDATED: DYNAMIC STAT MAPPING (Fixes "Wrong Stats" Bug) ---

export async function getLast10Games(playerId: string) {
  try {
    const response = await fetch(
      `https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${playerId}/gamelog`,
      { cache: 'no-store' }
    );

    if (!response.ok) return [];

    const data = await response.json();
    
    // 1. Locate Regular Season
    const seasonTypes = data.seasonTypes || [];
    const regularSeason = seasonTypes.find((s: any) => s.id === "2" || s.slug === "regular-season") || seasonTypes[0];
    
    if (!regularSeason) return [];

    // 2. Get Data & Headers
    const category = regularSeason.categories?.[0];
    const events = category?.events || [];
    const labels = category?.labels || []; // 🟢 HEADERS: ["MIN", "FG", "REB", "AST", "PTS"...]

    // 3. Map Indices Dynamically (Find where "PTS" lives)
    // This prevents errors if ESPN shifts columns around
    const idx = {
        min: labels.indexOf("MIN"),
        pts: labels.indexOf("PTS"),
        reb: labels.indexOf("REB"),
        ast: labels.indexOf("AST"),
        stl: labels.indexOf("STL"),
        blk: labels.indexOf("BLK"),
        to:  labels.indexOf("TO"),
        fg:  labels.indexOf("FG"),
        t3:  labels.indexOf("3PT"),
        ft:  labels.indexOf("FT")
    };

    // Fallback if headers fail (Standard 2025 Map)
    if (idx.pts === -1) {
        idx.min=0; idx.fg=1; idx.t3=3; idx.ft=5; idx.reb=7; idx.ast=8; idx.blk=9; idx.stl=10; idx.to=12; idx.pts=13;
    }

    // 4. Filter only played games & Get Last 10 Newest
    const playedGames = events
        .filter((g: any) => g.stats && g.stats.length > 0) // Only games with stats
        .reverse() // Newest first
        .slice(0, 10);

    return playedGames.map((game: any) => {
      const s = game.stats; 
      
      return {
        // UI DATA (Seen by User in Grid)
        date: game.gameDate,
        opponent: game.opponent?.abbreviation || "OPP",
        result: game.gameResult || "-",
        score: game.score || "",
        
        // DYNAMIC MAPPED STATS
        minutes: s[idx.min] || "0",
        points: s[idx.pts] || "0",
        rebounds: s[idx.reb] || "0",
        assists: s[idx.ast] || "0",

        // DEEP DATA (Hidden for AI Analysis)
        steals: s[idx.stl] || "0",
        blocks: s[idx.blk] || "0",
        turnovers: s[idx.to] || "0",
        
        // Splits
        fgSplit: s[idx.fg] || "0-0", 
        threePtSplit: s[idx.t3] || "0-0",
        ftSplit: s[idx.ft] || "0-0"
      };
    });
  } catch (error) {
    console.error("Failed to fetch game log:", error);
    return [];
  }
}
