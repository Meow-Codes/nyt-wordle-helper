import words from "./words.json";

type Term = "correct" | "present" | "absent";

export function getOptions(ws: WorldleState): string[] {
  const green: (string | null)[] = [null, null, null, null, null];
  const notAt: Set<string>[] = Array.from({ length: 5 }, () => new Set<string>());
  const minCount: Record<string, number> = {};
  const maxCount: Record<string, number> = {};

  ws.evaluations.forEach((ev, row) => {
    if (!ev) return;
    const word = ws.boardState[row];
    const seen: Record<string, number> = {}; // correct + present per letter in this row
    const hasAbsent = new Set<string>();

    ev.forEach((term: Term, i) => {
      const ch = word[i];
      if (term === "correct") {
        green[i] = ch;
        seen[ch] = (seen[ch] ?? 0) + 1;
      } else if (term === "present") {
        notAt[i].add(ch);
        seen[ch] = (seen[ch] ?? 0) + 1;
      } else {
        notAt[i].add(ch);
        hasAbsent.add(ch);
      }
    });

    for (const [ch, n] of Object.entries(seen)) {
      minCount[ch] = Math.max(minCount[ch] ?? 0, n);
    }
    // gray tile means "no more copies than the green/yellow ones in this row"
    for (const ch of hasAbsent) {
      maxCount[ch] = Math.min(maxCount[ch] ?? 5, seen[ch] ?? 0);
    }
  });

  return (words as string[]).filter((w) => {
    for (let i = 0; i < 5; i++) {
      if (green[i] && w[i] !== green[i]) return false;
      if (notAt[i].has(w[i])) return false;
    }
    const counts: Record<string, number> = {};
    for (const ch of w) counts[ch] = (counts[ch] ?? 0) + 1;
    for (const [ch, n] of Object.entries(minCount)) {
      if ((counts[ch] ?? 0) < n) return false;
    }
    for (const [ch, n] of Object.entries(maxCount)) {
      if ((counts[ch] ?? 0) > n) return false;
    }
    return true;
  });
}