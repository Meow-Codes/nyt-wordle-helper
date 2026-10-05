import words from "../words.json";
import { getOptions } from "../solver";

function render(options: string[], mode: string) {
  const root = document.getElementById("container")!;
  root.innerHTML = "";

  const title = document.createElement("div");
  title.className = "count";
  if (options.length === 1) {
    title.textContent = mode === "wordle-in-one" ? "Answer:" : "Solved down to:";
  } else {
    title.textContent = `${options.length} possible`;
  }
  root.appendChild(title);

  if (options.length === 0) {
    const none = document.createElement("div");
    none.className = "none";
    none.textContent = "No matches. The word list may be missing this word.";
    root.appendChild(none);
    return;
  }

  if (options.length === 1) {
    const big = document.createElement("div");
    big.className = "answer";
    big.textContent = options[0].toUpperCase();
    root.appendChild(big);
    return;
  }

  const ol = document.createElement("ol");
  options.slice(0, 50).forEach((w) => {
    const li = document.createElement("li");
    li.textContent = w;
    ol.appendChild(li);
  });
  root.appendChild(ol);
}

chrome.storage.local.get("wordleState", (result) => {
  const ws = result.wordleState as WorldleState | undefined;
  if (!ws || ws.rowIndex === 0) {
    render(words as string[], ws?.mode ?? "wordle");
  } else {
    render(getOptions(ws), ws.mode ?? "wordle");
  }
});