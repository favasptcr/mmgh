// ISO 3166-1 alpha-2 codes for flagcdn.com image URLs.
// Both seed names and ESPN display name variants are included so flags
// work regardless of which name the sync stores in the DB.
export const ISO_CODES = {
  // Seed names
  "Mexico": "mx", "South Africa": "za", "South Korea": "kr", "Czechia": "cz",
  "Canada": "ca", "Bosnia & Herz.": "ba", "USA": "us", "Paraguay": "py",
  "Qatar": "qa", "Switzerland": "ch", "Brazil": "br", "Morocco": "ma",
  "Haiti": "ht", "Scotland": "gb-sct", "Australia": "au", "Turkey": "tr",
  "Germany": "de", "Curacao": "cw", "Netherlands": "nl", "Japan": "jp",
  "Ivory Coast": "ci", "Ecuador": "ec", "Ukraine": "ua", "Tunisia": "tn",
  "Spain": "es", "Cape Verde": "cv", "Belgium": "be", "Egypt": "eg",
  "Saudi Arabia": "sa", "Uruguay": "uy", "Iran": "ir", "New Zealand": "nz",
  "France": "fr", "Senegal": "sn", "Iraq": "iq", "Norway": "no",
  "Argentina": "ar", "Algeria": "dz", "Austria": "at", "Jordan": "jo",
  "Portugal": "pt", "DRC": "cd", "Uzbekistan": "uz", "Colombia": "co",
  "England": "gb-eng", "Croatia": "hr", "Ghana": "gh", "Panama": "pa",
  "Denmark": "dk", "Sweden": "se",
  // ESPN display name variants
  "United States": "us", "Bosnia-Herzegovina": "ba",
  "Congo DR": "cd", "DR Congo": "cd",
  "Cote d'Ivoire": "ci", "Côte d'Ivoire": "ci",
  "Türkiye": "tr", "Cabo Verde": "cv", "Korea Republic": "kr",
  "Curaçao": "cw", "Czech Republic": "cz",
};

// Keep emoji map for any direct string usage elsewhere
export const FLAG_EMOJIS = {
  "Mexico": "🇲🇽", "South Africa": "🇿🇦", "South Korea": "🇰🇷", "Czechia": "🇨🇿",
  "Canada": "🇨🇦", "Bosnia & Herz.": "🇧🇦", "USA": "🇺🇸", "Paraguay": "🇵🇾",
  "Qatar": "🇶🇦", "Switzerland": "🇨🇭", "Brazil": "🇧🇷", "Morocco": "🇲🇦",
  "Haiti": "🇭🇹", "Scotland": "🇬🇧", "Australia": "🇦🇺", "Turkey": "🇹🇷",
  "Germany": "🇩🇪", "Curacao": "🇨🇼", "Netherlands": "🇳🇱", "Japan": "🇯🇵",
  "Ivory Coast": "🇨🇮", "Ecuador": "🇪🇨", "Ukraine": "🇺🇦", "Tunisia": "🇹🇳",
  "Spain": "🇪🇸", "Cape Verde": "🇨🇻", "Belgium": "🇧🇪", "Egypt": "🇪🇬",
  "Saudi Arabia": "🇸🇦", "Uruguay": "🇺🇾", "Iran": "🇮🇷", "New Zealand": "🇳🇿",
  "France": "🇫🇷", "Senegal": "🇸🇳", "Iraq": "🇮🇶", "Norway": "🇳🇴",
  "Argentina": "🇦🇷", "Algeria": "🇩🇿", "Austria": "🇦🇹", "Jordan": "🇯🇴",
  "Portugal": "🇵🇹", "DRC": "🇨🇩", "Uzbekistan": "🇺🇿", "Colombia": "🇨🇴",
  "England": "🇬🇧", "Croatia": "🇭🇷", "Ghana": "🇬🇭", "Panama": "🇵🇦",
  "Denmark": "🇩🇰", "Sweden": "🇸🇪",
  "United States": "🇺🇸", "Bosnia-Herzegovina": "🇧🇦",
  "Congo DR": "🇨🇩", "DR Congo": "🇨🇩",
  "Cote d'Ivoire": "🇨🇮", "Côte d'Ivoire": "🇨🇮",
  "Türkiye": "🇹🇷", "Cabo Verde": "🇨🇻", "Korea Republic": "🇰🇷",
  "Curaçao": "🇨🇼", "Czech Republic": "🇨🇿",
};

export const isPlaceholderTeam = (team) =>
  !team || /^(TBD|Semifinal)/i.test(team) || /round of/i.test(team) || /winner|loser/i.test(team);

export const getFlag = (team) => {
  if (isPlaceholderTeam(team)) return "❓";
  return FLAG_EMOJIS[team] || "🏳️";
};

export const GROUP_COLORS = {
  A: "#FF4757", B: "#FF7F50", C: "#FFD24A", D: "#39FF14",
  E: "#1ABC9C", F: "#00F0FF", G: "#A855F7", H: "#FF007F",
  I: "#00BCD4", J: "#FF6B35", K: "#8BC34A", L: "#FFE066",
};

export const ROUND_ORDER = [
  "Group Stage", "Round of 32", "Round of 16",
  "Quarterfinal", "Semifinal", "3rd Place", "Final",
];

export const ROUND_LABEL = {
  "Group Stage": "Groups",
  "Round of 32": "R32",
  "Round of 16": "R16",
  "Quarterfinal": "QF",
  "Semifinal": "SF",
  "3rd Place": "3rd",
  "Final": "Final",
};

// Scoring tables for R16 onwards (new system).
// Group Stage + R32 use the old system (+4 exact, +1 correct outcome, +2 pen bonus).
export const KO_SCORING = {
  "Round of 16":  { rw: 3, rl: 2, sw: 5, sl: 2, ow: 2, ol: 2, skip: 3 },
  "Quarterfinal": { rw: 4, rl: 2, sw: 6, sl: 2, ow: 3, ol: 2, skip: 3 },
  "Semifinal":    { rw: 5, rl: 3, sw: 8, sl: 3, ow: 3, ol: 3, skip: 4 },
  "3rd Place":    { rw: 5, rl: 3, sw: 8, sl: 3, ow: 3, ol: 3, skip: 4 },
  "Final":        { rw: 8, rl: 4, sw: 12, sl: 4, ow: 5, ol: 4, skip: 5 },
};

// Group Stage + R32: +4 exact | +1 correct outcome | +2 pen bonus (max 6)
// R16+: result/score/shootout scored independently; see KO_SCORING table
export function calcPoints(predH, predA, actH, actA, round = "Group Stage",
                           predPenH = null, predPenA = null,
                           actPenH = null, actPenA = null,
                           predPenWinner = null, actPenWinner = null) {
  if (actH == null || actA == null || predH == null || predA == null) return null;

  const sc = KO_SCORING[round];

  if (!sc) {
    // OLD SYSTEM: Group Stage + Round of 32
    const isActualDraw = actH === actA;
    const aPenH = isActualDraw ? actPenH : null;
    const aPenA = isActualDraw ? actPenA : null;
    const penBonus = (
      aPenH != null && aPenA != null &&
      predPenH != null && predPenA != null &&
      Number(predPenH) === Number(aPenH) && Number(predPenA) === Number(aPenA)
    ) ? 2 : 0;
    let actualWinner = null;
    if (aPenH != null && aPenA != null) {
      actualWinner = aPenH > aPenA ? "home" : "away";
    } else {
      actualWinner = actH > actA ? "home" : actA > actH ? "away" : null;
    }
    if (predH === actH && predA === actA) return 4 + penBonus;
    const predWinner = predH > predA ? "home" : predA > predH ? "away" : null;
    const correctOutcome = predWinner === null ? actH === actA : predWinner === actualWinner;
    if (correctOutcome) return 1 + penBonus;
    return penBonus;
  }

  // NEW SYSTEM: R16, QF, SF, 3rd Place, Final
  const isDrawResult = actH === actA;
  const predWinner = predH > predA ? "home" : predA > predH ? "away" : null;
  const act90Winner = actH > actA ? "home" : actA > actH ? "away" : null;
  // Result call: purely 90-min outcome (not who advanced via penalties)
  const correctResult = predWinner === null ? isDrawResult : predWinner === act90Winner;
  let pts = correctResult ? sc.rw : -sc.rl;
  // Score: only checked if result call was correct
  if (correctResult) pts += (predH === actH && predA === actA) ? sc.sw : -sc.sl;
  // Shootout: +ow only if exact penalty goals match; -ol if wrong winner; 0 if correct winner but wrong goals
  if (actPenWinner != null) {
    const exactPen = predPenH != null && predPenA != null &&
                     actPenH != null && actPenA != null &&
                     Number(predPenH) === Number(actPenH) && Number(predPenA) === Number(actPenA);
    if (exactPen) pts += sc.ow;
    else if (predPenWinner !== actPenWinner) pts -= sc.ol;
    // correct winner but wrong/no goals: no change
  }
  return pts;
}
