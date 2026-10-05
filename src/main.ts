// main.ts
//
// Modern NYT Wordle state adapter.
//
// The original WordleWiz expected Wordle to expose its state through:
//     localStorage["nyt-wordle-state"]
//
// Current NYT Wordle instead stores the board in:
//     localStorage["games-state-wordleV2/ANON"]
//
// The current localStorage state contains the guessed words, while the
// evaluation (correct/present/absent) is exposed by the DOM through:
//     [data-testid="tile"]
//
// This file combines both sources and produces the old WorldleState shape
// expected by sw.ts.

interface CurrentWordleState {
  states: {
    puzzleId: string;
    data: {
      boardState: string[];
      currentRowIndex: number;
      status: string;
      hardMode: boolean;
      isPlayingArchive: boolean;
    };
    schemaVersion: string;
    timestamp: number;
    printDate: string;
  }[];
}

const STORAGE_KEY = "games-state-wordleV2/ANON";

function getCurrentWordleState(): CurrentWordleState | null {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as CurrentWordleState;
  } catch (error) {
    console.error("WordleWiz: failed to parse Wordle localStorage:", error);
    return null;
  }
}

function getEvaluations(): (
  ("correct" | "present" | "absent")[] | null
)[] {
  const tiles = Array.from(
    document.querySelectorAll<HTMLElement>('[data-testid="tile"]')
  );

  const evaluations: (
    ("correct" | "present" | "absent")[] | null
  )[] = [];

  // Wordle has 6 rows × 5 tiles = 30 tiles.
  // Group the tiles into five-tile rows.
  for (let row = 0; row < 6; row++) {
    const rowTiles = tiles.slice(row * 5, row * 5 + 5);

    if (rowTiles.length !== 5) {
      evaluations.push(null);
      continue;
    }

    const rowEvaluation: (
      "correct" | "present" | "absent"
    )[] = [];

    let isEvaluated = true;

    for (const tile of rowTiles) {
      const state = tile.dataset.state;

      if (
        state === "correct" ||
        state === "present" ||
        state === "absent"
      ) {
        rowEvaluation.push(state);
      } else {
        isEvaluated = false;
        break;
      }
    }

    evaluations.push(isEvaluated ? rowEvaluation : null);
  }

  return evaluations;
}

function readWordleState(): WorldleState | null {
  const current = getCurrentWordleState();

  if (!current || current.states.length === 0) {
    return null;
  }

  const state = current.states[current.states.length - 1];
  const data = state.data;

  return {
    boardState: data.boardState,
    evaluations: getEvaluations(),
    gameStatus: data.status,
    hardMode: data.hardMode,
    lastCompletedTs: null,
    lastPlayedTs: state.timestamp,
    restoringFromLocalStorage: null,
    rowIndex: data.currentRowIndex,
    solution: "",
    tick: Date.now(),
  };
}

let lastSerializedState = "";

function updateState() {
  const wordleState = readWordleState();

  if (!wordleState) {
    return;
  }

  const serialized = JSON.stringify(wordleState);

  // Avoid constantly writing identical state to chrome.storage.
  if (serialized === lastSerializedState) {
    return;
  }

  lastSerializedState = serialized;

  chrome.storage.local.set({ wordleState }, () => {
    if (chrome.runtime.lastError) {
      console.error(
        "WordleWiz: failed to update chrome.storage:",
        chrome.runtime.lastError
      );
    }
  });
}

// Wordle changes the DOM when a guess is submitted, so polling is sufficient
// and keeps the implementation simple.
setInterval(updateState, 500);

// Also perform an initial read immediately.
updateState();
