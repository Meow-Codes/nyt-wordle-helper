import words from "./words.json";

type Term = "correct" | "present" | "absent";

// Standard Wordle scoring, including duplicate-letter handling.
function score(guess: string, answer: string): Term[] {
  const res: Term[] = ["absent", "absent", "absent", "absent", "absent"];
  const left: Record<string, number> = {};

  for (let i = 0; i < 5; i++) {
    if (guess[i] === answer[i]) {
      res[i] = "correct";
    } else {
      left[answer[i]] = (left[answer[i]] ?? 0) + 1;
    }
  }

  for (let i = 0; i < 5; i++) {
    if (res[i] === "correct") continue;
    const c = guess[i];
    if ((left[c] ?? 0) > 0) {
      res[i] = "present";
      left[c]--;
    }
  }

  return res;
}

// Keep only words that would produce exactly the colors shown on every evaluated row.
// Works for Wordle (many rows) and Wordle in One (one clue row).
export function getOptions(ws: WorldleState): string[] {
  const rows: { guess: string; terms: Term[] }[] = [];

  ws.evaluations.forEach((terms, i) => {
    const guess = ws.boardState[i];
    if (terms && guess && guess.length === 5) rows.push({ guess, terms });
  });

  return (words as string[]).filter((w) =>
    rows.every(({ guess, terms }) => {
      const s = score(guess, w);
      return s.every((t, i) => t === terms[i]);
    })
  );
}