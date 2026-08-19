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
  const GENERAL_XP_TO_NEXT = [0, 10, 18, 30, 45];
  const ENEMY_ELITES_AT = new Set([4, 7]);
  const ENEMY_COUNTS_BY_WAVE = [7, 9, 11, 12, 13, 14, 16, 17, 18, 13];
  const ENEMY_BASE_HEALTH_BY_WAVE = [50, 70, 100, 135, 180, 235, 300, 380, 480, 600];
  const CHAPTER_HEALTH_MULTIPLIER = { earth: 1.00, water: 1.08, fire: 1.16, metal: 1.25, wood: 1.35 };
  const ELEMENT_HEALTH_MULTIPLIER = { metal: 1.00, wood: 0.95, water: 1.00, fire: 0.90, earth: 1.15 };
  const ELEMENT_SPEED_MULTIPLIER = { metal: 0.94, wood: 1.00, water: 1.05, fire: 1.15, earth: 0.88 };
  const INITIAL_UNLOCKED = new Set([0, 1, 2, 3, 4, 5]);
  const UNIT_TYPES = [
    { kind: "unit", glyph: "刀", weapon: "刀", name: "刀兵", damage: 8, attackSpeed: 1.2, rangeCells: 1, effect: "單體", role: "近距快攻" },
    { kind: "unit", glyph: "槍", weapon: "槍", name: "槍兵", damage: 12, attackSpeed: 0.8, rangeCells: 2, effect: "穿透", role: "中距穿透" },
    { kind: "unit", glyph: "弓", weapon: "弓", name: "弓兵", damage: 6, attackSpeed: 1.6, rangeCells: 3, effect: "單體", role: "遠距連射" },
    { kind: "unit", glyph: "騎", weapon: "騎", name: "騎兵", damage: 18, attackSpeed: 0.55, rangeCells: 2, effect: "範圍", role: "中距範圍" }
  ];
  const GENERAL_TYPES = [
    { id: "guanyu", element: "wood", name: "關羽", parts: ["關", "羽"], skillGlyph: "關", weapons: ["刀"], rangeCells: 3,
      passive: "範圍清兵", skill: "龍嘯破軍", cooldown: 36, skillNote: "由關羽字陣向全場敵軍橫掃" },
    { id: "zhangfei", element: "earth", name: "張飛", parts: ["張", "飛"], skillGlyph: "張", weapons: ["槍"], rangeCells: 2,
      passive: "控場阻敵", skill: "當陽震岳", cooldown: 40, skillNote: "由張飛字陣沿敵軍路線擴散震波" },
    { id: "zhaoyun", element: "water", name: "趙雲", parts: ["趙", "雲"], skillGlyph: "趙", weapons: ["槍"], rangeCells: 3,
      passive: "快速穿透", skill: "游龍穿陣", cooldown: 30, skillNote: "由趙雲字陣依序穿過最前方 5 名敵軍" },
    { id: "machao", element: "metal", name: "馬超", parts: ["馬", "超"], skillGlyph: "馬", weapons: ["騎"], rangeCells: 3,
      passive: "範圍追擊", skill: "神威踏陣", cooldown: 32, skillNote: "由馬超字陣衝擊最前方 6 名敵軍並震退" },
    { id: "huangzhong", element: "fire", name: "黃忠", parts: ["黃", "忠"], skillGlyph: "黃", weapons: ["弓"], rangeCells: 4,
      passive: "菁英／首領狙擊", skill: "烈弓連珠", cooldown: 34, skillNote: "主箭與四支副箭優先集中菁英或首領" },
    { id: "lijing", element: "none", name: "李竟", parts: ["李", "竟"], skillGlyph: "竟", weapons: ["筆"], rangeCells: 3,
      passive: "守字初心：加快其他武將技能冷卻", skill: "萬字歸名", cooldown: 52,
      skillNote: "由李竟字陣向全場擴散金色墨水波紋；冷卻期間可施放偷天改字" }
  ];
  const GENERAL_SKILL_ART = {
    guanyu: "assets/vfx/guanyu-green-dragon.png",
    zhaoyun: "assets/vfx/zhaoyun-blue-dragon.png",
    zhangfei: "assets/vfx/zhangfei-golden-quake.png",
    machao: "assets/vfx/machao-white-tiger-v2.png",
    huangzhong: "assets/vfx/huangzhong-fire-arrow.png"
  };
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
    { kind: "unit", glyph: "忠", weapon: "弓", generalId: "huangzhong", name: "武將字・忠", damage: 9, attackSpeed: 1.15, rangeCells: 3, effect: "單體", role: "與「黃」相鄰可成將", attackKind: "bow" },
    { kind: "unit", glyph: "李", weapon: "筆", generalId: "lijing", name: "武將字・李", damage: 6, attackSpeed: 0.9, rangeCells: 3, effect: "單體", role: "與「竟」相鄰可成將", attackKind: "ink" },
    { kind: "unit", glyph: "竟", weapon: "筆", generalId: "lijing", name: "武將字・竟", damage: 6, attackSpeed: 0.9, rangeCells: 3, effect: "單體", role: "與「李」相鄰可成將", attackKind: "ink" }
  ];
  const SHOVEL = { kind: "shovel", glyph: "鏟", name: "鏟子" };
  const ENEMY_TYPES = {
    metal: { element: "金", commonGlyph: "甲", eliteGlyph: "鋼", eliteName: "鋼甲印", bossGlyph: "鎧", bossName: "鎧印首領" },
    wood: { element: "木", commonGlyph: "藤", eliteGlyph: "枝", eliteName: "纏枝印", bossGlyph: "森", bossName: "森印首領" },
    water: { element: "水", commonGlyph: "流", eliteGlyph: "漩", eliteName: "漩水印", bossGlyph: "潮", bossName: "潮印首領" },
    fire: { element: "火", commonGlyph: "炎", eliteGlyph: "焰", eliteName: "烈焰印", bossGlyph: "燼", bossName: "燼印首領" },
    earth: { element: "土", commonGlyph: "岩", eliteGlyph: "壘", eliteName: "岩壘印", bossGlyph: "岳", bossName: "岳印首領" }
  };
  const ENEMY_ART = {
    elite: {
      metal: "assets/enemies/elite-metal.png", wood: "assets/enemies/elite-wood.png",
      water: "assets/enemies/elite-water.png", fire: "assets/enemies/elite-fire.png",
      earth: "assets/enemies/elite-earth.png"
    },
    boss: {
      metal: "assets/enemies/boss-metal.png", wood: "assets/enemies/boss-wood.png",
      water: "assets/enemies/boss-water.png", fire: "assets/enemies/boss-fire.png",
      earth: "assets/enemies/boss-earth.png"
    }
  };
  const MAP_TYPES = [
    { id: "metal", element: "金", name: "鑄鐵關", background: "assets/maps/metal-forge.jpg",
      route: [[1,10],[5,10],[5,8],[2,8],[2,6],[7,6],[7,4],[4,4],[4,2],[8,2],[8,1]],
      slots: [[1,6],[1,7],[3,5],[4,5],[3,2],[3,3],[8,6],[8,5],[9,5],[4,11],[5,3],[6,3],[7,3],[9,2],[1,8],[9,1],[5,7],[6,7],[9,3],[1,9],[2,9],[3,9],[4,9],[5,11]] },
    { id: "wood", element: "木", name: "青藤林", background: "assets/maps/wood-grove.jpg",
      route: [[8,11],[8,10],[8,9],[8,8],[7,8],[6,8],[5,8],[4,8],[3,8],[2,8],[2,7],[2,6],[3,6],[3,5],[4,5],[5,5],[5,4],[5,3],[5,2],[4,2],[3,2],[2,2],[1,2],[1,1]],
      slots: [[2,3],[2,4],[3,3],[3,4],[4,3],[4,4],[2,9],[2,5],[2,1],[3,9],[3,7],[3,1],[4,9],[4,7],[4,6],[4,1],[5,9],[5,7],[5,6],[5,1],[6,5],[6,4],[7,7],[8,7]] },
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
    unitClose: document.querySelector("#unit-close"), unitCardContent: document.querySelector("#unit-card-content"),
    skipTurn: document.querySelector("#skip-turn"), pauseGame: document.querySelector("#pause-game")
  };

  let state;
  let lastFrame = 0;
  let rafId = 0;
  let pointerDrag = null;
  let dragGhost = null;
  let currentDropTarget = null;
  let selectedPocketIndex = null;
  let lastBoardTap = null;
  let combatArtPreloaded = false;
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
      food: 25, baseHealth: 3, wave: 1, wavePending: enemyCountForWave(1), defeated: 0,
      refreshCount: 0, spawnClock: 0, intermission: 0,
      generalCooldowns: {}, activeGeneralKeys: new Set(), skillActivationOrder: [],
      lijingStealUsed: false, lijingUnlocked: false, paused: false,
      running: false, over: false, won: false
    };
  }

  function isInteractive() {
    return state?.running && !state?.over && !state?.paused;
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
    state.paused = false;
    state.running = true;
    state.spawnClock = 0.8;
    lastFrame = performance.now();
    closeUnitModal();
    dom.overlay.classList.add("hidden");
    showStatus("先召喚文字；可直接拖到戰鬥格，或先點文字再點格子部署。");
    renderPocket();
    render();
    preloadCombatArt();
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(tick);
  }

  function preloadCombatArt() {
    if (combatArtPreloaded) return;
    combatArtPreloaded = true;
    const sources = [
      ...Object.values(GENERAL_SKILL_ART),
      ...Object.values(ENEMY_ART).flatMap(rank => Object.values(rank))
    ];
    sources.forEach(source => {
      const image = new Image();
      image.decoding = "async";
      image.src = source;
    });
  }

  function tick(now) {
    if (!state.running) return;
    if (state.paused) {
      lastFrame = now;
      rafId = requestAnimationFrame(tick);
      return;
    }
    const delta = Math.min((now - lastFrame) / 1000, 0.1);
    lastFrame = now;
    state.spawnClock += delta;
    const activeLi = activeGeneralFormations().find(formation => formation.id === "lijing");
    const beginnerRates = [0, 0.05, 0.06, 0.08, 0.10, 0.12];
    Object.keys(state.generalCooldowns).forEach(key => {
      const passiveRate = activeLi && key !== "lijing" ? beginnerRates[activeLi.level] : 0;
      state.generalCooldowns[key] = Math.max(0, state.generalCooldowns[key] - delta * (1 + passiveRate));
    });
    updateEnemies(delta);
    updateSpawning(delta);
    updateUnitAttacks(delta);
    render();
    if (state.running) rafId = requestAnimationFrame(tick);
  }

  function refreshPocket() {
    if (!isInteractive()) return;
    if (state.food < REFRESH_COST) {
      showStatus("軍餉不足；請擊敗敵軍、守住整波，或復活後繼續挑戰。");
      return;
    }
    state.food -= REFRESH_COST;
    selectedPocketIndex = null;
    state.refreshCount += 1;
    state.pocket = Array.from({ length: POCKET_SIZE }, () => {
      const availableGeneralParts = state.lijingUnlocked
        ? GENERAL_PARTS
        : GENERAL_PARTS.filter(part => part.generalId !== "lijing");
      const pool = Math.random() < 0.42 ? availableGeneralParts : UNIT_TYPES;
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
      ? "召喚完成！出現鏟子，把它拖到鎖定格即可開地。"
      : state.refreshCount === 1
        ? "首次召喚出現兩組「趙、雲」；先組成趙雲，再把額外的趙或雲拖到武將的相同文字上增加經驗。"
        : "召喚完成！武將字上下或左右相鄰，就能組成武將。");
  }

  function togglePause() {
    if (!state?.running || state.over) return;
    state.paused = !state.paused;
    if (state.paused) {
      showStatus("遊戲已暫停，按「繼續」可回到戰鬥。");
    } else {
      lastFrame = performance.now();
      showStatus("遊戲繼續。");
    }
    render();
  }

  function skipWaiting() {
    if (!isInteractive()) return;
    if (state.wavePending > 0) {
      state.wavePending = 0;
      showStatus(`已跳過第 ${state.wave} 波剩餘生成。`);
      render();
      return;
    }
    if (state.intermission <= 0) {
      showStatus("目前沒有可跳過的等待時間。");
      return;
    }
    state.intermission = 0;
    showStatus(`已跳過第 ${state.wave} 波等待時間。`);
    render();
  }

  function inspectBoardSlot(index) {
    if (!isInteractive()) return;
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
    if (!isInteractive()) return;
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
    if (!isInteractive()) return;
    const item = state.pocket[index];
    if (!item) {
      showStatus("這個口袋位置已經使用，下次召喚會補上新內容。");
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
      if (canUseSameOrigin(source, targetFormation)) {
        const sourcePoint = unitPosition(from);
        state.units[from] = null;
        const result = addGeneralExperience(targetFormation, 2);
        animateLijingSameOrigin(sourcePoint, targetFormation);
        showStatus(experienceGainMessage(targetFormation.name, result, `「${source.glyph}」化為無名墨後被吸收`));
        render();
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
      if (canUseSameOrigin(item, targetFormation)) {
        state.pocket[pocketIndex] = null;
        const result = addGeneralExperience(targetFormation, 2);
        animateLijingSameOrigin(generalPosition(activeGeneralFormations().find(formation => formation.id === "lijing")), targetFormation);
        showStatus(experienceGainMessage(targetFormation.name, result, `「${item.glyph}」化為無名墨後被吸收`));
        renderPocket();
        render();
        return;
      }
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

  function canUseSameOrigin(source, targetFormation) {
    const li = activeGeneralFormations().find(formation => formation.id === "lijing");
    return Boolean(li && li.level >= 3 && source?.generalId === "lijing"
      && targetFormation.id !== "lijing" && ["李", "竟"].includes(source.glyph));
  }

  function animateLijingSameOrigin(from, targetFormation) {
    const to = generalPosition(targetFormation);
    createSkillOrigin(from, "lijing-origin");
    createSkillTrail(from, to, "lijing-origin", 0, "main");
    window.setTimeout(() => createImpactEffect(to, "lijing"), 320);
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
      showStatus("這個口袋位置是空的，下次召喚會補上新內容。");
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
    if (!isInteractive()) return;
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
        if (target?.area === "lijing-skill") useLijingSteal("board", drag.index);
        else if (target?.area === "board" && target.index !== drag.index) {
          if (!tryCombineGeneralFormations(drag.index, target.index)) moveOrCombine(drag.index, target.index);
        }
        else if (target?.area === "pocket") returnBoardUnitToPocket(drag.index, target.index);
        else showStatus("沒有放到其他格子，文字回到原位。");
      } else if (target?.area === "lijing-skill") {
        useLijingSteal("pocket", drag.index);
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
    const liSkill = element?.closest?.(".general-skill.general-lijing.steal-ready");
    if (liSkill) return { area: "lijing-skill", index: -1 };
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
    if (target.area === "lijing-skill") return dom.generals.querySelector(".general-skill.general-lijing");
    return target.area === "board"
      ? dom.board.querySelector(`.slot[data-index="${target.index}"]`)
      : dom.pocket.querySelector(`.pocket-item[data-index="${target.index}"]`);
  }

  function useLijingSteal(sourceArea, sourceIndex) {
    const li = activeGeneralFormations().find(formation => formation.id === "lijing");
    const item = dragItem(sourceArea, sourceIndex);
    if (!li || (state.generalCooldowns.lijing ?? 0) <= 0 || state.lijingStealUsed) {
      showStatus("偷天改字目前不能使用。");
      return;
    }
    if (!item || item.kind !== "unit" || item.generalId || item.level < 2) {
      showStatus("偷天改字只能選擇 2 星以上的基礎文字。");
      return;
    }
    const originalGlyph = item.glyph;
    let transformed;
    if (Math.random() < 0.6) {
      const choices = UNIT_TYPES.filter(type => type.glyph !== item.glyph);
      transformed = { ...choices[Math.floor(Math.random() * choices.length)], level: item.level, cooldown: 0, alteredByLijing: true };
    } else {
      const unlockedParts = GENERAL_PARTS.filter(part => part.generalId !== "lijing");
      transformed = { ...unlockedParts[Math.floor(Math.random() * unlockedParts.length)], level: 1, cooldown: 0,
        wordEssence: [0, 0, 6, 12, 24, 45][item.level], alteredByLijing: true };
    }
    if (sourceArea === "board") state.units[sourceIndex] = transformed;
    else state.pocket[sourceIndex] = transformed;
    state.lijingStealUsed = true;
    const from = sourceArea === "board" ? unitPosition(sourceIndex) : generalPosition(li);
    animateLijingSteal(from, originalGlyph, transformed.glyph);
    showStatus(`偷天改字：「${originalGlyph}」化為「${transformed.glyph}」。`);
    renderPocket();
    render();
  }

  function animateLijingSteal(from, originalGlyph, resultGlyph) {
    const change = document.createElement("span");
    change.className = "lijing-word-change";
    change.style.left = `${from.x}%`;
    change.style.top = `${from.y}%`;
    change.innerHTML = `<i>${originalGlyph}</i><b>無</b><em>${resultGlyph}</em>`;
    dom.attackFx.append(change);
    removeSkillEffectLater(change, 1900);
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
      const spawnInterval = [1.8, 1.8, 1.8, 1.55, 1.55, 1.55, 1.35, 1.35, 1.35, 1.3][state.wave - 1];
      const effectiveInterval = state.enemies.length ? spawnInterval : Math.min(spawnInterval, 0.5);
      if (state.spawnClock >= effectiveInterval) {
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
      state.food += 3;
      showStatus(`第 ${state.wave} 波守住了！獎勵 3 個軍餉。`);
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
    const spawnNumber = enemyCountForWave(state.wave) - state.wavePending + 1;
    const boss = state.wave === 10 && spawnNumber === 4;
    const elite = !boss && (state.wave === 4 && spawnNumber === 6 || state.wave === 7 && [6, 12].includes(spawnNumber));
    const rank = boss ? "boss" : elite ? "elite" : "normal";
    const enemyType = ENEMY_TYPES[selectedMapId] ?? ENEMY_TYPES.metal;
    const waveHealth = ENEMY_BASE_HEALTH_BY_WAVE[state.wave - 1];
    const healthMultiplier = boss ? 8 : elite ? 3 : 1;
    const speedMultiplier = (boss ? 0.72 : elite ? 0.92 : 1) * ELEMENT_SPEED_MULTIPLIER[selectedMapId];
    const maxHealth = Math.round(waveHealth * CHAPTER_HEALTH_MULTIPLIER[selectedMapId] * ELEMENT_HEALTH_MULTIPLIER[selectedMapId] * healthMultiplier);
    const enemy = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      name: boss ? enemyType.bossName : elite ? enemyType.eliteName : "蝕墨兵",
      glyph: boss ? enemyType.bossGlyph : elite ? enemyType.eliteGlyph : enemyType.commonGlyph,
      element: selectedMapId, rank, health: maxHealth, maxHealth, progress: 0,
      speed: (0.0305 + state.wave * 0.0018) * speedMultiplier,
      reward: boss ? 10 : elite ? 3 : 1,
      boss, elite, hitUntil: 0
    };
    state.enemies.push(enemy);
    if (rank !== "normal") animateEnemyArrival(enemy);
  }

  function updateEnemies(delta) {
    for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = state.enemies[i];
      if ((enemy.stunnedUntil ?? 0) > performance.now()) continue;
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
    const activeIds = new Set(formations.map(formation => formation.id));
    state.skillActivationOrder = (state.skillActivationOrder ?? []).filter(id => activeIds.has(id));
    formations.forEach(formation => {
      if (!state.skillActivationOrder.includes(formation.id)) state.skillActivationOrder.push(formation.id);
    });
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
    const effectByGeneral = { zhaoyun: "穿透", guanyu: "範圍", zhangfei: "控場", machao: "範圍", huangzhong: "單體", lijing: "輔助" };
    const attackByGeneral = { zhaoyun: "spear", guanyu: "blade", zhangfei: "spear", machao: "cavalry", huangzhong: "bow", lijing: "ink" };
    return {
      damage: partStats.reduce((sum, stats) => sum + stats.damage, 0),
      attackSpeed: partStats.reduce((sum, stats) => sum + stats.attackSpeed, 0) / partStats.length,
      rangeCells: formation.rangeCells,
      effect: effectByGeneral[formation.id] ?? "單體",
      attackKind: attackByGeneral[formation.id] ?? "ink"
    };
  }

  function useGeneralSkill(key) {
    if (!isInteractive()) return;
    const formation = activeGeneralFormations().find(item => item.key === key);
    if (!formation) {
      showStatus("武將字陣已拆開，請重新把兩個字放在一起。");
      render();
      return;
    }
    const cooldown = state.generalCooldowns[formation.id] ?? 0;
    if (cooldown > 0) {
      if (formation.id === "lijing" && !state.lijingStealUsed) {
        showStatus("萬字歸名冷卻中：可將 2 星以上基礎文字拖到「竟」施放偷天改字。");
      }
      return;
    }
    if (!state.enemies.length && formation.id !== "lijing") {
      showStatus("目前沒有敵軍，先保留武將技。");
      return;
    }
    const ordered = state.enemies.slice().sort((a, b) => b.progress - a.progress);
    const baseDamage = generalCombatStats(formation).damage;
    let visualTargets = [];
    if (formation.id === "guanyu") {
      visualTargets = ordered;
      visualTargets.forEach(enemy => applyDamage(enemy, baseDamage * 2.6));
    } else if (formation.id === "zhangfei") {
      visualTargets = ordered;
      visualTargets.forEach(enemy => {
        applyDamage(enemy, baseDamage * 1.9);
        enemy.stunnedUntil = performance.now() + (enemy.boss ? 500 : 1200);
      });
    } else if (formation.id === "zhaoyun") {
      visualTargets = ordered.slice(0, 5);
      visualTargets.forEach(enemy => applyDamage(enemy, baseDamage * 3.2));
    } else if (formation.id === "machao") {
      visualTargets = ordered.slice(0, 6);
      visualTargets.forEach(enemy => {
        applyDamage(enemy, baseDamage * 2.3);
        enemy.progress = Math.max(0, enemy.progress - 0.025);
      });
    } else if (formation.id === "huangzhong") {
      const priority = ordered.find(enemy => enemy.boss)
        ?? ordered.find(enemy => enemy.elite)
        ?? ordered[0];
      const secondaryTargets = priority?.boss || priority?.elite
        ? Array(4).fill(priority)
        : ordered.slice(1, 5);
      visualTargets = priority ? [priority, ...secondaryTargets] : [];
      if (priority) applyDamage(priority, baseDamage * 4.5);
      secondaryTargets.forEach(enemy => applyDamage(enemy, baseDamage * 1.3));
    } else if (formation.id === "lijing") {
      state.enemies.forEach(enemy => { enemy.removableStatus = null; });
      visualTargets = [];
      state.lijingStealUsed = false;
    }
    const starCooldownMultiplier = [1, 1, 0.96, 0.92, 0.88, 0.84][formation.level] ?? 1;
    state.generalCooldowns[formation.id] = formation.cooldown * starCooldownMultiplier;
    animateGeneralSkill(formation, visualTargets);
    const defeated = collectDefeatedEnemies(formation);
    showStatus(`${formation.name}施放「${formation.skill}」！${defeated.message ? ` ${defeated.message}` : ""}`);
    render();
  }

  function animateGeneralSkill(formation, targets = []) {
    const from = generalPosition(formation);
    createSkillOrigin(from, formation.id);
    if (formation.id === "lijing") {
      animateLijingRipple(from);
    } else if (formation.id === "zhangfei") {
      createEarthRipples(from);
      targets.forEach((enemy, index) => {
        const to = routePoint(enemy.progress);
        createSkillTrail(from, to, formation.id, index * 45);
        window.setTimeout(() => createImpactEffect(to, formation.id), 240 + index * 45);
      });
    } else if (formation.id === "huangzhong") {
      createHuangVolley(from, targets.map(enemy => routePoint(enemy.progress)));
      targets.forEach((enemy, index) => {
        window.setTimeout(() => createImpactEffect(routePoint(enemy.progress), formation.id), 300 + index * 55);
      });
    } else {
      targets.forEach((enemy, index) => {
        const to = routePoint(enemy.progress);
        createSkillTrail(from, to, formation.id, index * 55, index === 0 ? "main" : "secondary");
        window.setTimeout(() => createImpactEffect(to, formation.id), 290 + index * 55);
      });
      const farthest = targets[0];
      if (["guanyu", "zhaoyun", "machao"].includes(formation.id) && farthest) {
        createSkillSpirit(from, routePoint(farthest.progress), formation.id);
      }
    }
    dom.battlefield.classList.add("skill-casting", `skill-${formation.id}`);
    attackingGeneralKeys.add(formation.key);
    renderBoard(activeGeneralFormations());
    renderGeneralFrames(activeGeneralFormations());
    if (!document.body.classList.contains("skill-preview-capture")) window.setTimeout(() => {
      dom.battlefield.classList.remove("skill-casting", `skill-${formation.id}`);
      attackingGeneralKeys.delete(formation.key);
      if (state) {
        const formations = activeGeneralFormations();
        renderBoard(formations);
        renderGeneralFrames(formations);
      }
    }, 1500);
  }

  function battlefieldPixelPoint(point) {
    const rect = dom.battlefield.getBoundingClientRect();
    return { x: rect.width * point.x / 100, y: rect.height * point.y / 100 };
  }

  function createSkillOrigin(point, generalId) {
    const origin = document.createElement("span");
    origin.className = `skill-origin ${generalId}`;
    origin.style.left = `${point.x}%`;
    origin.style.top = `${point.y}%`;
    dom.attackFx.append(origin);
    removeSkillEffectLater(origin, 1700);
  }

  function createSkillTrail(from, to, generalId, delay = 0, weight = "secondary") {
    const start = battlefieldPixelPoint(from);
    const end = battlefieldPixelPoint(to);
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const trail = document.createElement("span");
    trail.className = `skill-trail ${generalId} ${weight}`;
    trail.style.left = `${start.x}px`;
    trail.style.top = `${start.y}px`;
    trail.style.width = `${Math.hypot(dx, dy)}px`;
    trail.style.setProperty("--trail-angle", `${Math.atan2(dy, dx) * 180 / Math.PI}deg`);
    trail.style.setProperty("--trail-delay", `${delay}ms`);
    dom.attackFx.append(trail);
    removeSkillEffectLater(trail, 1750 + delay);
  }

  function createSkillSpirit(from, to, generalId) {
    const start = battlefieldPixelPoint(from);
    const end = battlefieldPixelPoint(to);
    const spirit = document.createElement("img");
    spirit.className = `skill-spirit ${generalId}`;
    spirit.src = GENERAL_SKILL_ART[generalId];
    spirit.alt = "";
    spirit.style.left = `${start.x}px`;
    spirit.style.top = `${start.y}px`;
    spirit.style.setProperty("--spirit-x", `${end.x - start.x}px`);
    spirit.style.setProperty("--spirit-y", `${end.y - start.y}px`);
    spirit.style.setProperty("--spirit-angle", `${Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI}deg`);
    dom.attackFx.append(spirit);
    removeSkillEffectLater(spirit, 1700);
  }

  function createHuangVolley(from, targetPoints) {
    const rect = dom.battlefield.getBoundingClientRect();
    const start = battlefieldPixelPoint(from);
    const offsets = [-52, -25, 0, 25, 52];
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("huang-volley-path");
    svg.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`);
    svg.setAttribute("aria-hidden", "true");
    targetPoints.forEach((point, index) => {
      const end = battlefieldPixelPoint(point);
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const length = Math.max(1, Math.hypot(dx, dy));
      const normalX = -dy / length;
      const normalY = dx / length;
      const offset = offsets[index] ?? 0;
      const controlX = (start.x + end.x) / 2 + normalX * offset;
      const controlY = (start.y + end.y) / 2 + normalY * offset;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`);
      path.classList.add(index === 0 ? "main" : "secondary");
      path.style.setProperty("--arrow-delay", `${index * 70}ms`);
      svg.append(path);
    });
    dom.attackFx.append(svg);
    removeSkillEffectLater(svg, 1900);
  }

  function createEarthRipples(from) {
    for (let index = 0; index < 3; index += 1) {
      const ripple = document.createElement("span");
      ripple.className = `skill-ripple zhangfei ring-${index + 1}`;
      ripple.style.left = `${from.x}%`;
      ripple.style.top = `${from.y}%`;
      ripple.style.setProperty("--ripple-delay", `${index * 150}ms`);
      dom.attackFx.append(ripple);
      removeSkillEffectLater(ripple, 1800);
    }
  }

  function animateLijingRipple(from) {
    dom.battlefield.classList.add("lijing-cleansing");
    for (let index = 0; index < 5; index += 1) {
      const ripple = document.createElement("span");
      ripple.className = `skill-ripple lijing ring-${index + 1}`;
      ripple.style.left = `${from.x}%`;
      ripple.style.top = `${from.y}%`;
      ripple.style.setProperty("--ripple-delay", `${index * 120}ms`);
      dom.attackFx.append(ripple);
      removeSkillEffectLater(ripple, 1950);
    }
    [...dom.board.querySelectorAll(".slot")].forEach((slot, index) => {
      if (!state.unlocked[index]) return;
      window.setTimeout(() => slot.classList.add("lijing-cleansed"), 320 + index * 22);
      if (!document.body.classList.contains("skill-preview-capture")) window.setTimeout(() => slot.classList.remove("lijing-cleansed"), 1500);
    });
    if (!document.body.classList.contains("skill-preview-capture")) window.setTimeout(() => dom.battlefield.classList.remove("lijing-cleansing"), 1700);
  }

  function removeSkillEffectLater(element, delay) {
    if (!document.body.classList.contains("skill-preview-capture")) window.setTimeout(() => element.remove(), delay);
  }

  function updateUnitAttacks(delta) {
    const formations = activeGeneralFormations();
    const rangeMetrics = battlefieldRangeMetrics();
    const linkedIndexes = new Set(formations.flatMap(formation => formation.indexes));
    state.units.forEach((unit, unitIndex) => {
      if (!unit || unit.generalId || linkedIndexes.has(unitIndex)) return;
      unit.cooldown = Math.max(0, (unit.cooldown ?? 0) - delta);
      if (unit.cooldown > 0) return;
      const eligible = state.enemies
        .map(enemy => ({ enemy }))
        .filter(item => rangeDistanceInCells(unitPosition(unitIndex), routePoint(item.enemy.progress), rangeMetrics) <= unit.rangeCells)
        .sort((a, b) => b.enemy.progress - a.enemy.progress);
      if (!eligible.length) return;
      const stats = combatStats(unit, formations);
      const damage = stats.damage;
      animateUnitAttack(unitIndex, unit, eligible[0].enemy);
      applyDamage(eligible[0].enemy, damage, unitAttackKind(unit));
      if (unit.effect === "穿透" && eligible[1]) applyDamage(eligible[1].enemy, damage * 0.45, unitAttackKind(unit));
      if (unit.effect === "範圍") {
        for (const nearby of eligible.slice(1, 3)) applyDamage(nearby.enemy, damage * 0.5, unitAttackKind(unit));
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
        .filter(item => rangeDistanceInCells(generalPosition(formation), routePoint(item.enemy.progress), rangeMetrics) <= stats.rangeCells)
        .sort((a, b) => b.enemy.progress - a.enemy.progress);
      if (!eligible.length) return;
      animateGeneralAttack(formation, eligible[0].enemy, stats.attackKind);
      applyDamage(eligible[0].enemy, stats.damage, stats.attackKind);
      if (stats.effect === "穿透" && eligible[1]) applyDamage(eligible[1].enemy, stats.damage * 0.45, stats.attackKind);
      if (stats.effect === "範圍") {
        for (const nearby of eligible.slice(1, 4)) applyDamage(nearby.enemy, stats.damage * 0.5, stats.attackKind);
      }
      const nextCooldown = 1 / stats.attackSpeed;
      parts.forEach(unit => { unit.cooldown = nextCooldown; });
      collectDefeatedEnemies(formation);
    });
  }

  function applyDamage(enemy, amount, hitKind = "ink") {
    enemy.health -= amount;
    enemy.hitKind = hitKind;
    enemy.lastDamage = Math.max(1, Math.round(amount));
    enemy.hitUntil = performance.now() + 320;
  }

  function collectDefeatedEnemies(killerFormation = null) {
    let defeatedCount = 0;
    let totalReward = 0;
    for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = state.enemies[i];
      if (enemy.health > 0) continue;
      animateEnemyDefeat(enemy);
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
      : `你守到第 ${state.wave} 波，擊敗 ${state.defeated} 名敵軍。再試著保留軍餉召喚與開地。`;
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
    dom.refresh.disabled = !isInteractive() || state.food < REFRESH_COST;
    if (dom.skipTurn) {
      dom.skipTurn.disabled = !state.running || state.over || !state.intermission && state.wavePending <= 0;
    }
    if (dom.pauseGame) {
      dom.pauseGame.disabled = !state.running || state.over;
      dom.pauseGame.textContent = state.paused ? "繼續" : "暫停";
    }
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
        <span class="general-frame-info"><b>${"★".repeat(formation.level)}</b><strong>${formation.name}</strong><i><u style="width:${generalXpPercent(formation)}%"></u></i></span>
      </div>`;
    }).join("");
    dom.generalFrames.dataset.signature = signature;
  }

  function renderGenerals(formations) {
    const byId = new Map(formations.map(formation => [formation.id, formation]));
    const liActive = byId.has("lijing");
    const capacity = state.lijingUnlocked ? 6 : 5;
    const orderedIds = [...(state.skillActivationOrder ?? [])].filter(id => byId.has(id));
    formations.forEach(formation => {
      if (!orderedIds.includes(formation.id)) orderedIds.push(formation.id);
    });
    const visibleGenerals = orderedIds.map(id => GENERAL_TYPES.find(general => general.id === id)).filter(Boolean);
    dom.generals.classList.toggle("has-lijing", state.lijingUnlocked);
    const signature = `${capacity}|` + visibleGenerals.map(general => {
      const formation = byId.get(general.id);
      return `${formation.key}-${formation.level}`;
    }).join("|");
    if (dom.generals.dataset.signature !== signature) {
      const activeButtons = visibleGenerals.map(general => {
        const formation = byId.get(general.id);
        return `<button class="general-skill general-${general.id} awake${liActive && general.id !== "lijing" ? " beginner-blessed" : ""}" type="button"
          data-general-id="${general.id}" data-general-key="${formation.key}"
          aria-label="${general.name}，${general.skill}">
          <span class="skill-glyph">${general.skillGlyph}</span><small>${general.skill}</small>
        </button>`;
      }).join("");
      const emptyButtons = Array.from({ length: Math.max(0, capacity - visibleGenerals.length) }, () =>
        `<button class="general-skill empty" type="button" disabled aria-label="未使用技能槽"></button>`
      ).join("");
      dom.generals.innerHTML = activeButtons + emptyButtons;
      dom.generals.dataset.signature = signature;
    }
    visibleGenerals.forEach(general => {
      const formation = byId.get(general.id);
      const button = dom.generals.querySelector(`[data-general-id="${general.id}"]`);
      if (!button) return;
      const cooldown = state.generalCooldowns[general.id] ?? 0;
      const ready = cooldown <= 0;
      const progress = ready ? 100 : Math.max(0, (1 - cooldown / general.cooldown) * 100);
      button.style.setProperty("--skill-progress", `${progress}%`);
      const stealReady = general.id === "lijing" && formation && !ready && !state.lijingStealUsed;
      button.classList.toggle("steal-ready", Boolean(stealReady));
      button.disabled = !formation || (!ready && !stealReady) || (general.id !== "lijing" && !state.enemies.length);
      button.querySelector(".skill-glyph").textContent = general.skillGlyph;
      button.querySelector("small").textContent = stealReady ? "偷天改字" : general.skill;
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
        setRenderedSlot(slot, "pocket-empty", `<span class="glyph">·</span><span class="label">等待召喚</span>`, `口袋 ${index + 1}，空`);
      } else if (item.kind === "shovel") {
        slot.className = `pocket-item shovel${dragging ? " drag-source" : ""}${dropTarget ? " drop-target" : ""}`;
        setRenderedSlot(slot, "pocket-shovel", `<img class="shovel-icon" src="assets/items/golden-shovel.png" alt=""><span class="label">拖到鎖定格</span>`, `口袋 ${index + 1}，金色鏟子，拖到鎖定格開地`);
      } else {
        slot.className = `pocket-item${dragging ? " drag-source" : ""}${dropTarget ? " drop-target" : ""}${selected ? " selected" : ""}`;
        setRenderedSlot(slot, `pocket-${item.glyph}-${item.level}`, `<span class="glyph">${item.glyph}</span><span class="label">${item.name}・${"★".repeat(item.level)}</span>`, `口袋 ${index + 1}，${item.name}，${item.level} 星，${selected ? "已選取，" : ""}可點擊或拖曳合體`);
      }
    });
  }

  function renderEnemies() {
    dom.emptyLane.hidden = state.enemies.length > 0;
    dom.enemies.innerHTML = state.enemies.slice().sort((a, b) => b.progress - a.progress).map((enemy, index) => {
      const hp = Math.max(0, Math.min(100, enemy.health / enemy.maxHealth * 100));
      const point = routePoint(enemy.progress);
      const y = Math.max(8, Math.min(92, point.y + (index % 3 - 1) * 2.5));
      const isHit = enemy.hitUntil > performance.now();
      const hit = isHit ? ` hit hit-${enemy.hitKind ?? "ink"}` : "";
      const stunned = (enemy.stunnedUntil ?? 0) > performance.now() ? " stunned" : "";
      const removable = enemy.removableStatus ? `<em class="enemy-status">${enemy.removableStatus}</em>` : "";
      const art = enemyArtSource(enemy);
      return `<div class="enemy-token ${enemy.rank} element-${enemy.element}${hit}${stunned}" style="--enemy-x:${point.x}%;--enemy-y:${y}%" aria-label="${enemy.name}，距離軍旗 ${Math.round((1 - enemy.progress) * 100)}%">
        <span class="enemy-aura"></span>${art ? `<img class="enemy-art" src="${art}" alt="">` : ""}${removable}<strong>${enemy.glyph}</strong>${isHit ? `<span class="enemy-hit-mark"><i></i><b></b><em></em><u>-${enemy.lastDamage ?? 0}</u></span>` : ""}<span class="token-health"><i style="width:${hp}%"></i></span>
        <small>${enemy.rank === "boss" ? "首領" : enemy.rank === "elite" ? "菁英" : Math.ceil(enemy.health)}</small></div>`;
    }).join("");
  }

  function enemyArtSource(enemy) {
    return ENEMY_ART[enemy.rank]?.[enemy.element] ?? "";
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

  function battlefieldRangeMetrics() {
    const rect = dom.battlefield.getBoundingClientRect();
    const cellWidth = rect.width * (BOARD_WIDTH / 100) / BOARD_COLUMNS;
    const cellHeight = rect.height * (BOARD_HEIGHT / 100) / BOARD_ROWS;
    return { width: rect.width, height: rect.height, cellSize: Math.max(cellWidth, cellHeight) };
  }

  function rangeDistanceInCells(a, b, metrics = battlefieldRangeMetrics()) {
    const dx = (a.x - b.x) / 100 * metrics.width;
    const dy = (a.y - b.y) / 100 * metrics.height;
    return Math.hypot(dx, dy) / metrics.cellSize;
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
    removeSkillEffectLater(impact, 480);
  }

  function animateEnemyArrival(enemy) {
    const effect = document.createElement("div");
    effect.className = `enemy-arrival ${enemy.rank} element-${enemy.element}`;
    const art = enemyArtSource(enemy);
    effect.innerHTML = `<small>${enemy.rank === "boss" ? "首領來襲" : "菁英現身"}</small><span class="arrival-emblem">${art ? `<img src="${art}" alt="">` : ""}<strong>${enemy.glyph}</strong></span><b>${enemy.name}</b>`;
    dom.attackFx.append(effect);
    window.setTimeout(() => effect.remove(), 1550);
  }

  function animateEnemyDefeat(enemy) {
    if (enemy.rank === "normal") return;
    const point = routePoint(enemy.progress);
    const effect = document.createElement("span");
    effect.className = `enemy-defeat ${enemy.rank} element-${enemy.element}`;
    effect.style.left = `${point.x}%`;
    effect.style.top = `${point.y}%`;
    effect.innerHTML = `<img class="enemy-defeat-art" src="${enemyArtSource(enemy)}" alt=""><i>${enemy.glyph}</i><b></b><em></em><u></u>`;
    dom.attackFx.append(effect);
    window.setTimeout(() => effect.remove(), 1050);
  }

  function showRangeIndicator(unit, index) {
    if (!unit || !Number.isInteger(index)) {
      dom.rangeIndicator.classList.remove("visible");
      return;
    }
    showRangeIndicatorAt(unitPosition(index), unit.rangeCells);
  }

  function showRangeIndicatorAt(position, rangeCells) {
    const diameter = rangeCells * 2 * battlefieldRangeMetrics().cellSize;
    dom.rangeIndicator.style.left = `${position.x}%`;
    dom.rangeIndicator.style.top = `${position.y}%`;
    dom.rangeIndicator.style.width = `${diameter}px`;
    dom.rangeIndicator.style.height = `${diameter}px`;
    dom.rangeIndicator.classList.add("visible");
  }

  function showBoardRange(index, formations = activeGeneralFormations()) {
    const unit = state.units[index];
    if (!unit) return showRangeIndicator(null, null);
    const formation = formations.find(item => item.indexes.includes(index));
    if (!formation) return showRangeIndicator(unit, index);
    const stats = generalCombatStats(formation, formations);
    showRangeIndicatorAt(generalPosition(formation), stats.rangeCells);
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
  function enemyCountForWave(wave) { return ENEMY_COUNTS_BY_WAVE[wave - 1] ?? 0; }

  function previewUnit(glyph, level = 5) {
    const template = GENERAL_PARTS.find(part => part.glyph === glyph)
      ?? UNIT_TYPES.find(part => part.glyph === glyph);
    return template ? { ...template, level, cooldown: 0, generalXp: 0 } : null;
  }

  function placePreviewGeneral(generalId, indexes, level = 5) {
    const general = GENERAL_TYPES.find(item => item.id === generalId);
    if (!general) return;
    const readingOrder = indexes.slice().sort((a, b) => {
      const [aColumn, aRow] = SLOT_LAYOUT[a];
      const [bColumn, bRow] = SLOT_LAYOUT[b];
      return aRow - bRow || aColumn - bColumn;
    });
    readingOrder.forEach((index, partIndex) => {
      state.unlocked[index] = true;
      state.units[index] = previewUnit(general.parts[partIndex], level);
    });
  }

  function previewEnemy(progress, rank = "normal", element = selectedMapId) {
    const enemyType = ENEMY_TYPES[element];
    return {
      id: `preview-${rank}-${progress}`,
      name: rank === "boss" ? enemyType.bossName : rank === "elite" ? enemyType.eliteName : "蝕墨兵",
      glyph: rank === "boss" ? enemyType.bossGlyph : rank === "elite" ? enemyType.eliteGlyph : enemyType.commonGlyph,
      element, rank, health: 99999, maxHealth: 99999, progress, speed: 0,
      reward: 0, boss: rank === "boss", elite: rank === "elite", hitUntil: 0,
      removableStatus: rank === "normal" ? "疾" : null
    };
  }

  function setupSkillPreview(previewId) {
    document.body.classList.add("skill-preview-capture");
    selectedMapId = previewId.startsWith("lijing") ? "earth" : "metal";
    applySelectedMap();
    buildBoard();
    buildPocket();
    state = freshState();
    state.running = true;
    state.lijingUnlocked = true;
    state.wave = previewId === "huangzhong" ? 10 : 7;
    state.wavePending = 0;
    state.food = 86;
    state.unlocked = Array(BOARD_SIZE).fill(false).map((_, index) => index < 14);
    const mainId = previewId.split("-").slice(0, 1)[0];
    placePreviewGeneral(mainId, [0, 1], previewId === "lijing-origin" ? 3 : 5);
    if (previewId.startsWith("lijing")) {
      placePreviewGeneral("guanyu", [2, 3], 4);
      placePreviewGeneral("zhaoyun", [4, 5], 3);
    } else {
      state.units[2] = previewUnit("刀", 3);
      state.units[3] = previewUnit("弓", 3);
      state.units[4] = previewUnit("槍", 2);
      state.units[5] = previewUnit("騎", 2);
    }
    state.enemies = [
      previewEnemy(0.18), previewEnemy(0.27), previewEnemy(0.36), previewEnemy(0.45),
      previewEnemy(0.54), previewEnemy(0.63), previewEnemy(0.71, "elite"),
      previewEnemy(0.79, previewId === "huangzhong" ? "boss" : "normal")
    ];
    if (previewId === "lijing-steal") {
      state.units[6] = previewUnit("刀", 3);
      state.generalCooldowns.lijing = 28;
    }
    if (previewId === "lijing-origin") state.units[6] = previewUnit("李", 1);
    dom.overlay.classList.add("hidden");
    dom.battlefield.dataset.preview = previewId;
    renderPocket();
    render();
    const formation = activeGeneralFormations().find(item => item.id === mainId);
    if (previewId === "lijing-passive") {
      showStatus("守字初心生效：其他已覺醒武將的技能冷卻加快。");
      return;
    }
    window.setTimeout(() => {
      if (previewId === "lijing-steal") useLijingSteal("board", 6);
      else if (previewId === "lijing-origin") moveOrCombine(6, 2);
      else if (formation) useGeneralSkill(formation.key);
    }, 420);
  }

  applySelectedMap();
  buildBoard();
  buildPocket();
  state = freshState();
  renderPocket();
  render();
  dom.refresh.addEventListener("click", refreshPocket);
  dom.skipTurn?.addEventListener("click", skipWaiting);
  dom.pauseGame?.addEventListener("click", togglePause);
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
  const requestedPreview = new URLSearchParams(window.location.search).get("skillPreview");
  if (requestedPreview && ["guanyu", "zhangfei", "zhaoyun", "machao", "huangzhong", "lijing", "lijing-steal", "lijing-origin", "lijing-passive"].includes(requestedPreview)) {
    setupSkillPreview(requestedPreview);
  }
})();
