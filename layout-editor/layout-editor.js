(() => {
  "use strict";
  const COLUMNS = 12;
  const ROWS = 11;
  const LETTERS = "ABCDEFGHIJKL";
  const board = document.querySelector("#board");
  const output = document.querySelector("#output");
  const message = document.querySelector("#message");
  const counts = document.querySelector("#counts");
  const history = [];
  let tool = "route";
  let cells = loadState();

  document.querySelector(".column-labels").innerHTML = [...LETTERS].map(x => `<span>${x}</span>`).join("");
  document.querySelector(".row-labels").innerHTML = Array.from({length: ROWS}, (_, i) => `<span>${i + 1}</span>`).join("");

  for (let row = 1; row <= ROWS; row += 1) {
    for (let column = 1; column <= COLUMNS; column += 1) {
      const position = `${LETTERS[column - 1]}${row}`;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "cell";
      button.dataset.position = position;
      button.setAttribute("role", "gridcell");
      button.setAttribute("aria-label", position);
      button.addEventListener("click", () => paint(position));
      board.append(button);
    }
  }

  document.querySelectorAll("[data-tool]").forEach(button => {
    button.addEventListener("click", () => {
      tool = button.dataset.tool;
      document.querySelectorAll("[data-tool]").forEach(peer => peer.setAttribute("aria-pressed", String(peer === button)));
    });
  });

  document.querySelector("#undo").addEventListener("click", () => {
    if (!history.length) return showMessage("目前沒有可復原的步驟");
    cells = history.pop();
    update();
  });

  document.querySelector("#reset").addEventListener("click", () => {
    if (!Object.keys(cells).length || !confirm("確定清除整張配置？")) return;
    remember();
    cells = {};
    update();
  });

  document.querySelector("#copy").addEventListener("click", async () => {
    const text = output.value;
    try {
      await navigator.clipboard.writeText(text);
      showMessage("已複製，回到 Codex 直接貼上即可");
    } catch (_) {
      output.parentElement.open = true;
      output.focus();
      output.select();
      showMessage("請長按已選取的資料並複製");
    }
  });

  function remember() {
    history.push(JSON.parse(JSON.stringify(cells)));
    if (history.length > 60) history.shift();
  }

  function paint(position) {
    remember();
    if (tool === "erase") {
      delete cells[position];
    } else if (tool === "entry" || tool === "goal") {
      Object.keys(cells).forEach(key => { if (cells[key].type === tool) delete cells[key]; });
      cells[position] = {type: tool, order: tool === "entry" ? 1 : null};
    } else if (tool === "route") {
      const current = cells[position];
      if (current?.type === "route") delete cells[position];
      else cells[position] = {type: "route", order: nextRouteOrder()};
    } else {
      cells[position] = {type: "slot"};
    }
    normalizeRoute();
    update();
  }

  function nextRouteOrder() {
    return 1 + Math.max(0, ...Object.values(cells).filter(x => x.type === "route").map(x => x.order || 0));
  }

  function normalizeRoute() {
    Object.entries(cells).filter(([, value]) => value.type === "route").sort((a, b) => a[1].order - b[1].order).forEach(([, value], index) => { value.order = index + 1; });
  }

  function coordinates(position) {
    return {column: LETTERS.indexOf(position[0]) + 1, row: Number(position.slice(1))};
  }

  function exportData() {
    const routeCells = Object.entries(cells).filter(([, value]) => ["entry", "route", "goal"].includes(value.type));
    const entry = routeCells.find(([, value]) => value.type === "entry");
    const roads = routeCells.filter(([, value]) => value.type === "route").sort((a, b) => a[1].order - b[1].order);
    const goal = routeCells.find(([, value]) => value.type === "goal");
    const ordered = [...(entry ? [entry] : []), ...roads, ...(goal ? [goal] : [])];
    const route = ordered.map(([position, value], index) => ({order: index + 1, position, ...coordinates(position), type: value.type === "route" ? "road" : value.type}));
    const slots = Object.entries(cells).filter(([, value]) => value.type === "slot").sort((a, b) => {
      const aa = coordinates(a[0]); const bb = coordinates(b[0]);
      return aa.row - bb.row || aa.column - bb.column;
    }).map(([position]) => ({position, ...coordinates(position), text: "格"}));
    return {grid: {columns: COLUMNS, rows: ROWS}, route, slots};
  }

  function update() {
    document.querySelectorAll(".cell").forEach(button => {
      const value = cells[button.dataset.position];
      button.className = `cell${value ? ` ${value.type}` : ""}`;
      button.textContent = !value ? "" : value.type === "route" ? value.order : value.type === "slot" ? "格" : value.type === "entry" ? "入" : "終";
      button.setAttribute("aria-label", `${button.dataset.position}${value ? ` ${button.textContent}` : " 空白"}`);
    });
    const routeCount = Object.values(cells).filter(x => ["entry", "route", "goal"].includes(x.type)).length;
    const slotCount = Object.values(cells).filter(x => x.type === "slot").length;
    counts.textContent = `道路 ${routeCount}｜文字格 ${slotCount}`;
    output.value = JSON.stringify(exportData(), null, 2);
    localStorage.setItem("zizhen-layout-12x11", JSON.stringify(cells));
  }

  function loadState() {
    try { return JSON.parse(localStorage.getItem("zizhen-layout-12x11")) || {}; }
    catch (_) { return {}; }
  }

  function showMessage(text) {
    message.textContent = text;
    clearTimeout(showMessage.timer);
    showMessage.timer = setTimeout(() => { message.textContent = ""; }, 3500);
  }

  update();
})();
