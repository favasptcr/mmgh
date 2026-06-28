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
  // ESPN display names differ from seed names — add both so flags work after sync
  "United States": "🇺🇸", "Bosnia-Herzegovina": "🇧🇦",
  "Congo DR": "🇨🇩", "Cote d'Ivoire": "🇨🇮", "Türkiye": "🇹🇷",
  "Cabo Verde": "🇨🇻", "Korea Republic": "🇰🇷",
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
export function calcPoints(predH, predA, actH, actA) {
  if (actH == null || actA == null || predH == null || predA == null) return null;
  if (predH === actH && predA === actA) return 4;
  const aw = actH > actA ? "h" : actA > actH ? "a" : "d";
  const pw = predH > predA ? "h" : predA > predH ? "a" : "d";
  if (aw === pw) return 1;
  return 0;
}
