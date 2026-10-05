interface WorldleState {
  boardState: string[];
  evaluations: (("correct" | "present" | "absent")[] | null)[];
  gameStatus: string;
  hardMode: boolean;
  lastCompletedTs: number | null;
  lastPlayedTs: number | null;
  restoringFromLocalStorage: null;
  rowIndex: number;
  solution: string;
  tick?: number;
  mode?: "wordle" | "wordle-in-one";
}