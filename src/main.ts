type Term = "correct" | "present" | "absent";
type Mode = "wordle" | "wordle-in-one";

interface Cell {
  letter: string;
  state: Term | null; // null = not evaluated (empty / being typed)
}

function isTerm(s: string | undefined): s is Term {
  return s === "correct" || s === "present" || s === "absent";
}

function cleanLetter(text: string | null): string {
  const l = (text ?? "").trim().toLowerCase();
  return /^[a-z]$/.test(l) ? l : "";
}

// ---------------------------------------------------------------------------
// Site detection
// ---------------------------------------------------------------------------

function getMode(): Mode | null {
  const { hostname, pathname } = location;

  if (hostname === "wordleinone.org" || hostname.endsWith(".wordleinone.org")) {
    return "wordle-in-one";
  }

  if (hostname === "nytimes.com" || hostname.endsWith(".nytimes.com")) {
    if (pathname.includes("/games/bonus/wordle-in-one")) return "wordle-in-one";
    if (pathname.startsWith("/games/wordle")) return "wordle";
  }

  return null;
}

// ---------------------------------------------------------------------------
// Readers: each returns rows of cells
// ---------------------------------------------------------------------------

// nytimes.com: flat list of tiles, five per row, state in data-state.
function readNyt(): Cell[][] {
  const tiles = Array.from(
    document.querySelectorAll<HTMLElement>('[data-testid="tile"]')
  );

  const rows: Cell[][] = [];
  for (let r = 0; r + 5 <= tiles.length; r += 5) {
    rows.push(
      tiles.slice(r, r + 5).map((t) => ({
        letter: cleanLetter(t.textContent),
        state: isTerm(t.dataset.state) ? t.dataset.state : null,
      }))
    );
  }
  return rows;
}

// wordleinone.org: clue rows are .tile-row (not .answer-row) inside .puzzle,
// and each tile's state is a CSS class: correct / present / absent.
function readWordleInOneOrg(): Cell[][] {
  const rowEls = Array.from(
    document.querySelectorAll<HTMLElement>(".puzzle .tile-row:not(.answer-row)")
  );

  return rowEls.map((rowEl) =>
    Array.from(rowEl.querySelectorAll<HTMLElement>(".tile")).map((t) => {
      let state: Term | null = null;
      if (t.classList.contains("correct")) state = "correct";
      else if (t.classList.contains("present")) state = "present";
      else if (t.classList.contains("absent")) state = "absent";
      return { letter: cleanLetter(t.textContent), state };
    })
  );
}

// ---------------------------------------------------------------------------
// Shared: turn rows of cells into the WorldleState shape
// ---------------------------------------------------------------------------

function readBoard(): WorldleState | null {
  const mode = getMode();
  if (!mode) return null;

  const isOrg = location.hostname.endsWith("wordleinone.org");
  const cellRows = isOrg ? readWordleInOneOrg() : readNyt();
  if (cellRows.length === 0) return null;

  const boardState: string[] = [];
  const evaluations: (Term[] | null)[] = [];
  let rowIndex = 0;

  for (const row of cellRows) {
    const evaluated =
      row.length === 5 && row.every((c) => c.state !== null && c.letter !== "");

    if (evaluated) {
      boardState.push(row.map((c) => c.letter).join(""));
      evaluations.push(row.map((c) => c.state as Term));
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
    mode,
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

// Polling also covers "Next puzzle" and in-app navigation, since the DOM is re-read each tick.
setInterval(update, 500);
update();