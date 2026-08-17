(() => {
  "use strict";

  const BOARD_SIZE = 24;
  const BOARD_COLUMNS = 6;
  const BOARD_ROWS = 6;
  const POCKET_SIZE = 5;
  const REFRESH_COST = 10;
  const MAX_LEVEL = 5;
  const MAX_WAVE = 10;
  const INITIAL_UNLOCKED = new Set([6, 7, 11, 12, 16, 17]);
  const UNIT_TYPES = [
    { kind: "unit", glyph: "刀", weapon: "刀", name: "刀兵", damage: 8, attackSpeed: 1.2, rangeRadius: 27, rangeLabel: "近", effect: "單體", role: "近距快攻" },
    { kind: "unit", glyph: "槍", weapon: "槍", name: "槍兵", damage: 12, attackSpeed: 0.8, rangeRadius: 39, rangeLabel: "中", effect: "穿透", role: "中距穿透" },
    { kind: "unit", glyph: "弓", weapon: "弓", name: "弓兵", damage: 6, attackSpeed: 1.6, rangeRadius: 56, rangeLabel: "遠", effect: "單體", role: "遠距連射" },
    { kind: "unit", glyph: "騎", weapon: "騎", name: "騎兵", damage: 18, attackSpeed: 0.55, rangeRadius: 29, rangeLabel: "近", effect: "範圍", role: "近距範圍" }
  ];
  const GENERAL_TYPES = [
    { id: "zhaoyun", name: "趙雲", parts: ["趙", "雲"], weapons: ["槍"], damageMultiplier: 1.25,
      passive: "槍兵攻擊力 +25%", skill: "龍膽突陣", cooldown: 12, skillNote: "重創最接近軍旗的 3 名敵軍" },
    { id: "guanyu", name: "關羽", parts: ["關", "羽"], weapons: ["刀", "騎"], damageMultiplier: 1.2,
      passive: "刀兵、騎兵攻擊力 +20%", skill: "青龍偃月", cooldown: 14, skillNote: "劈斬戰場上所有敵軍" },
    { id: "huangzhong", name: "黃忠", parts: ["黃", "忠"], weapons: ["弓"], speedMultiplier: 1.25,
      passive: "弓兵攻擊速度 +25%", skill: "百步穿楊", cooldown: 11, skillNote: "箭雨攻擊戰場上所有敵軍" }
  ];
  const GENERAL_PARTS = [
    { kind: "unit", glyph: "趙", weapon: "槍", generalId: "zhaoyun", name: "武將字・趙", damage: 10, attackSpeed: 0.9, rangeRadius: 41, rangeLabel: "中", effect: "穿透", role: "與「雲」相鄰可成將", attackKind: "spear" },
    { kind: "unit", glyph: "雲", weapon: "槍", generalId: "zhaoyun", name: "武將字・雲", damage: 8, attackSpeed: 1.05, rangeRadius: 38, rangeLabel: "中", effect: "單體", role: "與「趙」相鄰可成將", attackKind: "spear" },
    { kind: "unit", glyph: "關", weapon: "刀", generalId: "guanyu", name: "武將字・關", damage: 13, attackSpeed: 0.72, rangeRadius: 30, rangeLabel: "近", effect: "單體", role: "與「羽」相鄰可成將", attackKind: "blade" },
    { kind: "unit", glyph: "羽", weapon: "騎", generalId: "guanyu", name: "武將字・羽", damage: 11, attackSpeed: 0.88, rangeRadius: 34, rangeLabel: "近", effect: "範圍", role: "與「關」相鄰可成將", attackKind: "cavalry" },
    { kind: "unit", glyph: "黃", weapon: "弓", generalId: "huangzhong", name: "武將字・黃", damage: 7, attackSpeed: 1.35, rangeRadius: 52, rangeLabel: "遠", effect: "單體", role: "與「忠」相鄰可成將", attackKind: "bow" },
    { kind: "unit", glyph: "忠", weapon: "弓", generalId: "huangzhong", name: "武將字・忠", damage: 9, attackSpeed: 1.15, rangeRadius: 48, rangeLabel: "遠", effect: "單體", role: "與「黃」相鄰可成將", attackKind: "bow" }
  ];
  const SHOVEL = { kind: "shovel", glyph: "鏟", name: "鏟子" };
  const SLOT_LAYOUT = [
    [3, 1], [4, 1],
    [2, 2], [3, 2], [4, 2],
    [2, 3], [3, 3], [4, 3], [5, 3],
    [1, 4], [2, 4], [3, 4], [4, 4], [5, 4],
    [1, 5], [2, 5], [3, 5], [4, 5], [5, 5],
    [2, 6], [3, 6], [4, 6], [5, 6], [6, 6]
  ];

  const ROUTE_POINTS = [
    { x: 24, y: 88 }, { x: 23, y: 73 }, { x: 12, y: 73 },
    { x: 12, y: 50 }, { x: 23, y: 50 }, { x: 23, y: 27 },
    { x: 34, y: 27 }, { x: 34, y: 12 }, { x: 66, y: 12 },
    { x: 66, y: 38 }, { x: 77, y: 38 }, { x: 77, y: 73 },
    { x: 88, y: 73 }, { x: 88, y: 88 }
  ];
  const ROUTE_SEGMENTS = ROUTE_POINTS.slice(0, -1).map((point, index) => ({
    from: point,
    to: ROUTE_POINTS[index + 1],
    length: Math.hypot(ROUTE_POINTS[index + 1].x - point.x, ROUTE_POINTS[index + 1].y - point.y)
  }));
  const ROUTE_LENGTH = ROUTE_SEGMENTS.reduce((sum, segment) => sum + segment.length, 0);

  const dom = {
    food: document.querySelector("#food"), wave: document.querySelector("#wave"),
    base: document.querySelector("#base"), enemyCount: document.querySelector("#enemy-count"),
    attack: document.querySelector("#attack"), enemies: document.querySelector("#enemies"),
    emptyLane: document.querySelector("#empty-lane"), battlefield: document.querySelector(".battlefield"),
    board: document.querySelector("#board"), generalFrames: document.querySelector("#general-frames"),
    attackFx: document.querySelector("#attack-fx"),
    pocket: document.querySelector("#pocket"), rangeIndicator: document.querySelector("#range-indicator"),
    refresh: document.querySelector("#refresh"), status: document.querySelector("#status"),
    generals: document.querySelector("#generals"),
    overlay: document.querySelector("#overlay"), dialogTitle: document.querySelector("#dialog-title"),
    dialogList: document.querySelector("#dialog-list"), dialogDetail: document.querySelector("#dialog-detail"),
    start: document.querySelector("#start"), unitModal: document.querySelector("#unit-modal"),
    unitClose: document.querySelector("#unit-close"), unitCardContent: document.querySelector("#unit-card-content")
  };

  let state;
  let lastFrame = 0;
  let rafId = 0;
  let pointerDrag = null;
  let dragGhost = null;
  let currentDropTarget = null;
  let selectedPocketIndex = null;
  const attackingSlots = new Set();
  const attackingGeneralKeys = new Set();

  function freshState() {
    const unlocked = Array(BOARD_SIZE).fill(false);
    INITIAL_UNLOCKED.forEach(index => { unlocked[index] = true; });
    return {
      units: Array(BOARD_SIZE).fill(null), unlocked, pocket: Array(POCKET_SIZE).fill(null), enemies: [],
      food: 30, baseHealth: 3, wave: 1, wavePending: enemyCountForWave(1), defeated: 0,
      refreshCount: 0, passiveClock: 0, spawnClock: 0, intermission: 0,
      generalCooldowns: {}, activeGeneralKeys: new Set(),
      running: false, over: false, won: false
    };
  }

  function buildBoard() {
    dom.board.replaceChildren();
    for (let i = 0; i < BOARD_SIZE; i += 1) {
      const button = document.createElement("button");
      const [column, row] = SLOT_LAYOUT[i];
      button.type = "button";
      button.className = "slot locked";
      button.dataset.index = String(i);
      button.style.gridColumn = String(column);
      button.style.gridRow = String(row);
      button.setAttribute("role", "gridcell");
      button.addEventListener("pointerdown", event => pointerDown(event, "board", i));
      button.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") inspectBoardSlot(i);
      });
      dom.board.append(button);
    }
  }

  function buildPocket() {
    dom.pocket.replaceChildren();
    for (let i = 0; i < POCKET_SIZE; i += 1) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "pocket-item used";
      button.dataset.index = String(i);
      button.addEventListener("pointerdown", event => pointerDown(event, "pocket", i));
      button.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") inspectPocketItem(i);
      });
      dom.pocket.append(button);
    }
  }

  function startGame() {
    state = freshState();
    selectedPocketIndex = null;
    state.running = true;
    state.spawnClock = 0.8;
    lastFrame = performance.now();
    closeUnitModal();
    dom.overlay.classList.add("hidden");
    showStatus("先刷新口袋，再把文字拖到 6 個已開放的戰鬥格。");
    renderPocket();
    render();
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(tick);
  }

  function tick(now) {
    if (!state.running) return;
    const delta = Math.min((now - lastFrame) / 1000, 0.1);
    lastFrame = now;
    state.passiveClock += delta;
    state.spawnClock += delta;
    Object.keys(state.generalCooldowns).forEach(key => {
      state.generalCooldowns[key] = Math.max(0, state.generalCooldowns[key] - delta);
    });
    if (state.passiveClock >= 1.5) {
      state.passiveClock -= 1.5;
      state.food += 1;
    }
    updateEnemies(delta);
    updateSpawning(delta);
    updateUnitAttacks(delta);
    render();
    if (state.running) rafId = requestAnimationFrame(tick);
  }

  function refreshPocket() {
    if (!state.running || state.over) return;
    if (state.food < REFRESH_COST) {
      showStatus("饅頭不足；時間經過或擊敗敵軍都會獲得饅頭。");
      return;
    }
    state.food -= REFRESH_COST;
    selectedPocketIndex = null;
    state.refreshCount += 1;
    state.pocket = Array.from({ length: POCKET_SIZE }, () => {
      const pool = Math.random() < 0.42 ? GENERAL_PARTS : UNIT_TYPES;
      const template = pool[Math.floor(Math.random() * pool.length)];
      return { ...template, level: 1, cooldown: 0 };
    });
    if (state.refreshCount === 1) {
      state.pocket[0] = { ...GENERAL_PARTS[0], level: 1, cooldown: 0 };
      state.pocket[1] = { ...GENERAL_PARTS[1], level: 1, cooldown: 0 };
      state.pocket[2] = { ...GENERAL_PARTS[0], level: 1, cooldown: 0 };
      state.pocket[3] = { ...GENERAL_PARTS[1], level: 1, cooldown: 0 };
    }
    const includeShovel = state.refreshCount % 3 === 0 || (state.refreshCount > 1 && Math.random() < 0.28);
    if (includeShovel) state.pocket[Math.floor(Math.random() * POCKET_SIZE)] = { ...SHOVEL };
    renderPocket();
    render();
    showStatus(includeShovel
      ? "刷新完成！出現鏟子，把它拖到鎖定格即可開地。"
      : state.refreshCount === 1
        ? "首次刷新出現兩組「趙、雲」；先完成兩組同星趙雲，再把一組拖到另一組進行武將合體。"
        : "刷新完成！武將字上下或左右相鄰，就能組成武將。");
  }

  function inspectBoardSlot(index) {
    if (!state.running || state.over) return;
    if (!state.unlocked[index]) {
      showStatus("這格尚未開放，需要把口袋裡的鏟子拖到這裡。");
      return;
    }
    const unit = state.units[index];
    if (!unit) {
      showStatus("這是已開放的空格，請從口袋拖一個文字進來。");
      return;
    }
    openUnitModal(unit, index);
  }

  function inspectPocketItem(index) {
    const item = state.pocket[index];
    if (!item) {
      showStatus("這個口袋位置已經使用，刷新後會補上新內容。");
      return;
    }
    if (item.kind === "shovel") {
      showStatus("按住鏟子，拖到任一鎖定格即可永久開放該格。");
      return;
    }
    openUnitModal(item, null);
  }

  function moveOrCombine(from, to) {
    if (from === to) return;
    if (!state.unlocked[to]) {
      showStatus("文字不能放進鎖定格；需要先使用鏟子開地。");
      return;
    }
    const source = state.units[from];
    const target = state.units[to];
    if (!source) return;
    const targetFormation = target
      ? activeGeneralFormations().find(formation => formation.indexes.includes(to))
      : null;
    if (!target) {
      state.units[to] = source;
      state.units[from] = null;
      showStatus(`已把「${source.glyph}」移到新位置。`);
    } else if (targetFormation) {
      showStatus(`${targetFormation.name}已經是完整武將；必須用另一組同名、同星武將才能升級。`);
      return;
    } else if (canCombine(source, target)) {
      const level = upgradeSingleUnit(to);
      state.units[from] = null;
      state.food += 2;
      showStatus(`合成成功：「${target.glyph}」升為 ${level} 星！`);
    } else if (source.glyph === target.glyph && source.level === target.level) {
      showStatus("這兩個文字都已經是最高 5 星。");
    } else {
      state.units[to] = source;
      state.units[from] = target;
      showStatus(`已交換「${source.glyph}」與「${target.glyph}」。`);
    }
    render();
  }

  function deployPocketItem(pocketIndex, targetIndex) {
    const item = state.pocket[pocketIndex];
    if (!item || targetIndex === null) {
      showStatus("沒有放到戰鬥格，口袋內容回到原位。");
      return;
    }
    if (item.kind === "shovel") {
      if (state.unlocked[targetIndex]) {
        showStatus("這格已經開放，請把鏟子拖到有鎖的格子。");
        return;
      }
      state.unlocked[targetIndex] = true;
      state.pocket[pocketIndex] = null;
      renderPocket();
      render();
      showStatus(`開地成功！目前已開放 ${state.unlocked.filter(Boolean).length} / ${BOARD_SIZE} 格。`);
      return;
    }
    if (!state.unlocked[targetIndex]) {
      showStatus("文字不能放進鎖定格；請先使用鏟子開地。");
      return;
    }
    const target = state.units[targetIndex];
    const targetFormation = target
      ? activeGeneralFormations().find(formation => formation.indexes.includes(targetIndex))
      : null;
    if (!target) {
      state.units[targetIndex] = { ...item, cooldown: 0 };
      state.pocket[pocketIndex] = null;
      showStatus(`已把「${item.glyph}」部署到戰鬥場地。`);
    } else if (targetFormation) {
      showStatus(`單獨的「${item.glyph}」不能升級${targetFormation.name}；請先完成另一組同名、同星武將。`);
      return;
    } else if (canCombine(item, target)) {
      const level = upgradeSingleUnit(targetIndex);
      state.pocket[pocketIndex] = null;
      showStatus(`合成成功：「${target.glyph}」升為 ${level} 星！`);
    } else if (item.glyph === target.glyph && item.level === target.level) {
      showStatus("這兩個文字都已經是最高 5 星。");
      return;
    } else {
      showStatus("這格已有其他文字；請拖到空格，或拖到相同文字進行合成。");
      return;
    }
    renderPocket();
    render();
  }

  function canCombine(source, target) {
    return source.glyph === target.glyph && source.level === target.level && target.level < MAX_LEVEL;
  }

  function upgradeSingleUnit(targetIndex) {
    const target = state.units[targetIndex];
    const level = target.level + 1;
    state.units[targetIndex] = { ...target, level };
    return level;
  }

  function tryCombineGeneralFormations(from, to) {
    const formations = activeGeneralFormations();
    const sourceGeneral = formations.find(formation => formation.indexes.includes(from));
    const targetGeneral = formations.find(formation => formation.indexes.includes(to));
    if (!sourceGeneral || !targetGeneral || sourceGeneral.key === targetGeneral.key) return false;
    if (sourceGeneral.id !== targetGeneral.id) {
      showStatus("只有同名武將才能合體升級。");
      return true;
    }
    if (sourceGeneral.level !== targetGeneral.level) {
      showStatus(`兩組${targetGeneral.name}必須星級相同才能合體。`);
      return true;
    }
    if (targetGeneral.level >= MAX_LEVEL) {
      showStatus(`${targetGeneral.name}已經是最高 5 星。`);
      return true;
    }
    targetGeneral.indexes.forEach(index => {
      const unit = state.units[index];
      state.units[index] = { ...unit, level: Math.min(MAX_LEVEL, unit.level + 1) };
    });
    sourceGeneral.indexes.forEach(index => { state.units[index] = null; });
    state.food += 4;
    showStatus(`武將合體成功：${targetGeneral.name}升為 ${targetGeneral.level + 1} 星！`);
    render();
    return true;
  }

  function combinePocketItems(from, to) {
    const source = state.pocket[from];
    const target = state.pocket[to];
    if (!source || from === to) return;
    if (source.kind === "shovel") {
      showStatus("鏟子不能合體，請把它拖到戰鬥場地的鎖定格。");
      return;
    }
    if (!target) {
      state.pocket[to] = source;
      state.pocket[from] = null;
      showStatus(`已移動口袋中的「${source.glyph}」。`);
    } else if (target.kind === "unit" && canCombine(source, target)) {
      state.pocket[to] = { ...target, level: target.level + 1 };
      state.pocket[from] = null;
      selectedPocketIndex = null;
      showStatus(`口袋合體成功：「${target.glyph}」升為 ${target.level + 1} 星！`);
    } else if (target.kind === "unit" && source.glyph === target.glyph && source.level === target.level) {
      showStatus("這兩個文字都已經是最高 5 星。");
      return;
    } else {
      showStatus("口袋只能合體相同文字、相同星級的棋子。");
      return;
    }
    renderPocket();
  }

  function returnBoardUnitToPocket(boardIndex, pocketIndex) {
    const source = state.units[boardIndex];
    const target = state.pocket[pocketIndex];
    if (!source) return;
    if (!target) {
      state.pocket[pocketIndex] = source;
      state.units[boardIndex] = null;
      selectedPocketIndex = null;
      showStatus(`已把「${source.glyph}」收回口袋。`);
    } else if (target.kind === "unit" && canCombine(source, target)) {
      state.pocket[pocketIndex] = { ...target, level: target.level + 1 };
      state.units[boardIndex] = null;
      selectedPocketIndex = null;
      showStatus(`收回並合體成功：「${target.glyph}」升為 ${target.level + 1} 星！`);
    } else if (target.kind === "unit" && source.glyph === target.glyph && source.level === target.level) {
      showStatus("這兩個文字都已經是最高 5 星。請改拖到口袋空格。");
      return;
    } else {
      showStatus("這個口袋格已有其他內容，請拖到空格或相同文字、相同星級的棋子。");
      return;
    }
    renderPocket();
    render();
  }

  function tapPocketItem(index) {
    const item = state.pocket[index];
    if (!item) {
      selectedPocketIndex = null;
      renderPocket();
      showStatus("這個口袋位置是空的，刷新後會補上新內容。");
      return;
    }
    if (item.kind === "shovel") {
      selectedPocketIndex = null;
      renderPocket();
      inspectPocketItem(index);
      return;
    }
    if (selectedPocketIndex === null) {
      selectedPocketIndex = index;
      renderPocket();
      showStatus(`已選擇「${item.glyph}」${item.level} 星；再點相同文字、相同星級即可合體。`);
      return;
    }
    if (selectedPocketIndex === index) {
      selectedPocketIndex = null;
      renderPocket();
      inspectPocketItem(index);
      return;
    }
    const selected = state.pocket[selectedPocketIndex];
    if (selected?.kind === "unit" && selected.glyph === item.glyph && selected.level === item.level) {
      combinePocketItems(selectedPocketIndex, index);
      return;
    }
    selectedPocketIndex = index;
    renderPocket();
    showStatus(`這兩顆不能合體，已改選「${item.glyph}」${item.level} 星。請再點相同文字、相同星級。`);
  }

  function pointerDown(event, source, index) {
    if (!state.running || state.over) return;
    if (event.isPrimary === false) return;
    const item = dragItem(source, index);
    pointerDrag = {
      pointerId: event.pointerId, source, index, sourceElement: event.currentTarget,
      startX: event.clientX, startY: event.clientY, dragging: false
    };
    if (item) {
      event.preventDefault();
    }
  }

  function pointerMove(event) {
    if (!pointerDrag || pointerDrag.pointerId !== event.pointerId) return;
    const item = dragItem(pointerDrag.source, pointerDrag.index);
    if (!item) return;
    const travel = Math.hypot(event.clientX - pointerDrag.startX, event.clientY - pointerDrag.startY);
    if (!pointerDrag.dragging && travel > 8) {
      pointerDrag.dragging = true;
      if (pointerDrag.source === "pocket") selectedPocketIndex = null;
      createDragGhost(item);
      pointerDrag.sourceElement.classList.add("drag-source");
      if (pointerDrag.source === "board") showRangeIndicator(item, pointerDrag.index);
      document.body.classList.add("is-dragging");
    }
    if (!pointerDrag.dragging) return;
    event.preventDefault();
    positionDragGhost(event.clientX, event.clientY);
    updateDropTarget(event.clientX, event.clientY);
  }

  function pointerUp(event) {
    if (!pointerDrag || pointerDrag.pointerId !== event.pointerId) return;
    const drag = { ...pointerDrag };
    if (drag.dragging) {
      event.preventDefault();
      const target = dropTargetAtPoint(event.clientX, event.clientY);
      cleanupPointerDrag();
      if (drag.source === "board") {
        if (target?.area === "board" && target.index !== drag.index) {
          if (!tryCombineGeneralFormations(drag.index, target.index)) moveOrCombine(drag.index, target.index);
        }
        else if (target?.area === "pocket") returnBoardUnitToPocket(drag.index, target.index);
        else showStatus("沒有放到其他格子，文字回到原位。");
      } else if (target?.area === "pocket" && target.index !== drag.index) {
        combinePocketItems(drag.index, target.index);
      } else if (target?.area === "board") {
        deployPocketItem(drag.index, target.index);
      } else {
        showStatus("沒有放到口袋或戰鬥格，內容回到原位。");
      }
      renderBoard();
    } else {
      cleanupPointerDrag();
      if (drag.source === "board") inspectBoardSlot(drag.index);
      else tapPocketItem(drag.index);
    }
  }

  function cancelPointerDrag() {
    if (!pointerDrag) return;
    cleanupPointerDrag();
    showStatus("拖曳已取消，內容回到原位。");
    renderBoard();
    renderPocket();
  }

  function dragItem(source, index) {
    return source === "board" ? state.units[index] : state.pocket[index];
  }

  function createDragGhost(item) {
    dragGhost = document.createElement("div");
    dragGhost.className = `drag-ghost${item.kind === "shovel" ? " shovel" : ""}`;
    dragGhost.innerHTML = `${item.glyph}<span>${item.kind === "shovel" ? "開地" : "★".repeat(item.level)}</span>`;
    document.body.append(dragGhost);
  }

  function positionDragGhost(x, y) {
    if (!dragGhost) return;
    dragGhost.style.left = `${x}px`;
    dragGhost.style.top = `${y}px`;
  }

  function dropTargetAtPoint(x, y) {
    const element = document.elementFromPoint(x, y);
    const boardSlot = element?.closest?.(".slot");
    if (boardSlot) return { area: "board", index: Number(boardSlot.dataset.index) };
    const pocketSlot = element?.closest?.(".pocket-item");
    if (pocketSlot) return { area: "pocket", index: Number(pocketSlot.dataset.index) };
    return null;
  }

  function updateDropTarget(x, y) {
    currentDropTarget = dropTargetAtPoint(x, y);
    renderBoard();
    renderPocket();
  }

  function cleanupPointerDrag() {
    pointerDrag?.sourceElement?.classList.remove("drag-source");
    dragGhost?.remove();
    dragGhost = null;
    currentDropTarget = null;
    pointerDrag = null;
    dom.rangeIndicator.classList.remove("visible");
    document.body.classList.remove("is-dragging");
  }

  function updateSpawning(delta) {
    if (state.wavePending > 0) {
      if (state.spawnClock >= 2.1) {
        state.spawnClock = 0;
        spawnEnemy();
        state.wavePending -= 1;
      }
      return;
    }
    if (state.enemies.length) return;
    if (state.wave >= MAX_WAVE) {
      finish(true);
      return;
    }
    if (state.intermission <= 0) {
      state.intermission = 2.5;
      state.food += 8;
      showStatus(`第 ${state.wave} 波守住了！獎勵 8 個饅頭。`);
    } else {
      state.intermission -= delta;
      if (state.intermission <= 0) {
        state.wave += 1;
        state.wavePending = enemyCountForWave(state.wave);
        state.spawnClock = 1.2;
        showStatus(`第 ${state.wave} 波開始！`);
      }
    }
  }

  function spawnEnemy() {
    const boss = state.wave % 5 === 0 && state.wavePending === 1;
    const maxHealth = (24 + state.wave * 12) * (boss ? 4 : 1);
    state.enemies.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      name: boss ? "Boss" : "敵兵", health: maxHealth, maxHealth, progress: 0,
      speed: 0.032 + state.wave * 0.0015, reward: boss ? 15 : 5 + Math.floor(state.wave / 3), boss
    });
  }

  function updateEnemies(delta) {
    for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = state.enemies[i];
      enemy.progress += enemy.speed * delta;
      if (enemy.progress >= 1) {
        state.enemies.splice(i, 1);
        state.baseHealth -= 1;
        showStatus(`有敵人闖入軍旗！剩餘 ${state.baseHealth} 點城防。`);
        if (state.baseHealth <= 0) finish(false);
      }
    }
  }

  function activeGeneralFormations() {
    const formations = [];
    GENERAL_TYPES.forEach(general => {
      const first = [];
      const second = [];
      state.units.forEach((unit, index) => {
        if (unit?.glyph === general.parts[0]) first.push(index);
        if (unit?.glyph === general.parts[1]) second.push(index);
      });
      const usedSecond = new Set();
      first.forEach(firstIndex => {
        const firstPosition = SLOT_LAYOUT[firstIndex];
        const secondIndex = second.find(index => {
          if (usedSecond.has(index)) return false;
          const secondPosition = SLOT_LAYOUT[index];
          return Math.abs(firstPosition[0] - secondPosition[0]) + Math.abs(firstPosition[1] - secondPosition[1]) === 1;
        });
        if (secondIndex === undefined) return;
        usedSecond.add(secondIndex);
        const secondPosition = SLOT_LAYOUT[secondIndex];
        const orientation = firstPosition[0] === secondPosition[0] ? "vertical" : "horizontal";
        const sorted = [firstIndex, secondIndex].sort((a, b) => a - b);
        formations.push({ ...general, indexes: [firstIndex, secondIndex], orientation,
          level: Math.min(state.units[firstIndex].level, state.units[secondIndex].level),
          key: `${general.id}-${sorted[0]}-${sorted[1]}` });
      });
    });
    return formations;
  }

  function syncGeneralFormations(formations) {
    const nextKeys = new Set(formations.map(formation => formation.key));
    const newNames = formations
      .filter(formation => !state.activeGeneralKeys.has(formation.key))
      .map(formation => formation.name);
    state.activeGeneralKeys = nextKeys;
    if (newNames.length) showStatus(`武將組成：${newNames.join("、")}！被動效果已啟動，可以施放武將技。`);
  }

  function combatStats(unit, formations = activeGeneralFormations(), unitIndex = state.units.indexOf(unit)) {
    let damageMultiplier = 1;
    let speedMultiplier = 1;
    const linkedGeneral = formations.find(formation => formation.indexes.includes(unitIndex));
    const effectiveLevel = linkedGeneral?.level ?? unit.level;
    const activeIds = new Set(formations.map(formation => formation.id));
    GENERAL_TYPES.forEach(general => {
      if (!activeIds.has(general.id) || !general.weapons.includes(unit.weapon)) return;
      damageMultiplier *= general.damageMultiplier ?? 1;
      speedMultiplier *= general.speedMultiplier ?? 1;
    });
    return {
      damage: unit.damage * (2 ** (effectiveLevel - 1)) * damageMultiplier,
      attackSpeed: unit.attackSpeed * speedMultiplier
    };
  }

  function generalCombatStats(formation, formations = activeGeneralFormations()) {
    const partStats = formation.indexes.map(index => combatStats(state.units[index], formations, index));
    return {
      damage: partStats.reduce((sum, stats) => sum + stats.damage, 0),
      attackSpeed: partStats.reduce((sum, stats) => sum + stats.attackSpeed, 0) / partStats.length,
      rangeRadius: Math.max(...formation.indexes.map(index => state.units[index].rangeRadius)),
      effect: formation.id === "zhaoyun" ? "穿透" : formation.id === "guanyu" ? "範圍" : "單體",
      attackKind: formation.id === "zhaoyun" ? "spear" : formation.id === "guanyu" ? "blade" : "bow"
    };
  }

  function useGeneralSkill(key) {
    if (!state.running || state.over) return;
    const formation = activeGeneralFormations().find(item => item.key === key);
    if (!formation) {
      showStatus("武將字陣已拆開，請重新把兩個字放在一起。");
      render();
      return;
    }
    const cooldown = state.generalCooldowns[formation.id] ?? 0;
    if (cooldown > 0) return;
    if (!state.enemies.length) {
      showStatus("目前沒有敵軍，先保留武將技。");
      return;
    }
    const starPower = formation.level * 2;
    if (formation.id === "zhaoyun") {
      state.enemies.slice().sort((a, b) => b.progress - a.progress).slice(0, 3)
        .forEach(enemy => applyDamage(enemy, 36 + starPower * 12));
    } else if (formation.id === "guanyu") {
      state.enemies.forEach(enemy => applyDamage(enemy, 24 + starPower * 10));
    } else {
      state.enemies.forEach(enemy => applyDamage(enemy, 28 + starPower * 9));
    }
    state.generalCooldowns[formation.id] = formation.cooldown;
    animateGeneralSkill(formation);
    collectDefeatedEnemies();
    showStatus(`${formation.name}施放「${formation.skill}」！`);
    render();
  }

  function animateGeneralSkill(formation) {
    const effect = document.createElement("div");
    effect.className = `general-skill-fx ${formation.id}`;
    effect.innerHTML = `<b>${formation.name}</b><span>${formation.skill}</span><i></i><em></em><u></u>`;
    dom.attackFx.append(effect);
    dom.battlefield.classList.add("skill-casting", `skill-${formation.id}`);
    attackingGeneralKeys.add(formation.key);
    renderBoard(activeGeneralFormations());
    renderGeneralFrames(activeGeneralFormations());
    window.setTimeout(() => effect.remove(), 1100);
    window.setTimeout(() => {
      dom.battlefield.classList.remove("skill-casting", `skill-${formation.id}`);
      attackingGeneralKeys.delete(formation.key);
      if (state) {
        const formations = activeGeneralFormations();
        renderBoard(formations);
        renderGeneralFrames(formations);
      }
    }, 850);
  }

  function updateUnitAttacks(delta) {
    const formations = activeGeneralFormations();
    const linkedIndexes = new Set(formations.flatMap(formation => formation.indexes));
    state.units.forEach((unit, unitIndex) => {
      if (!unit || unit.generalId || linkedIndexes.has(unitIndex)) return;
      unit.cooldown = Math.max(0, (unit.cooldown ?? 0) - delta);
      if (unit.cooldown > 0) return;
      const eligible = state.enemies
        .map(enemy => ({ enemy }))
        .filter(item => distance(unitPosition(unitIndex), routePoint(item.enemy.progress)) <= unit.rangeRadius)
        .sort((a, b) => b.enemy.progress - a.enemy.progress);
      if (!eligible.length) return;
      const stats = combatStats(unit, formations);
      const damage = stats.damage;
      animateUnitAttack(unitIndex, unit, eligible[0].enemy);
      applyDamage(eligible[0].enemy, damage);
      if (unit.effect === "穿透" && eligible[1]) applyDamage(eligible[1].enemy, damage * 0.45);
      if (unit.effect === "範圍") {
        for (const nearby of eligible.slice(1, 3)) applyDamage(nearby.enemy, damage * 0.5);
      }
      unit.cooldown = 1 / stats.attackSpeed;
      collectDefeatedEnemies();
    });
    formations.forEach(formation => {
      const parts = formation.indexes.map(index => state.units[index]);
      let cooldown = Math.max(...parts.map(unit => unit.cooldown ?? 0));
      cooldown = Math.max(0, cooldown - delta);
      parts.forEach(unit => { unit.cooldown = cooldown; });
      if (cooldown > 0) return;
      const stats = generalCombatStats(formation, formations);
      const center = generalPosition(formation);
      const eligible = state.enemies
        .map(enemy => ({ enemy }))
        .filter(item => distance(center, routePoint(item.enemy.progress)) <= stats.rangeRadius)
        .sort((a, b) => b.enemy.progress - a.enemy.progress);
      if (!eligible.length) return;
      animateGeneralAttack(formation, eligible[0].enemy, stats.attackKind);
      applyDamage(eligible[0].enemy, stats.damage);
      if (stats.effect === "穿透" && eligible[1]) applyDamage(eligible[1].enemy, stats.damage * 0.45);
      if (stats.effect === "範圍") {
        for (const nearby of eligible.slice(1, 4)) applyDamage(nearby.enemy, stats.damage * 0.5);
      }
      const nextCooldown = 1 / stats.attackSpeed;
      parts.forEach(unit => { unit.cooldown = nextCooldown; });
      collectDefeatedEnemies();
    });
  }

  function applyDamage(enemy, amount) { enemy.health -= amount; }

  function collectDefeatedEnemies() {
    for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = state.enemies[i];
      if (enemy.health > 0) continue;
      state.enemies.splice(i, 1);
      state.food += enemy.reward;
      state.defeated += 1;
      showStatus(`擊敗${enemy.name}，獲得 ${enemy.reward} 個饅頭。`);
    }
  }

  function totalAttack() {
    const formations = activeGeneralFormations();
    const regularDamage = state.units.reduce((sum, unit, index) => {
      if (!unit || unit.generalId) return sum;
      const stats = combatStats(unit, formations, index);
      return sum + stats.damage * stats.attackSpeed;
    }, 0);
    return formations.reduce((sum, formation) => {
      const stats = generalCombatStats(formation, formations);
      return sum + stats.damage * stats.attackSpeed;
    }, regularDamage);
  }

  function finish(won) {
    if (state.over) return;
    state.over = true;
    state.won = won;
    state.running = false;
    closeUnitModal();
    dom.dialogTitle.textContent = won ? "守城成功！" : "軍旗失守";
    dom.dialogList.hidden = true;
    dom.dialogDetail.textContent = won
      ? `你撐過 10 波，擊敗 ${state.defeated} 名敵軍。`
      : `你守到第 ${state.wave} 波，擊敗 ${state.defeated} 名敵軍。再試著保留饅頭刷新與開地。`;
    dom.start.textContent = "再玩一次";
    dom.overlay.classList.remove("hidden");
    render();
  }

  function render() {
    const formations = activeGeneralFormations();
    syncGeneralFormations(formations);
    dom.food.textContent = state.food;
    dom.wave.textContent = `${state.wave}/${MAX_WAVE}`;
    dom.base.textContent = "❤".repeat(Math.max(state.baseHealth, 0)) || "0";
    dom.enemyCount.textContent = state.enemies.length + state.wavePending;
    dom.attack.textContent = totalAttack().toFixed(1);
    dom.refresh.disabled = !state.running || state.food < REFRESH_COST;
    renderBoard(formations);
    renderGeneralFrames(formations);
    renderEnemies();
    renderGenerals(formations);
  }

  function renderBoard(formations = activeGeneralFormations()) {
    const linked = new Map();
    formations.forEach(formation => formation.indexes.forEach(index => linked.set(index, formation)));
    [...dom.board.querySelectorAll(".slot")].forEach((slot, index) => {
      const unlocked = state.unlocked[index];
      const unit = state.units[index];
      const classes = ["slot", unlocked ? (unit ? "filled" : "empty") : "locked"];
      const linkedGeneral = linked.get(index);
      if (attackingSlots.has(index) && !linkedGeneral) classes.push("attacking", `attack-${unitAttackKind(unit)}`);
      if (linkedGeneral) classes.push("general-linked", linkedGeneral.orientation,
        generalPartClass(linkedGeneral, index), `general-${linkedGeneral.id}`);
      if (linkedGeneral && attackingGeneralKeys.has(linkedGeneral.key)) classes.push("general-attacking");
      if (unit?.generalId && !linkedGeneral) classes.push("sleeping-general");
      if (pointerDrag?.dragging && pointerDrag.source === "board" && pointerDrag.index === index) classes.push("drag-source");
      if (currentDropTarget?.area === "board" && currentDropTarget.index === index) classes.push("drop-target");
      slot.className = classes.join(" ");
      if (!unlocked) {
        slot.innerHTML = `<span class="glyph">鎖</span><span class="stars"></span>`;
        slot.setAttribute("aria-label", `鎖定格 ${index + 1}`);
      } else if (unit) {
        const stats = linkedGeneral ? generalCombatStats(linkedGeneral, formations) : combatStats(unit, formations, index);
        const level = linkedGeneral?.level ?? unit.level;
        slot.innerHTML = `<span class="glyph">${unit.glyph}</span><span class="stars">${"★".repeat(level)}</span>`;
        slot.setAttribute("aria-label", unit.generalId && !linkedGeneral
          ? `${unit.name}，${level} 星，沉睡中，必須與另一個武將字相鄰才能攻擊`
          : `${linkedGeneral ? `${linkedGeneral.name}共同` : unit.name + "，"}${level} 星，${linkedGeneral ? "拖走其中一字可拆陣，" : ""}點擊查看屬性，可拖回口袋，攻擊 ${stats.damage.toFixed(1)}`);
      } else {
        slot.innerHTML = `<span class="glyph">＋</span><span class="stars"></span>`;
        slot.setAttribute("aria-label", `已開放空格 ${index + 1}`);
      }
    });
  }

  function generalPartClass(formation, index) {
    const position = SLOT_LAYOUT[index];
    const otherIndex = formation.indexes.find(item => item !== index);
    const other = SLOT_LAYOUT[otherIndex];
    if (formation.orientation === "horizontal") return position[0] < other[0] ? "link-left" : "link-right";
    return position[1] < other[1] ? "link-top" : "link-bottom";
  }

  function renderGeneralFrames(formations) {
    const signature = formations.map(formation => `${formation.key}-${formation.level}-${attackingGeneralKeys.has(formation.key)}`).join("|");
    if (dom.generalFrames.dataset.signature === signature) return;
    dom.generalFrames.innerHTML = formations.map(formation => {
      const positions = formation.indexes.map(index => SLOT_LAYOUT[index]);
      const column = Math.min(...positions.map(position => position[0]));
      const row = Math.min(...positions.map(position => position[1]));
      const columnSpan = formation.orientation === "horizontal" ? 2 : 1;
      const rowSpan = formation.orientation === "vertical" ? 2 : 1;
      return `<div class="general-frame ${formation.orientation} general-${formation.id}${attackingGeneralKeys.has(formation.key) ? " attacking" : ""}"
        style="grid-column:${column} / span ${columnSpan};grid-row:${row} / span ${rowSpan}">
        <span>${formation.name}・${"★".repeat(formation.level)}</span>
      </div>`;
    }).join("");
    dom.generalFrames.dataset.signature = signature;
  }

  function renderGenerals(formations) {
    const signature = formations.map(formation => `${formation.key}-${formation.level}`).join("|");
    if (!formations.length) {
      if (dom.generals.dataset.signature !== "empty") {
        dom.generals.innerHTML = `<p class="general-empty">尚未組成武將：武將字必須上下或左右相鄰，斜角不算。</p>`;
        dom.generals.dataset.signature = "empty";
      }
      return;
    }
    if (dom.generals.dataset.signature !== signature) {
      dom.generals.innerHTML = formations.map(formation => `<article class="general-card ${formation.id}" data-general-card-key="${formation.key}">
        <div class="general-name"><b>${formation.parts[0]}${formation.orientation === "vertical" ? "<br>" : ""}${formation.parts[1]}</b><span><strong>${formation.name}・${"★".repeat(formation.level)}</strong><small>${formation.passive}</small></span></div>
        <button class="general-skill" type="button" data-general-key="${formation.key}">${formation.skill}</button>
        <p>${formation.skillNote}</p>
      </article>`).join("");
      dom.generals.dataset.signature = signature;
    }
    formations.forEach(formation => {
      const card = dom.generals.querySelector(`[data-general-card-key="${formation.key}"]`);
      const button = card?.querySelector(".general-skill");
      if (!button) return;
      const cooldown = state.generalCooldowns[formation.id] ?? 0;
      const ready = cooldown <= 0;
      button.disabled = !ready || !state.enemies.length;
      button.textContent = ready ? formation.skill : `${formation.skill}・${cooldown.toFixed(1)}秒`;
    });
  }

  function renderPocket() {
    [...dom.pocket.children].forEach((slot, index) => {
      const item = state.pocket[index];
      const dragging = pointerDrag?.dragging && pointerDrag.source === "pocket" && pointerDrag.index === index;
      const dropTarget = currentDropTarget?.area === "pocket" && currentDropTarget.index === index;
      const selected = selectedPocketIndex === index;
      if (!item) {
        slot.className = `pocket-item used${dragging ? " drag-source" : ""}${dropTarget ? " drop-target" : ""}`;
        slot.innerHTML = `<span class="glyph">·</span><span class="label">等待刷新</span>`;
        slot.setAttribute("aria-label", `口袋 ${index + 1}，空`);
      } else if (item.kind === "shovel") {
        slot.className = `pocket-item shovel${dragging ? " drag-source" : ""}${dropTarget ? " drop-target" : ""}`;
        slot.innerHTML = `<span class="glyph">鏟</span><span class="label">拖到鎖定格</span>`;
        slot.setAttribute("aria-label", `口袋 ${index + 1}，鏟子，拖到鎖定格開地`);
      } else {
        slot.className = `pocket-item${dragging ? " drag-source" : ""}${dropTarget ? " drop-target" : ""}${selected ? " selected" : ""}`;
        slot.innerHTML = `<span class="glyph">${item.glyph}</span><span class="label">${item.name}・${"★".repeat(item.level)}</span>`;
        slot.setAttribute("aria-label", `口袋 ${index + 1}，${item.name}，${item.level} 星，${selected ? "已選取，" : ""}可點擊或拖曳合體`);
      }
    });
  }

  function renderEnemies() {
    dom.emptyLane.hidden = state.enemies.length > 0;
    dom.enemies.innerHTML = state.enemies.slice().sort((a, b) => b.progress - a.progress).slice(0, 6).map((enemy, index) => {
      const hp = Math.max(0, Math.min(100, enemy.health / enemy.maxHealth * 100));
      const point = routePoint(enemy.progress);
      const y = Math.max(8, Math.min(92, point.y + (index % 3 - 1) * 2.5));
      return `<div class="enemy-token${enemy.boss ? " boss" : ""}" style="--enemy-x:${point.x}%;--enemy-y:${y}%" aria-label="${enemy.name}，距離軍旗 ${Math.round((1 - enemy.progress) * 100)}%">
        <strong>${enemy.boss ? "將" : "敵"}</strong><span class="token-health"><i style="width:${hp}%"></i></span>
        <small>${enemy.boss ? "Boss" : Math.ceil(enemy.health)}</small></div>`;
    }).join("");
  }

  function routePoint(progress) {
    let remaining = Math.max(0, Math.min(0.9999, progress)) * ROUTE_LENGTH;
    for (const segment of ROUTE_SEGMENTS) {
      if (remaining <= segment.length) {
        const t = remaining / segment.length;
        return { x: segment.from.x + (segment.to.x - segment.from.x) * t,
          y: segment.from.y + (segment.to.y - segment.from.y) * t };
      }
      remaining -= segment.length;
    }
    return ROUTE_POINTS.at(-1);
  }

  function unitPosition(index) {
    const [column, row] = SLOT_LAYOUT[index];
    return {
      x: 16 + (column - 0.5) * (68 / BOARD_COLUMNS),
      y: 16 + (row - 0.5) * (68 / BOARD_ROWS)
    };
  }

  function generalPosition(formation) {
    const positions = formation.indexes.map(unitPosition);
    return {
      x: positions.reduce((sum, position) => sum + position.x, 0) / positions.length,
      y: positions.reduce((sum, position) => sum + position.y, 0) / positions.length
    };
  }

  function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

  function unitAttackKind(unit) {
    return unit?.attackKind ?? ({ "弓": "bow", "刀": "blade", "槍": "spear", "騎": "cavalry" })[unit?.glyph] ?? "ink";
  }

  function animateUnitAttack(index, unit, enemy) {
    if (attackingSlots.has(index)) return;
    const kind = unitAttackKind(unit);
    attackingSlots.add(index);
    renderBoard();
    createAttackStroke(unitPosition(index), routePoint(enemy.progress), kind);
    window.setTimeout(() => {
      attackingSlots.delete(index);
      if (state) renderBoard();
    }, ({ bow: 360, blade: 360, spear: 320, cavalry: 480 })[kind] ?? 320);
  }

  function animateGeneralAttack(formation, enemy, kind) {
    if (attackingGeneralKeys.has(formation.key)) return;
    attackingGeneralKeys.add(formation.key);
    const formations = activeGeneralFormations();
    renderBoard(formations);
    renderGeneralFrames(formations);
    const from = generalPosition(formation);
    const to = routePoint(enemy.progress);
    createAttackStroke(from, to, kind, true);
    window.setTimeout(() => createImpactEffect(to, formation.id), kind === "bow" ? 330 : 220);
    window.setTimeout(() => {
      attackingGeneralKeys.delete(formation.key);
      if (state) {
        const nextFormations = activeGeneralFormations();
        renderBoard(nextFormations);
        renderGeneralFrames(nextFormations);
      }
    }, 520);
  }

  function createAttackStroke(from, to, kind, isGeneral = false) {
    const rect = dom.battlefield.getBoundingClientRect();
    const startX = rect.width * from.x / 100;
    const startY = rect.height * from.y / 100;
    const dx = rect.width * (to.x - from.x) / 100;
    const dy = rect.height * (to.y - from.y) / 100;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    const stroke = document.createElement("span");
    stroke.className = `attack-stroke ${kind}${isGeneral ? " general-stroke" : ""}`;
    stroke.style.left = `${startX}px`;
    stroke.style.top = `${startY}px`;
    stroke.style.setProperty("--stroke-x", `${dx}px`);
    stroke.style.setProperty("--stroke-y", `${dy}px`);
    stroke.style.setProperty("--stroke-x-near", `${dx * 0.76}px`);
    stroke.style.setProperty("--stroke-y-near", `${dy * 0.76}px`);
    stroke.style.setProperty("--stroke-x-back", `${dx * 0.18}px`);
    stroke.style.setProperty("--stroke-y-back", `${dy * 0.18}px`);
    stroke.style.setProperty("--stroke-angle", `${angle}deg`);
    stroke.innerHTML = ({
      bow: "<i></i>",
      blade: "<i>丿</i>",
      spear: "<i></i>",
      cavalry: "<i>㇏</i><b>丿</b><em>丶</em>"
    })[kind] ?? "<i>丶</i>";
    dom.attackFx.append(stroke);
    window.setTimeout(() => stroke.remove(), kind === "cavalry" ? 560 : 500);
  }

  function createImpactEffect(to, generalId) {
    const impact = document.createElement("span");
    impact.className = `general-impact ${generalId}`;
    impact.style.left = `${to.x}%`;
    impact.style.top = `${to.y}%`;
    impact.innerHTML = "<i>丶</i><b>丿</b><em>㇏</em>";
    dom.attackFx.append(impact);
    window.setTimeout(() => impact.remove(), 480);
  }

  function showRangeIndicator(unit, index) {
    if (!unit || !Number.isInteger(index)) {
      dom.rangeIndicator.classList.remove("visible");
      return;
    }
    const position = unitPosition(index);
    dom.rangeIndicator.style.left = `${position.x}%`;
    dom.rangeIndicator.style.top = `${position.y}%`;
    dom.rangeIndicator.style.width = `${unit.rangeRadius * 2}%`;
    dom.rangeIndicator.style.height = `${unit.rangeRadius * 2}%`;
    dom.rangeIndicator.classList.add("visible");
  }

  function openUnitModal(unit, index) {
    const formations = activeGeneralFormations();
    const linkedGeneral = Number.isInteger(index)
      ? formations.find(formation => formation.indexes.includes(index))
      : null;
    const sleeping = Boolean(unit.generalId && !linkedGeneral);
    const stats = linkedGeneral ? generalCombatStats(linkedGeneral, formations) : combatStats(unit, formations, index);
    dom.unitCardContent.innerHTML = `
      <h2 id="unit-modal-title" class="unit-card-title"><b class="${linkedGeneral ? "general-title-glyph" : ""}">${linkedGeneral?.name ?? unit.glyph}</b><span>${linkedGeneral?.name ?? unit.name}<small>${linkedGeneral ? `雙字武將・共同 ${linkedGeneral.level} 星` : `${unit.role}・${unit.level} 星`}</small></span></h2>
      <div class="attribute-grid">
        <div><span>攻擊力</span><strong>${sleeping ? "0（沉睡）" : stats.damage.toFixed(1)}</strong></div>
        <div><span>攻擊速度</span><strong>${sleeping ? "—" : `${stats.attackSpeed.toFixed(2)} 次／秒`}</strong></div>
        <div><span>攻擊距離</span><strong>${unit.rangeLabel}距離</strong></div>
        <div><span>攻擊效果</span><strong>${unit.effect}</strong></div>
      </div>
      <p class="unit-card-note">${linkedGeneral
        ? `${linkedGeneral.passive}。必須用另一組同名、同星武將合體升級；拖走其中一字即可拆陣。`
        : unit.generalId
          ? `💤 沉睡中，單字不能攻擊；${unit.role}。上下或左右相鄰才會甦醒成將，斜角不算。`
          : "升星會提高攻擊力；相同文字與相同星級可以合成。"}</p>`;
    showRangeIndicator(unit, index);
    dom.unitModal.classList.remove("hidden");
  }

  function closeUnitModal() {
    dom.unitModal.classList.add("hidden");
    dom.rangeIndicator.classList.remove("visible");
  }

  function showStatus(message) { dom.status.textContent = message; }
  function enemyCountForWave(wave) { return 4 + wave; }

  buildBoard();
  buildPocket();
  state = freshState();
  renderPocket();
  render();
  dom.refresh.addEventListener("click", refreshPocket);
  dom.generals.addEventListener("click", event => {
    const button = event.target.closest("[data-general-key]");
    if (button) useGeneralSkill(button.dataset.generalKey);
  });
  window.addEventListener("pointermove", pointerMove, { passive: false });
  window.addEventListener("pointerup", pointerUp, { passive: false });
  window.addEventListener("pointercancel", cancelPointerDrag);
  dom.unitClose.addEventListener("click", closeUnitModal);
  dom.unitModal.addEventListener("click", event => {
    if (event.target === dom.unitModal) closeUnitModal();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeUnitModal();
  });
  dom.start.addEventListener("click", () => {
    dom.dialogList.hidden = false;
    dom.dialogDetail.textContent = "";
    dom.start.textContent = "開始守城";
    startGame();
  });
})();
