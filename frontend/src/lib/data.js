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
  "Haiti": "🇭🇹", "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "Australia": "🇦🇺", "Turkey": "🇹🇷",
  "Germany": "🇩🇪", "Curacao": "🇨🇼", "Netherlands": "🇳🇱", "Japan": "🇯🇵",
  "Ivory Coast": "🇨🇮", "Ecuador": "🇪🇨", "Ukraine": "🇺🇦", "Tunisia": "🇹🇳",
  "Spain": "🇪🇸", "Cape Verde": "🇨🇻", "Belgium": "🇧🇪", "Egypt": "🇪🇬",
  "Saudi Arabia": "🇸🇦", "Uruguay": "🇺🇾", "Iran": "🇮🇷", "New Zealand": "🇳🇿",
  "France": "🇫🇷", "Senegal": "🇸🇳", "Iraq": "🇮🇶", "Norway": "🇳🇴",
  "Argentina": "🇦🇷", "Algeria": "🇩🇿", "Austria": "🇦🇹", "Jordan": "🇯🇴",
  "Portugal": "🇵🇹", "DRC": "🇨🇩", "Uzbekistan": "🇺🇿", "Colombia": "🇨🇴",
  "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Croatia": "🇭🇷", "Ghana": "🇬🇭", "Panama": "🇵🇦",
  "Denmark": "🇩🇰", "Sweden": "🇸🇪",
  "United States": "🇺🇸", "Bosnia-Herzegovina": "🇧🇦",
  "Congo DR": "🇨🇩", "DR Congo": "🇨🇩",
  "Cote d'Ivoire": "🇨🇮", "Côte d'Ivoire": "🇨🇮",
  "Türkiye": "🇹🇷", "Cabo Verde": "🇨🇻", "Korea Republic": "🇰🇷",
  "Curaçao": "🇨🇼", "Czech Republic": "🇨🇿",
};

export const getFlag = (team) => {
  if (!team) return "⚪";
  if (team.startsWith("TBD")) return "❓";
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

// Local scoring helper (matches backend)
// +4 exact score; +1 correct outcome; +2 bonus if penalty score predicted exactly (max +6)
export function calcPoints(predH, predA, actH, actA,
                           predPenH = null, predPenA = null,
                           actPenH = null, actPenA = null) {
  if (actH == null || actA == null || predH == null || predA == null) return null;

  // Penalties only happen when 90-min score is a draw — ignore stored pen data otherwise
  const isActualDraw = actH === actA;
  const aPenH = isActualDraw ? actPenH : null;
  const aPenA = isActualDraw ? actPenA : null;

  // +2 bonus only if predicted penalty score exactly matches actual penalty score
  const penBonus = (
    aPenH != null && aPenA != null &&
    predPenH != null && predPenA != null &&
    Number(predPenH) === Number(aPenH) && Number(predPenA) === Number(aPenA)
  ) ? 2 : 0;

  // Who actually advances
  let actualWinner = null;
  if (aPenH != null && aPenA != null) {
    actualWinner = aPenH > aPenA ? "home" : "away";
  } else {
    actualWinner = actH > actA ? "home" : actA > actH ? "away" : null;
  }

  if (predH === actH && predA === actA) return 4 + penBonus;

  // predWinner is derived only from the main score prediction, NOT penalty scores.
  // Penalty prediction is a separate bonus — it must not override the draw outcome check.
  const predWinner = predH > predA ? "home" : predA > predH ? "away" : null;

  // Correct outcome:
  // - Predicted draw (predWinner=null): correct if 90-min score was also a draw
  // - Predicted a winner: correct if that team advanced (regular time or penalties)
  const correctOutcome = predWinner === null ? actH === actA : predWinner === actualWinner;
  if (correctOutcome) return 1 + penBonus;

  return penBonus;
}
