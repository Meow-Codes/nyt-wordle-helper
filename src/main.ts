type Term = "correct" | "present" | "absent";

function readBoard(): WorldleState | null {
  const tiles = Array.from(
    document.querySelectorAll<HTMLElement>('[data-testid="tile"]')
  );
  if (tiles.length < 30) return null;

  const boardState: string[] = [];
  const evaluations: (Term[] | null)[] = [];
  let rowIndex = 0;

  for (let r = 0; r < 6; r++) {
    const row = tiles.slice(r * 5, r * 5 + 5);
    const terms: Term[] = [];
    let letters = "";
    let done = true;

    for (const t of row) {
      const s = t.dataset.state;
      if (s === "correct" || s === "present" || s === "absent") {
        terms.push(s);
        letters += (t.textContent ?? "").trim().toLowerCase();
      } else {
        done = false;
        break;
      }
    }

    if (done && letters.length === 5) {
      boardState.push(letters);
      evaluations.push(terms);
      rowIndex++;
    } else {
      boardState.push("");
      evaluations.push(null);
    }
  }

  return {
    boardState,
    evaluations,
    gameStatus: "IN_PROGRESS",
    hardMode: false,
    lastCompletedTs: null,
    lastPlayedTs: null,
    restoringFromLocalStorage: null,
    rowIndex,
    solution: "",
  };
}

let last = "";

function update() {
  const state = readBoard();
  if (!state) return;
  const serialized = JSON.stringify(state);
  if (serialized === last) return;
  last = serialized;
  chrome.storage.local.set({ wordleState: state });
}

setInterval(update, 500);
update();