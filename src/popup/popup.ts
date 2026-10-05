import words from "../words.json";
import { getOptions } from "../solver";

function render(options: string[]) {
  const root = document.getElementById("container")!;
  root.innerHTML = "";

  const count = document.createElement("div");
  count.className = "count";
  count.textContent = `${options.length} possible`;
  root.appendChild(count);

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
    render(words as string[]);
  } else {
    render(getOptions(ws));
  }
});