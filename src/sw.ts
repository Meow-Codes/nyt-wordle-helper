import words from "./words.json";

function getSummary(ws: WorldleState) {
  // char means correct, set means excluded from that position
  const soln = Array.from(
    { length: 5 },
    () => new Set<string>()
  ) as (string | Set<string>)[];

  const includes = new Set<string>();
  const excludes = new Set<string>();

  ws.evaluations.forEach((e, ei) => {
    if (!e) return;

    e.forEach((term, ti) => {
      const char = ws.boardState[ei][ti];

      switch (term) {
        case "correct":
          soln[ti] = char;
          break;

        case "present":
          includes.add(char);

          if (typeof soln[ti] !== "string") {
            soln[ti].add(char);
          }
          break;

        case "absent":
          excludes.add(char);
          break;
      }
    });
  });

  return {
    soln,
    includes,
    excludes,
  };
}

function getPattern(soln: (string | Set<string>)[]) {
  let res = "";

  soln.forEach((s) => {
    if (typeof s === "string") {
      res += s;
      return;
    }

    if (s.size === 0) {
      res += ".";
      return;
    }

    res += `[^${[...s].join("")}]`;
  });

  return res;
}

function getOptions(ws: WorldleState): string[] {
  const { soln, includes, excludes } = getSummary(ws);
  const pattern = getPattern(soln);
  const re = new RegExp(pattern);

  return words.filter((w) => {
    for (const char of includes) {
      if (!w.includes(char)) {
        return false;
      }
    }

    for (const char of excludes) {
      if (w.includes(char)) {
        return false;
      }
    }

    return re.test(w);
  });
}

function updateOptions(ws: WorldleState | undefined) {
  if (!ws || ws.rowIndex === 0) {
    chrome.storage.local.set({ options: words });
    return;
  }

  const options = getOptions(ws);

  chrome.storage.local.set({ options });
}

chrome.storage.onChanged.addListener((changes) => {
  const wordleState = changes.wordleState?.newValue as
    | WorldleState
    | undefined;

  if (!wordleState) {
    return;
  }

  updateOptions(wordleState);
});

chrome.storage.local.get("wordleState", (result) => {
  const wordleState = result.wordleState as WorldleState | undefined;

  updateOptions(wordleState);
});
