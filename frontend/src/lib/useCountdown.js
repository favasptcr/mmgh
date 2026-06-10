import { useEffect, useState } from "react";

// Returns formatted countdown until target ISO datetime; "LIVE" once passed.
export function useCountdown(targetIso) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!targetIso) return { label: "—", live: false, soon: false };
  const target = new Date(targetIso).getTime();
  const diff = target - now;
  if (diff <= 0) return { label: "KICKED OFF", live: true, soon: false };
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const soon = diff < 60 * 60 * 1000; // <1h
  let label;
  if (d > 0) label = `${d}d ${h}h ${m}m`;
  else if (h > 0) label = `${h}h ${m}m ${s}s`;
  else label = `${m}m ${s}s`;
  return { label, live: false, soon };
}
