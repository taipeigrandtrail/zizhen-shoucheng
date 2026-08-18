(() => {
  "use strict";

  const BOARD_SIZE = 24;
  const BOARD_COLUMNS = 9;
  const BOARD_ROWS = 11;
  const BOARD_LEFT = 4;
  const BOARD_TOP = 8;
  const BOARD_WIDTH = 92;
  const BOARD_HEIGHT = 88;
  const POCKET_SIZE = 5;
  const REFRESH_COST = 10;
  const MAX_LEVEL = 5;
  const MAX_WAVE = 10;
  const DRAG_START_DISTANCE = 12;
  const DOUBLE_TAP_WINDOW = 450;
  const BOARD_DROP_SLOP = 16;
  const POCKET_DROP_SLOP = 20;
  const GENERAL_XP_PER_KILL = 1;
  const GENERAL_XP_PER_WORD = 3;
  const GENERAL_XP_TO_NEXT = [0, 6, 10, 16, 24];
  const INITIAL_UNLOCKED = new Set([0, 1, 2, 3, 4, 5]);
  const UNIT_TYPES = [
    { kind: "unit", glyph: "刀", weapon: "刀", name: "刀兵", damage: 8, attackSpeed: 1.2, rangeCells: 1, effect: "單體", role: "近距快攻" },
    { kind: "unit", glyph: "槍", weapon: "槍", name: "槍兵", damage: 12, attackSpeed: 0.8, rangeCells: 2, effect: "穿透", role: "中距穿透" },
    { kind: "unit", glyph: "弓", weapon: "弓", name: "弓兵", damage: 6, attackSpeed: 1.6, rangeCells: 3, effect: "單體", role: "遠距連射" },
    { kind: "unit", glyph: "騎", weapon: "騎", name: "騎兵", damage: 18, attackSpeed: 0.55, rangeCells: 2, effect: "範圍", role: "中距範圍" }
  ];
  const GENERAL_TYPES = [
    { id: "guanyu", element: "wood", name: "關羽", parts: ["關", "羽"], weapons: ["刀", "騎"], damageMultiplier: 1.2, rangeCells: 2,
      passive: "刀兵、騎兵攻擊力 +20%", skill: "青龍偃月", cooldown: 14, skillNote: "綠龍咆哮，劈斬戰場上所有敵軍" },
    { id: "zhangfei", element: "earth", name: "張飛", parts: ["張", "飛"], weapons: ["槍"], damageMultiplier: 1.22, rangeCells: 1,
      passive: "槍兵攻擊力 +22%", skill: "咆哮震陣", cooldown: 15, skillNote: "震擊戰場上所有敵軍" },
    { id: "zhaoyun", element: "water", name: "趙雲", parts: ["趙", "雲"], weapons: ["槍"], damageMultiplier: 1.25, rangeCells: 2,
      passive: "槍兵攻擊力 +25%", skill: "龍膽突陣", cooldown: 12, skillNote: "藍龍穿陣，重創最接近軍旗的 3 名敵軍" },
    { id: "machao", element: "metal", name: "馬超", parts: ["馬", "超"], weapons: ["騎", "槍"], speedMultiplier: 1.25, rangeCells: 2,
      passive: "騎兵、槍兵攻擊速度 +25%", skill: "鐵騎衝陣", cooldown: 13, skillNote: "金系鐵騎衝擊最前方 5 名敵軍" },
    { id: "huangzhong", element: "fire", name: "黃忠", parts: ["黃", "忠"], weapons: ["弓"], speedMultiplier: 1.25, rangeCells: 3,
      passive: "弓兵攻擊速度 +25%", skill: "多重火箭", cooldown: 11, skillNote: "主箭先發，副箭依序清場" }
  ];
  const GENERAL_PARTS = [
    { kind: "unit", glyph: "趙", weapon: "槍", generalId: "zhaoyun", name: "武將字・趙", damage: 10, attackSpeed: 0.9, rangeCells: 2, effect: "穿透", role: "與「雲」相鄰可成將", attackKind: "spear" },
    { kind: "unit", glyph: "雲", weapon: "槍", generalId: "zhaoyun", name: "武將字・雲", damage: 8, attackSpeed: 1.05, rangeCells: 2, effect: "單體", role: "與「趙」相鄰可成將", attackKind: "spear" },
    { kind: "unit", glyph: "關", weapon: "刀", generalId: "guanyu", name: "武將字・關", damage: 13, attackSpeed: 0.72, rangeCells: 1, effect: "單體", role: "與「羽」相鄰可成將", attackKind: "blade" },
    { kind: "unit", glyph: "羽", weapon: "騎", generalId: "guanyu", name: "武將字・羽", damage: 11, attackSpeed: 0.88, rangeCells: 2, effect: "範圍", role: "與「關」相鄰可成將", attackKind: "cavalry" },
    { kind: "unit", glyph: "張", weapon: "槍", generalId: "zhangfei", name: "武將字・張", damage: 12, attackSpeed: 0.78, rangeCells: 2, effect: "穿透", role: "與「飛」相鄰可成將", attackKind: "spear" },
    { kind: "unit", glyph: "飛", weapon: "槍", generalId: "zhangfei", name: "武將字・飛", damage: 10, attackSpeed: 0.9, rangeCells: 2, effect: "單體", role: "與「張」相鄰可成將", attackKind: "spear" },
    { kind: "unit", glyph: "馬", weapon: "騎", generalId: "machao", name: "武將字・馬", damage: 13, attackSpeed: 0.82, rangeCells: 2, effect: "範圍", role: "與「超」相鄰可成將", attackKind: "cavalry" },
    { kind: "unit", glyph: "超", weapon: "槍", generalId: "machao", name: "武將字・超", damage: 12, attackSpeed: 0.92, rangeCells: 2, effect: "穿透", role: "與「馬」相鄰可成將", attackKind: "spear" },
    { kind: "unit", glyph: "黃", weapon: "弓", generalId: "huangzhong", name: "武將字・黃", damage: 7, attackSpeed: 1.35, rangeCells: 3, effect: "單體", role: "與「忠」相鄰可成將", attackKind: "bow" },
    { kind: "unit", glyph: "忠", weapon: "弓", generalId: "huangzhong", name: "武將字・忠", damage: 9, attackSpeed: 1.15, rangeCells: 3, effect: "單體", role: "與「黃」相鄰可成將", attackKind: "bow" }
  ];
  const SHOVEL = { kind: "shovel", glyph: "鏟", name: "鏟子" };
  const MAP_TYPES = [
    { id: "metal", element: "金", name: "鑄鐵關", background: "assets/maps/metal-forge.jpg",
      route: [[1,10],[5,10],[5,8],[2,8],[2,6],[7,6],[7,4],[4,4],[4,2],[8,2],[8,1]],
      slots: [[1,6],[1,7],[3,5],[4,5],[3,2],[3,3],[8,6],[8,5],[9,5],[4,11],[5,3],[6,3],[7,3],[9,2],[1,8],[9,1],[5,7],[6,7],[9,3],[1,9],[2,9],[3,9],[4,9],[5,11]] },
    { id: "wood", element: "木", name: "青藤林", background: "assets/maps/wood-grove.jpg",
      route: [[5,11],[5,9],[2,9],[2,6],[4,6],[4,2],[6,2],[6,6],[8,6],[8,2],[9,2],[9,1]],
      slots: [[8,7],[7,7],[4,10],[3,10],[5,6],[5,5],[6,8],[5,4],[8,1],[2,5],[3,7],[9,3],[2,10],[9,4],[5,3],[3,2],[7,2],[3,3],[7,1],[3,8],[9,5],[3,5],[5,8],[4,11]] },
    { id: "water", element: "水", name: "水澤道", background: "assets/maps/water-marsh.jpg",
      route: [[1,11],[5,11],[5,9],[8,9],[8,7],[3,7],[3,5],[7,5],[7,3],[9,3],[9,1]],
      slots: [[9,8],[9,9],[4,9],[4,10],[5,6],[6,6],[4,4],[7,6],[9,7],[3,4],[8,4],[9,4],[7,10],[4,8],[4,6],[6,11],[1,10],[2,10],[3,10],[6,10],[8,1],[8,2],[7,2],[3,8]] },
    { id: "fire", element: "火", name: "火裂谷", background: "assets/maps/fire-rift.jpg",
      route: [[1,10],[6,10],[6,8],[3,8],[3,6],[8,6],[8,4],[4,4],[4,2],[9,2],[9,1]],
      slots: [[3,9],[4,9],[1,11],[2,11],[6,3],[5,3],[5,9],[5,5],[7,8],[7,9],[3,3],[8,1],[7,1],[8,3],[2,7],[9,6],[3,2],[9,5],[9,3],[2,6],[7,10],[4,5],[7,5],[6,5]] },
    { id: "earth", element: "土", name: "土城關", background: "assets/maps/earth-fortress.jpg",
      route: [[1,10],[4,10],[4,8],[1,8],[1,6],[6,6],[6,4],[3,4],[3,2],[9,2],[9,1]],
      slots: [[2,4],[2,5],[5,11],[5,10],[2,7],[3,7],[5,3],[8,1],[7,1],[4,5],[6,7],[5,7],[4,1],[6,3],[4,3],[3,9],[1,9],[1,5],[4,7],[9,3],[8,3],[5,5],[2,9],[3,1]] }
  ];

  function validateMapSlots(map) {
    const slotKeys = new Set(map.slots.map(([column, row]) => `${column},${row}`));
    if (slotKeys.size !== BOARD_SIZE) throw new Error(`${map.name} 的文字格不是 ${BOARD_SIZE} 個唯一位置`);
    const hasNeighbor = ([column, row], keys = slotKeys) =>
      [[1,0],[-1,0],[0,1],[0,-1]].some(([dx, dy]) => keys.has(`${column + dx},${row + dy}`));
    if (map.slots.some(slot => !hasNeighbor(slot))) throw new Error(`${map.name} 存在無法合體的孤立文字格`);
    const openingKeys = new Set(map.slots.slice(0, INITIAL_UNLOCKED.size).map(([column, row]) => `${column},${row}`));
    if (map.slots.slice(0, INITIAL_UNLOCKED.size).some(slot => !hasNeighbor(slot, openingKeys))) {
      throw new Error(`${map.name} 的開場文字格存在孤立位置`);
    }
  }
  MAP_TYPES.forEach(validateMapSlots);
  let selectedMapId = "metal";
  let SLOT_LAYOUT = MAP_TYPES[0].slots;
  let ROUTE_POINTS = [];
  let ROUTE_SEGMENTS = [];
  let ROUTE_LENGTH = 0;

  const dom = {
    food: document.querySelector("#food"), wave: document.querySelector("#wave"),
    base: document.querySelector("#base"), enemyCount: document.querySelector("#enemy-count"),
    attack: document.querySelector("#attack"), enemies: document.querySelector("#enemies"),
    emptyLane: document.querySelector("#empty-lane"), battlefield: document.querySelector(".battlefield"),
    routePath: document.querySelector("#route-path"), entrance: document.querySelector("#entrance"),
    flag: document.querySelector("#flag"), mapName: document.querySelector("#map-name"),
    board: document.querySelector("#board"), generalFrames: document.querySelector("#general-frames"),
    attackFx: document.querySelector("#attack-fx"),
    pocket: document.querySelector("#pocket"), rangeIndicator: document.querySelector("#range-indicator"),
    refresh: document.querySelector("#refresh"), status: document.querySelector("#status"),
    generals: document.querySelector("#generals"),
    overlay: document.querySelector("#overlay"), dialogTitle: document.querySelector("#dialog-title"),
    dialogList: document.querySelector("#dialog-list"), dialogDetail: document.querySelector("#dialog-detail"),
    mapSelect: document.querySelector("#map-select"),
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
  let lastBoardTap = null;
  const attackingSlots = new Set();
  const attackingGeneralKeys = new Set();

  function currentMap() {
    return MAP_TYPES.find(map => map.id === selectedMapId) ?? MAP_TYPES[0];
  }

  function gridPointToPercent([column, row]) {
    return {
      x: BOARD_LEFT + (column - 0.5) * (BOARD_WIDTH / BOARD_COLUMNS),
      y: BOARD_TOP + (row - 0.5) * (BOARD_HEIGHT / BOARD_ROWS)
    };
  }

  function applySelectedMap() {
    const map = currentMap();
    SLOT_LAYOUT = map.slots;
    ROUTE_POINTS = map.route.map(gridPointToPercent);
    ROUTE_SEGMENTS = ROUTE_POINTS.slice(0, -1).map((point, index) => ({
      from: point,
      to: ROUTE_POINTS[index + 1],
      length: Math.hypot(ROUTE_POINTS[index + 1].x - point.x, ROUTE_POINTS[index + 1].y - point.y)
    }));
    ROUTE_LENGTH = ROUTE_SEGMENTS.reduce((sum, segment) => sum + segment.length, 0);
    dom.routePath.setAttribute("d", ROUTE_POINTS.map((point, index) => `${index ? "L" : "M"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" "));
    dom.battlefield.dataset.map = map.id;
    dom.battlefield.style.setProperty("--map-art", `url("${map.background}")`);
    dom.mapName.textContent = `${map.element}・${map.name}`;
    const start = ROUTE_POINTS[0];
    const goal = ROUTE_POINTS.at(-1);
    dom.entrance.style.left = `${start.x}%`;
    dom.entrance.style.top = `${start.y}%`;
    dom.flag.style.left = `${goal.x}%`;
    dom.flag.style.top = `${goal.y}%`;
    [...dom.mapSelect.querySelectorAll("[data-map-id]")].forEach(button => {
      button.classList.toggle("selected", button.dataset.mapId === map.id);
    });
  }

  function freshState() {
    const unlocked = Array(BOARD_SIZE).fill(false);
    INITIAL_UNLOCKED.forEach(index => { unlocked[index] = true; });
    return {
      units: Array(BOARD_SIZE).fill(null), unlocked, pocket: Array(POCKET_SIZE).fill(null), enemies: [],
      food: 30, baseHealth: 3, wave: 1, wavePending: enemyCountForWave(1), defeated: 0,
      refreshCount: 0, spawnClock: 0, intermission: 0,
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
    applySelectedMap();
    buildBoard();
    state = freshState();
    selectedPocketIndex = null;
    state.running = true;
    state.spawnClock = 0.8;
    lastFrame = performance.now();
    closeUnitModal();
    dom.overlay.classList.add("hidden");
    showStatus("先刷新口袋；可直接拖到戰鬥格，或先點文字再點格子部署。");
    renderPocket();
    render();
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(tick);
  }

  function tick(now) {
    if (!state.running) return;
    const delta = Math.min((now - lastFrame) / 1000, 0.1);
    lastFrame = now;
    state.spawnClock += delta;
    Object.keys(state.generalCooldowns).forEach(key => {
      state.generalCooldowns[key] = Math.max(0, state.generalCooldowns[key] - delta);
    });
    updateEnemies(delta);
    updateSpawning(delta);
    updateUnitAttacks(delta);
    render();
    if (state.running) rafId = requestAnimationFrame(tick);
  }

  function refreshPocket() {
    if (!state.running || state.over) return;
    if (state.food < REFRESH_COST) {
      showStatus("軍餉不足；請擊敗敵軍、守住整波，或復活後繼續挑戰。");
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
      const zhao = GENERAL_PARTS.find(part => part.glyph === "趙");
      const yun = GENERAL_PARTS.find(part => part.glyph === "雲");
      state.pocket[0] = { ...zhao, level: 1, cooldown: 0 };
      state.pocket[1] = { ...yun, level: 1, cooldown: 0 };
      state.pocket[2] = { ...zhao, level: 1, cooldown: 0 };
      state.pocket[3] = { ...yun, level: 1, cooldown: 0 };
    }
    const includeShovel = state.refreshCount % 3 === 0 || (state.refreshCount > 1 && Math.random() < 0.28);
    if (includeShovel) state.pocket[Math.floor(Math.random() * POCKET_SIZE)] = { ...SHOVEL };
    renderPocket();
    render();
    showStatus(includeShovel
      ? "刷新完成！出現鏟子，把它拖到鎖定格即可開地。"
      : state.refreshCount === 1
        ? "首次刷新出現兩組「趙、雲」；先組成趙雲，再把額外的趙或雲拖到武將的相同文字上增加經驗。"
        : "刷新完成！武將字上下或左右相鄰，就能組成武將。");
  }

  function inspectBoardSlot(index) {
    if (!state.running || state.over) return;
    if (selectedPocketIndex !== null && state.pocket[selectedPocketIndex]) {
      const pocketIndex = selectedPocketIndex;
      deployPocketItem(pocketIndex, index);
      if (!state.pocket[pocketIndex]) selectedPocketIndex = null;
      renderPocket();
      return;
    }
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

  function tapBoardSlot(index) {
    if (!state.running || state.over) return;
    if (selectedPocketIndex !== null && state.pocket[selectedPocketIndex]) {
      lastBoardTap = null;
      inspectBoardSlot(index);
      return;
    }
    if (!state.unlocked[index] || !state.units[index]) {
      lastBoardTap = null;
      dom.rangeIndicator.classList.remove("visible");
      inspectBoardSlot(index);
      return;
    }
    const formations = activeGeneralFormations();
    const formation = formations.find(item => item.indexes.includes(index));
    const tapKey = formation?.key ?? `slot-${index}`;
    const now = performance.now();
    if (lastBoardTap?.key === tapKey && now - lastBoardTap.at <= DOUBLE_TAP_WINDOW) {
      lastBoardTap = null;
      openUnitModal(state.units[index], index);
      return;
    }
    lastBoardTap = { key: tapKey, at: now };
    showBoardRange(index, formations);
    showStatus(`${formation?.name ?? `「${state.units[index].glyph}」`}的攻擊範圍；再點一次查看詳細資料。`);
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
    const sourceFormation = activeGeneralFormations().find(formation => formation.indexes.includes(from));
    if (!target) {
      state.units[to] = source;
      state.units[from] = null;
      showStatus(`已把「${source.glyph}」移到新位置。`);
    } else if (targetFormation) {
      if (sourceFormation?.key === targetFormation.key) {
        showStatus(`${targetFormation.name}是同一個整體；拖到空格才能拆開。`);
        return;
      }
      if (source.generalId === targetFormation.id && targetFormation.parts.includes(source.glyph)) {
        if (targetFormation.level >= MAX_LEVEL) {
          showStatus(`${targetFormation.name}已經是最高 5 星。`);
          return;
        }
        state.units[from] = null;
        const result = addGeneralExperience(targetFormation, GENERAL_XP_PER_WORD);
        showStatus(experienceGainMessage(targetFormation.name, result, `吸收「${source.glyph}」`));
        render();
        return;
      }
      showStatus(`${targetFormation.name}只能吸收組成自己的文字：「${targetFormation.parts.join("、")}」。`);
      return;
    } else if (canCombine(source, target)) {
      const level = upgradeSingleUnit(to);
      state.units[from] = null;
      state.food += 2;
      showStatus(`合成成功：「${target.glyph}」升為 ${level} 星！`);
    } else if (source.glyph === target.glyph && source.level === target.level) {
      showStatus(source.generalId
        ? "武將單字不能合體升級；請先組成武將，再把相同文字餵給他增加經驗。"
        : "這兩個文字都已經是最高 5 星。");
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
      if (item.generalId === targetFormation.id && targetFormation.parts.includes(item.glyph)) {
        if (targetFormation.level >= MAX_LEVEL) {
          showStatus(`${targetFormation.name}已經是最高 5 星。`);
          return;
        }
        state.pocket[pocketIndex] = null;
        const result = addGeneralExperience(targetFormation, GENERAL_XP_PER_WORD);
        showStatus(experienceGainMessage(targetFormation.name, result, `吸收「${item.glyph}」`));
        renderPocket();
        render();
        return;
      }
      showStatus(`${targetFormation.name}只能吸收組成自己的文字：「${targetFormation.parts.join("、")}」。`);
      return;
    } else if (canCombine(item, target)) {
      const level = upgradeSingleUnit(targetIndex);
      state.pocket[pocketIndex] = null;
      showStatus(`合成成功：「${target.glyph}」升為 ${level} 星！`);
    } else if (item.glyph === target.glyph && item.level === target.level) {
      showStatus(item.generalId
        ? "武將單字不能合體升級；請先組成武將，再餵給完整武將增加經驗。"
        : "這兩個文字都已經是最高 5 星。");
      return;
    } else {
      state.units[targetIndex] = { ...item, cooldown: 0 };
      state.pocket[pocketIndex] = target;
      selectedPocketIndex = null;
      showStatus(`交換成功：「${item.glyph}」進入戰場，「${target.glyph}」回到口袋。`);
    }
    renderPocket();
    render();
  }

  function canCombine(source, target) {
    return !source.generalId && !target.generalId
      && source.glyph === target.glyph && source.level === target.level && target.level < MAX_LEVEL;
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
    showStatus("武將已改為經驗制，不再互相合體直升。請先把來源武將拆開，再將相同單字餵給目標武將。");
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
      showStatus(source.generalId
        ? "武將單字不能在口袋合體升級；請先組成武將，再餵給武將增加經驗。"
        : "這兩個文字都已經是最高 5 星。");
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
      showStatus(source.generalId
        ? "武將單字不能在口袋合體升級；請改拖到口袋空格。"
        : "這兩個文字都已經是最高 5 星。請改拖到口袋空格。");
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
    if (source === "pocket") lastBoardTap = null;
    const item = dragItem(source, index);
    if (pointerDrag) cleanupPointerDrag();
    pointerDrag = {
      pointerId: event.pointerId, source, index, sourceElement: event.currentTarget,
      startX: event.clientX, startY: event.clientY, dragging: false
    };
    if (item) {
      event.preventDefault();
      try { event.currentTarget.setPointerCapture(event.pointerId); } catch (_) { /* Safari may reject stale pointers. */ }
    }
  }

  function pointerMove(event) {
    if (!pointerDrag || pointerDrag.pointerId !== event.pointerId) return;
    const item = dragItem(pointerDrag.source, pointerDrag.index);
    if (!item) return;
    const travel = Math.hypot(event.clientX - pointerDrag.startX, event.clientY - pointerDrag.startY);
    if (!pointerDrag.dragging && travel > DRAG_START_DISTANCE) {
      pointerDrag.dragging = true;
      if (pointerDrag.source === "pocket") selectedPocketIndex = null;
      createDragGhost(item);
      pointerDrag.sourceElement.classList.add("drag-source");
      if (pointerDrag.source === "board") showBoardRange(pointerDrag.index);
      document.body.classList.add("is-dragging", `dragging-${pointerDrag.source}`);
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
      if (drag.source === "board") tapBoardSlot(drag.index);
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

    let nearest = null;
    const candidates = [
      ...[...dom.board.querySelectorAll(".slot")].map(slot => ({ area: "board", element: slot, slop: BOARD_DROP_SLOP })),
      ...[...dom.pocket.querySelectorAll(".pocket-item")].map(slot => ({ area: "pocket", element: slot, slop: POCKET_DROP_SLOP }))
    ];
    candidates.forEach(candidate => {
      const rect = candidate.element.getBoundingClientRect();
      const dx = Math.max(rect.left - x, 0, x - rect.right);
      const dy = Math.max(rect.top - y, 0, y - rect.bottom);
      const distance = Math.hypot(dx, dy);
      if (distance <= candidate.slop && (!nearest || distance < nearest.distance)) {
        nearest = {
          area: candidate.area,
          index: Number(candidate.element.dataset.index),
          distance
        };
      }
    });
    return nearest ? { area: nearest.area, index: nearest.index } : null;
  }

  function updateDropTarget(x, y) {
    const nextTarget = dropTargetAtPoint(x, y);
    if (nextTarget?.area === currentDropTarget?.area && nextTarget?.index === currentDropTarget?.index) return;
    dropTargetElement(currentDropTarget)?.classList.remove("drop-target");
    currentDropTarget = nextTarget;
    dropTargetElement(currentDropTarget)?.classList.add("drop-target");
  }

  function dropTargetElement(target) {
    if (!target) return null;
    return target.area === "board"
      ? dom.board.querySelector(`.slot[data-index="${target.index}"]`)
      : dom.pocket.querySelector(`.pocket-item[data-index="${target.index}"]`);
  }

  function cleanupPointerDrag() {
    const drag = pointerDrag;
    if (drag?.sourceElement?.hasPointerCapture?.(drag.pointerId)) {
      try { drag.sourceElement.releasePointerCapture(drag.pointerId); } catch (_) { /* Pointer already ended. */ }
    }
    pointerDrag?.sourceElement?.classList.remove("drag-source");
    dropTargetElement(currentDropTarget)?.classList.remove("drop-target");
    dragGhost?.remove();
    dragGhost = null;
    currentDropTarget = null;
    pointerDrag = null;
    if (drag?.dragging) {
      lastBoardTap = null;
      dom.rangeIndicator.classList.remove("visible");
    }
    document.body.classList.remove("is-dragging", "dragging-board", "dragging-pocket");
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
      showStatus(`第 ${state.wave} 波守住了！獎勵 8 個軍餉。`);
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
    const candidates = [];
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
        const level = Math.min(state.units[firstIndex].level, state.units[secondIndex].level);
        const xp = level >= MAX_LEVEL ? 0 : Math.min(
          state.units[firstIndex].generalXp ?? 0,
          state.units[secondIndex].generalXp ?? 0
        );
        candidates.push({ ...general, indexes: [firstIndex, secondIndex], orientation, level, xp,
          key: `${general.id}-${sorted[0]}-${sorted[1]}` });
      });
    });
    return GENERAL_TYPES.flatMap(general => {
      const sameName = candidates.filter(formation => formation.id === general.id);
      const existing = sameName.find(formation => state.activeGeneralKeys.has(formation.key));
      return existing ? [existing] : sameName.slice(0, 1);
    });
  }

  function syncGeneralFormations(formations) {
    const nextKeys = new Set(formations.map(formation => formation.key));
    const newNames = formations
      .filter(formation => !state.activeGeneralKeys.has(formation.key))
      .map(formation => formation.name);
    state.activeGeneralKeys = nextKeys;
    if (newNames.length) showStatus(`武將組成：${newNames.join("、")}！被動效果已啟動，可以施放武將技。`);
  }

  function generalXpNeeded(level) {
    return level >= MAX_LEVEL ? 0 : GENERAL_XP_TO_NEXT[level];
  }

  function generalXpPercent(formation) {
    if (formation.level >= MAX_LEVEL) return 100;
    return Math.min(100, formation.xp / generalXpNeeded(formation.level) * 100);
  }

  function addGeneralExperience(formation, amount) {
    let level = formation.level;
    let xp = formation.xp ?? 0;
    let levelsGained = 0;
    if (level < MAX_LEVEL) xp += amount;
    while (level < MAX_LEVEL && xp >= generalXpNeeded(level)) {
      xp -= generalXpNeeded(level);
      level += 1;
      levelsGained += 1;
    }
    if (level >= MAX_LEVEL) xp = 0;
    formation.indexes.forEach(index => {
      const unit = state.units[index];
      if (unit) state.units[index] = { ...unit, level, generalXp: xp };
    });
    return { amount, level, xp, needed: generalXpNeeded(level), levelsGained };
  }

  function experienceGainMessage(name, result, reason) {
    if (result.levelsGained) return `${reason}，${name}獲得 ${result.amount} 經驗並升為 ${result.level} 星！`;
    if (result.level >= MAX_LEVEL) return `${name}已經是最高 5 星。`;
    return `${reason}，${name}獲得 ${result.amount} 經驗（${result.xp}/${result.needed}）。`;
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
    const effectByGeneral = { zhaoyun: "穿透", guanyu: "範圍", zhangfei: "範圍", machao: "範圍", huangzhong: "單體" };
    const attackByGeneral = { zhaoyun: "spear", guanyu: "blade", zhangfei: "spear", machao: "cavalry", huangzhong: "bow" };
    return {
      damage: partStats.reduce((sum, stats) => sum + stats.damage, 0),
      attackSpeed: partStats.reduce((sum, stats) => sum + stats.attackSpeed, 0) / partStats.length,
      rangeCells: formation.rangeCells,
      effect: effectByGeneral[formation.id] ?? "單體",
      attackKind: attackByGeneral[formation.id] ?? "ink"
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
    } else if (formation.id === "zhangfei") {
      state.enemies.forEach(enemy => applyDamage(enemy, 22 + starPower * 9));
    } else if (formation.id === "machao") {
      state.enemies.slice().sort((a, b) => b.progress - a.progress).slice(0, 5)
        .forEach(enemy => applyDamage(enemy, 30 + starPower * 10));
    } else {
      state.enemies.forEach(enemy => applyDamage(enemy, 28 + starPower * 9));
    }
    state.generalCooldowns[formation.id] = formation.cooldown;
    animateGeneralSkill(formation);
    const defeated = collectDefeatedEnemies(formation);
    showStatus(`${formation.name}施放「${formation.skill}」！${defeated.message ? ` ${defeated.message}` : ""}`);
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
        .filter(item => gridDistance(unitPosition(unitIndex), routePoint(item.enemy.progress)) <= unit.rangeCells)
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
      const eligible = state.enemies
        .map(enemy => ({ enemy }))
        .filter(item => formationGridDistance(formation, routePoint(item.enemy.progress)) <= stats.rangeCells)
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
      collectDefeatedEnemies(formation);
    });
  }

  function applyDamage(enemy, amount) { enemy.health -= amount; }

  function collectDefeatedEnemies(killerFormation = null) {
    let defeatedCount = 0;
    let totalReward = 0;
    for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = state.enemies[i];
      if (enemy.health > 0) continue;
      state.enemies.splice(i, 1);
      state.food += enemy.reward;
      state.defeated += 1;
      defeatedCount += 1;
      totalReward += enemy.reward;
    }
    if (!defeatedCount) return { defeatedCount: 0, message: "" };
    let message = `擊敗 ${defeatedCount} 名敵軍，獲得 ${totalReward} 個軍餉。`;
    if (killerFormation) {
      const result = addGeneralExperience(killerFormation, defeatedCount * GENERAL_XP_PER_KILL);
      message += ` ${experienceGainMessage(killerFormation.name, result, "戰鬥勝利")}`;
    }
    showStatus(message);
    return { defeatedCount, message };
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
      : `你守到第 ${state.wave} 波，擊敗 ${state.defeated} 名敵軍。再試著保留軍餉刷新與開地。`;
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
      const standbyGeneral = Boolean(unit?.generalId && !linkedGeneral
        && formations.some(formation => formation.id === unit.generalId));
      if (attackingSlots.has(index) && !linkedGeneral) classes.push("attacking", `attack-${unitAttackKind(unit)}`);
      if (linkedGeneral) classes.push("general-linked", linkedGeneral.orientation,
        generalPartClass(linkedGeneral, index), `general-${linkedGeneral.id}`);
      if (linkedGeneral && attackingGeneralKeys.has(linkedGeneral.key)) classes.push("general-attacking");
      if (unit?.generalId && !linkedGeneral) classes.push("sleeping-general");
      if (pointerDrag?.dragging && pointerDrag.source === "board" && pointerDrag.index === index) classes.push("drag-source");
      if (currentDropTarget?.area === "board" && currentDropTarget.index === index) classes.push("drop-target");
      slot.className = classes.join(" ");
      if (!unlocked) {
        setRenderedSlot(slot, "locked", `<span class="glyph">鎖</span><span class="stars"></span>`, `鎖定格 ${index + 1}`);
      } else if (unit) {
        const stats = linkedGeneral ? generalCombatStats(linkedGeneral, formations) : combatStats(unit, formations, index);
        const level = linkedGeneral?.level ?? unit.level;
        const label = unit.generalId && !linkedGeneral
          ? standbyGeneral
            ? `${unit.name}，${level} 星，沉睡中；同名武將已有一組甦醒，不能攻擊`
            : `${unit.name}，${level} 星，沉睡中，必須與另一個武將字相鄰才能攻擊`
          : `${linkedGeneral ? `${linkedGeneral.name}共同` : unit.name + "，"}${level} 星，${linkedGeneral ? "拖走其中一字可拆陣，" : ""}單點看範圍、雙點看屬性，可拖回口袋，攻擊 ${stats.damage.toFixed(1)}`;
        setRenderedSlot(slot, `unit-${unit.glyph}-${level}`, `<span class="glyph">${unit.glyph}</span><span class="stars">${"★".repeat(level)}</span>`, label);
      } else {
        setRenderedSlot(slot, "empty", `<span class="glyph">＋</span><span class="stars"></span>`, `已開放空格 ${index + 1}`);
      }
    });
  }

  function setRenderedSlot(slot, key, markup, label) {
    if (slot.dataset.renderKey !== key) {
      slot.innerHTML = markup;
      slot.dataset.renderKey = key;
    }
    if (slot.getAttribute("aria-label") !== label) slot.setAttribute("aria-label", label);
  }

  function generalPartClass(formation, index) {
    const position = SLOT_LAYOUT[index];
    const otherIndex = formation.indexes.find(item => item !== index);
    const other = SLOT_LAYOUT[otherIndex];
    if (formation.orientation === "horizontal") return position[0] < other[0] ? "link-left" : "link-right";
    return position[1] < other[1] ? "link-top" : "link-bottom";
  }

  function renderGeneralFrames(formations) {
    const signature = formations.map(formation => `${formation.key}-${formation.level}-${formation.xp}-${attackingGeneralKeys.has(formation.key)}`).join("|");
    if (dom.generalFrames.dataset.signature === signature) return;
    dom.generalFrames.innerHTML = formations.map(formation => {
      const positions = formation.indexes.map(index => SLOT_LAYOUT[index]);
      const column = Math.min(...positions.map(position => position[0]));
      const row = Math.min(...positions.map(position => position[1]));
      const columnSpan = formation.orientation === "horizontal" ? 2 : 1;
      const rowSpan = formation.orientation === "vertical" ? 2 : 1;
      return `<div class="general-frame ${formation.orientation} general-${formation.id}${attackingGeneralKeys.has(formation.key) ? " attacking" : ""}"
        style="grid-column:${column} / span ${columnSpan};grid-row:${row} / span ${rowSpan}">
        <span class="general-frame-info"><strong>${formation.name}</strong><i><u style="width:${generalXpPercent(formation)}%"></u></i><b>${"★".repeat(formation.level)}</b></span>
      </div>`;
    }).join("");
    dom.generalFrames.dataset.signature = signature;
  }

  function renderGenerals(formations) {
    const byId = new Map(formations.map(formation => [formation.id, formation]));
    const signature = GENERAL_TYPES.map(general => {
      const formation = byId.get(general.id);
      return formation ? `${formation.key}-${formation.level}` : `${general.id}-sleep`;
    }).join("|");
    if (dom.generals.dataset.signature !== signature) {
      dom.generals.innerHTML = GENERAL_TYPES.map(general => {
        const formation = byId.get(general.id);
        return `<button class="general-skill general-${general.id}${formation ? " awake" : " sleeping"}" type="button"
          data-general-id="${general.id}"${formation ? ` data-general-key="${formation.key}"` : ""}
          aria-label="${formation ? `${general.name}，${general.skill}` : `${general.name}尚未合體`}">
          <span class="skill-glyph">${general.parts[0]}</span><small>${general.name}</small>
        </button>`;
      }).join("");
      dom.generals.dataset.signature = signature;
    }
    GENERAL_TYPES.forEach(general => {
      const formation = byId.get(general.id);
      const button = dom.generals.querySelector(`[data-general-id="${general.id}"]`);
      if (!button) return;
      const cooldown = state.generalCooldowns[general.id] ?? 0;
      const ready = cooldown <= 0;
      const progress = ready ? 100 : Math.max(0, (1 - cooldown / general.cooldown) * 100);
      button.style.setProperty("--skill-progress", `${progress}%`);
      button.disabled = !formation || !ready || !state.enemies.length;
      button.querySelector(".skill-glyph").textContent = formation && !ready ? String(Math.ceil(cooldown)) : general.parts[0];
      button.querySelector("small").textContent = formation ? general.skill : `${general.name}・沉睡`;
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
        setRenderedSlot(slot, "pocket-empty", `<span class="glyph">·</span><span class="label">等待刷新</span>`, `口袋 ${index + 1}，空`);
      } else if (item.kind === "shovel") {
        slot.className = `pocket-item shovel${dragging ? " drag-source" : ""}${dropTarget ? " drop-target" : ""}`;
        setRenderedSlot(slot, "pocket-shovel", `<span class="glyph">鏟</span><span class="label">拖到鎖定格</span>`, `口袋 ${index + 1}，鏟子，拖到鎖定格開地`);
      } else {
        slot.className = `pocket-item${dragging ? " drag-source" : ""}${dropTarget ? " drop-target" : ""}${selected ? " selected" : ""}`;
        setRenderedSlot(slot, `pocket-${item.glyph}-${item.level}`, `<span class="glyph">${item.glyph}</span><span class="label">${item.name}・${"★".repeat(item.level)}</span>`, `口袋 ${index + 1}，${item.name}，${item.level} 星，${selected ? "已選取，" : ""}可點擊或拖曳合體`);
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
      x: BOARD_LEFT + (column - 0.5) * (BOARD_WIDTH / BOARD_COLUMNS),
      y: BOARD_TOP + (row - 0.5) * (BOARD_HEIGHT / BOARD_ROWS)
    };
  }

  function generalPosition(formation) {
    const positions = formation.indexes.map(unitPosition);
    return {
      x: positions.reduce((sum, position) => sum + position.x, 0) / positions.length,
      y: positions.reduce((sum, position) => sum + position.y, 0) / positions.length
    };
  }

  function gridDistance(a, b) {
    return Math.hypot(
      (a.x - b.x) / (BOARD_WIDTH / BOARD_COLUMNS),
      (a.y - b.y) / (BOARD_HEIGHT / BOARD_ROWS)
    );
  }

  function formationGridDistance(formation, target) {
    return Math.min(...formation.indexes.map(index => gridDistance(unitPosition(index), target)));
  }

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
    showRangeIndicatorAt(unitPosition(index), unit.rangeCells);
  }

  function showRangeIndicatorAt(position, rangeCells, columnSpan = 0, rowSpan = 0) {
    dom.rangeIndicator.style.left = `${position.x}%`;
    dom.rangeIndicator.style.top = `${position.y}%`;
    dom.rangeIndicator.style.width = `${(rangeCells * 2 + columnSpan) * (BOARD_WIDTH / BOARD_COLUMNS)}%`;
    dom.rangeIndicator.style.height = `${(rangeCells * 2 + rowSpan) * (BOARD_HEIGHT / BOARD_ROWS)}%`;
    dom.rangeIndicator.classList.add("visible");
  }

  function showBoardRange(index, formations = activeGeneralFormations()) {
    const unit = state.units[index];
    if (!unit) return showRangeIndicator(null, null);
    const formation = formations.find(item => item.indexes.includes(index));
    if (!formation) return showRangeIndicator(unit, index);
    const stats = generalCombatStats(formation, formations);
    const [firstPosition, secondPosition] = formation.indexes.map(formationIndex => SLOT_LAYOUT[formationIndex]);
    showRangeIndicatorAt(
      generalPosition(formation),
      stats.rangeCells,
      Math.abs(firstPosition[0] - secondPosition[0]),
      Math.abs(firstPosition[1] - secondPosition[1])
    );
  }

  function openUnitModal(unit, index) {
    const formations = activeGeneralFormations();
    const linkedGeneral = Number.isInteger(index)
      ? formations.find(formation => formation.indexes.includes(index))
      : null;
    const sleeping = Boolean(unit.generalId && !linkedGeneral);
    const standbyGeneral = Boolean(sleeping && formations.some(formation => formation.id === unit.generalId));
    const stats = linkedGeneral ? generalCombatStats(linkedGeneral, formations) : combatStats(unit, formations, index);
    const xpDetail = linkedGeneral
      ? `<div class="unit-general-xp"><span><i style="width:${generalXpPercent(linkedGeneral)}%"></i></span><strong>${linkedGeneral.level >= MAX_LEVEL ? "經驗已滿" : `經驗 ${linkedGeneral.xp}/${generalXpNeeded(linkedGeneral.level)}`}</strong></div>`
      : "";
    dom.unitCardContent.innerHTML = `
      <h2 id="unit-modal-title" class="unit-card-title"><b class="${linkedGeneral ? "general-title-glyph" : ""}">${linkedGeneral?.name ?? unit.glyph}</b><span>${linkedGeneral?.name ?? unit.name}<small>${linkedGeneral ? `雙字武將・共同 ${linkedGeneral.level} 星` : `${unit.role}・${unit.level} 星`}</small></span></h2>
      <div class="attribute-grid">
        <div><span>攻擊力</span><strong>${sleeping ? "0（沉睡）" : stats.damage.toFixed(1)}</strong></div>
        <div><span>攻擊速度</span><strong>${sleeping ? "—" : `${stats.attackSpeed.toFixed(2)} 次／秒`}</strong></div>
        <div><span>攻擊距離</span><strong>${linkedGeneral ? stats.rangeCells : unit.rangeCells} 個文字格</strong></div>
        <div><span>攻擊效果</span><strong>${linkedGeneral ? stats.effect : unit.effect}</strong></div>
      </div>
      ${xpDetail}
      <p class="unit-card-note">${linkedGeneral
        ? `${linkedGeneral.passive}。擊殺敵軍會獲得經驗；把相同單字拖到對應文字也能增加經驗。拖走其中一字即可拆陣。`
        : unit.generalId
          ? standbyGeneral
            ? `💤 同名武將已有一組甦醒，因此這個文字維持沉睡、不能攻擊；可餵給已甦醒的武將增加經驗。`
            : `💤 沉睡中，單字不能攻擊；${unit.role}。上下或左右相鄰才會甦醒成將，斜角不算。`
          : "升星會提高攻擊力；相同文字與相同星級可以合成。"}</p>`;
    showBoardRange(index, formations);
    dom.unitModal.classList.remove("hidden");
  }

  function closeUnitModal() {
    dom.unitModal.classList.add("hidden");
    dom.rangeIndicator.classList.remove("visible");
  }

  function showStatus(message) { dom.status.textContent = message; }
  function enemyCountForWave(wave) { return 4 + wave; }

  applySelectedMap();
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
  dom.mapSelect.addEventListener("click", event => {
    const button = event.target.closest("[data-map-id]");
    if (!button) return;
    selectedMapId = button.dataset.mapId;
    applySelectedMap();
    buildBoard();
    state = freshState();
    renderPocket();
    render();
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
