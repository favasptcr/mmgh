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
// +4 exact score (winner + goals); +1 correct outcome only; 0 wrong
export function calcPoints(predH, predA, actH, actA, predPen = null, actPen = null) {
  if (actH == null || actA == null || predH == null || predA == null) return null;

  // +2 bonus if match went to pens and pen winner prediction is correct
  const penBonus = (actPen && predPen === actPen) ? 2 : 0;

  // Who actually advances (actPen overrides draw in knockout)
  const actualWinner = actPen
    ? actPen
    : actH > actA ? "home" : actA > actH ? "away" : null;

  if (predH === actH && predA === actA) return 4 + penBonus;

  const predWinner = predH > predA ? "home" : predA > predH ? "away" : (predPen || null);
  if (actualWinner && predWinner === actualWinner) return 1 + penBonus;

  return penBonus;
}
