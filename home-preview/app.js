(() => {
  "use strict";

  const CHAPTERS_URL = "data/chapters.json";
  const CHEST_STORAGE_KEY = "dianmo.home.chestQueue.v1";
  const HOUR_MS = 60 * 60 * 1000;
  const HOME_HUD_STATE = Object.freeze({
    level: 8,
    coins: 1250,
    xpCurrent: 450,
    xpTarget: 1000
  });
  const CHEST_TYPES = Object.freeze({
    wood: { name: "古木字匣", durationMs: 3 * HOUR_MS, durationLabel: "3 小時", maxJade: 15, chestClass: "chest-wood" },
    bronze: { name: "青銅字匣", durationMs: 8 * HOUR_MS, durationLabel: "8 小時", maxJade: 40, chestClass: "chest-bronze" },
    purple: { name: "紫金字匣", durationMs: 12 * HOUR_MS, durationLabel: "12 小時", maxJade: 60, chestClass: "chest-purple" },
    ancient: { name: "遠古巨匣", durationMs: 24 * HOUR_MS, durationLabel: "24 小時", maxJade: 120, chestClass: "chest-ancient" }
  });
  const INITIAL_CHEST_TYPES = ["wood", "bronze", "purple", "ancient"];
  const FALLBACK_STAGE = {
    chapterId: 0,
    elementId: "void",
    element: "無",
    name: "關卡資料暫時無法載入",
    boss: "—",
    generalId: "fallback",
    general: "守字人",
    heroGlyph: "守",
    role: "資料載入中",
    feature: "待",
    currentStage: 0,
    stars: 0,
    unlocked: false,
    color: "#7f8790",
    dark: "#3d4650",
    glow: "rgba(160,170,180,.32)",
    art: null,
    weakness: "請重新整理頁面",
    counter: "請確認以本機伺服器開啟遊戲。",
    lesson: "首頁仍可安全顯示，但正式章節資料尚未載入。",
    enemy: "章節資料載入失敗。"
  };

  let stages = [];
  let generals = [];

  function resolvePhaseArt(home) {
    if (!Array.isArray(home?.phase_art_paths)) return home?.art_path ?? null;
    const currentStage = Number(home.current_stage);
    const phase = home.phase_art_paths.find(entry => {
      const [start, end] = Array.isArray(entry?.stage_range) ? entry.stage_range : [];
      return Number.isInteger(start) && Number.isInteger(end) && currentStage >= start && currentStage <= end;
    });
    return phase?.path ?? home.art_path ?? null;
  }

  function mapChapterData(payload) {
    if (!Array.isArray(payload?.element_definitions) || !Array.isArray(payload?.chapters)) {
      throw new Error("chapters.json 缺少 element_definitions 或 chapters");
    }

    const elementNames = new Map(payload.element_definitions.map(element => [element.id, element.display_name]));
    const mappedStages = payload.chapters.map(chapter => {
      const element = elementNames.get(chapter.element_id);
      const general = chapter.featured_general;
      const home = chapter.home_display;
      const palette = home?.palette;
      const briefing = chapter.briefing;
      if (!element || !general || !home || !palette || !briefing) {
        throw new Error(`章節 ${chapter.chapter_id ?? "?"} 的首頁資料不完整`);
      }
      return {
        chapterId: chapter.chapter_id,
        elementId: chapter.element_id,
        element,
        name: chapter.name,
        boss: chapter.boss.glyph,
        generalId: general.id,
        general: general.display_name,
        heroGlyph: general.glyph,
        role: general.role_display,
        feature: home.feature_glyph,
        currentStage: home.current_stage,
        stars: home.stars,
        unlocked: home.unlocked,
        color: palette.color,
        dark: palette.dark,
        glow: palette.glow,
        art: resolvePhaseArt(home),
        weakness: briefing.weakness,
        counter: briefing.counter,
        lesson: briefing.lesson,
        enemy: briefing.enemy
      };
    });

    if (mappedStages.length !== 6) throw new Error("正式章節資料必須正好六章");
    return mappedStages;
  }

  async function loadStages() {
    const response = await fetch(CHAPTERS_URL, { cache: "no-cache" });
    if (!response.ok) throw new Error(`章節資料請求失敗：${response.status}`);
    return mapChapterData(await response.json());
  }

  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  let stageIndex = 0;
  let selectedGeneralIndex = 0;
  let toastTimer = 0;
  let chestTimer = 0;
  let chestState = null;

  const modal = {
    backdrop: $("#modal-backdrop"),
    title: $("#modal-title"),
    kicker: $("#modal-kicker"),
    content: $("#modal-content"),
    primary: $("#modal-primary")
  };

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    })[char]);
  }

  function renderHomeHud() {
    const xpTarget = Math.max(1, HOME_HUD_STATE.xpTarget);
    const xpCurrent = Math.min(Math.max(0, HOME_HUD_STATE.xpCurrent), xpTarget);
    const xpProgress = $("#xp-progress");

    $("#player-level").textContent = HOME_HUD_STATE.level.toLocaleString("zh-Hant");
    $("#coin-balance").textContent = HOME_HUD_STATE.coins.toLocaleString("zh-Hant");
    $("#xp-current").textContent = xpCurrent.toLocaleString("zh-Hant");
    $("#xp-target").textContent = xpTarget.toLocaleString("zh-Hant");
    $("#xp-fill").style.width = `${(xpCurrent / xpTarget) * 100}%`;
    xpProgress.setAttribute("aria-valuenow", String(xpCurrent));
    xpProgress.setAttribute("aria-valuemax", String(xpTarget));
  }

  function renderStage() {
    const stage = stages[stageIndex];
    const root = document.documentElement;
    root.style.setProperty("--stage", stage.color);
    root.style.setProperty("--stage-dark", stage.dark);
    root.style.setProperty("--stage-glow", stage.glow);
    root.dataset.element = stage.elementId;

    $("#chapter-kicker").textContent = `第${toChineseNumber(stageIndex + 1)}章・${stage.element}字脈`;
    $("#stage-name").textContent = stage.name;
    $("#element-glyph").textContent = stage.element;
    $("#stage-feature").textContent = stage.feature;
    $("#stage-progress").textContent = `第 ${stage.currentStage}／10 關・${stage.stars}／30 星`;
    $("#stage-lock").hidden = stage.unlocked;
    $("#stage-info").setAttribute("aria-label", `查看${stage.name}關卡情報`);
    const stageArt = $("#stage-art");
    stageArt.hidden = !stage.art;
    stageArt.src = stage.art ?? "";
    $("#stage-info").classList.toggle("has-stage-art", Boolean(stage.art));
    renderSelectedGeneral();
  }

  function renderSelectedGeneral() {
    const general = generals[selectedGeneralIndex];
    $("#hero-glyph").textContent = general.glyph;
    $("#hero-name").textContent = `${general.name} Lv.1`;
    $("#hero-role").textContent = general.role;
  }

  function toChineseNumber(number) {
    return ["零", "一", "二", "三", "四", "五", "六"][number] ?? number;
  }

  function shiftStage(delta) {
    stageIndex = (stageIndex + delta + stages.length) % stages.length;
    renderStage();
  }

  function openModal({ kicker = "系統情報", title, html, primary = "知道了", onPrimary = null }) {
    modal.kicker.textContent = kicker;
    modal.title.textContent = title;
    modal.content.innerHTML = html;
    modal.primary.textContent = primary;
    modal.primary.onclick = () => {
      if (onPrimary) onPrimary();
      closeModal();
    };
    modal.backdrop.hidden = false;
    document.body.style.overflow = "hidden";
    $("#modal-close").focus();
  }

  function closeModal() {
    modal.backdrop.hidden = true;
    document.body.style.overflow = "";
  }

  function showStageInfo() {
    const stage = stages[stageIndex];
    openModal({
      kicker: `第${toChineseNumber(stageIndex + 1)}章・${stage.element}字脈`,
      title: stage.name,
      html: `
        <div class="info-grid">
          <div class="info-card"><small>覺醒武將</small><b>${escapeHtml(stage.general)}</b></div>
          <div class="info-card"><small>章節首領</small><b>${escapeHtml(stage.boss)}</b></div>
          <div class="info-card"><small>目前進度</small><b>${stage.currentStage}／10 關</b></div>
          <div class="info-card"><small>狀態</small><b>${stage.unlocked ? "可出征" : "尚未解鎖"}</b></div>
        </div>
        <p>${escapeHtml(stage.lesson)}</p>
        <p><b>敵軍機制：</b>${escapeHtml(stage.enemy)}</p>
        <p><b>屬性弱點：</b>${escapeHtml(stage.weakness)}<br><b>機制破招：</b>${escapeHtml(stage.counter)}</p>
      `,
      primary: stage.unlocked ? "編入陣容" : "查看解鎖條件"
    });
  }

  function showDeploy() {
    const stage = stages[stageIndex];
    if (!stage.unlocked) {
      showToast(`需先通關上一章，才能進入${stage.name}`);
      return;
    }
    openModal({
      kicker: "出征確認",
      title: `${stage.name} ${stageIndex + 1}-1`,
      html: `
        <div class="info-grid">
          <div class="info-card"><small>主將</small><b>${escapeHtml(generals[selectedGeneralIndex].name)}</b></div>
          <div class="info-card"><small>模式</small><b>${escapeHtml($("#mode-label").textContent)}</b></div>
          <div class="info-card"><small>武器／字印</small><b>測試裝・0／3 槽</b></div>
          <div class="info-card"><small>戰前靈寶</small><b>神農拓脈鏟・黃階</b></div>
        </div>
        <p>每關採 9×11 戰盤與十波守城。第一個可玩版本只製作${escapeHtml(stages[0].name)} 1-1；裝備、字印與靈寶先以少量測試樣本驗證。</p>
      `,
      primary: "進入戰鬥（下一階段）",
      onPrimary: () => showToast("首頁流程正常；下一步接上可玩的十波戰鬥")
    });
  }

  function showDeck() {
    const options = generals.map((general, index) => `
      <button class="deck-option" type="button" data-deck-index="${index}">
        <b>${escapeHtml(general.glyph)}・${escapeHtml(general.name)}</b>
        <small>${escapeHtml(general.role)}・基礎主將已解鎖</small>
      </button>
    `).join("");
    openModal({ kicker: "出戰陣容", title: "基礎六將", html: `<div class="deck-list">${options}</div><p>六名基礎主將在教學完成後全部開放，避免玩家因缺少首領破招角色而卡關。章節通關改為獎勵殘頁、武器與靈寶。</p>` });
    $$('[data-deck-index]').forEach(button => button.addEventListener("click", () => {
      selectedGeneralIndex = Number(button.dataset.deckIndex);
      renderSelectedGeneral();
      closeModal();
      showToast(`已選擇主將：${generals[selectedGeneralIndex].name}`);
    }));
  }

  function showMode() {
    openModal({
      kicker: "玩法模式",
      title: "選擇征戰方式",
      html: `
        <div class="mode-list">
          <button class="mode-option" type="button" data-mode="征戰"><b>征戰</b><small>六章 × 十關 × 每關十波</small></button>
          <button class="mode-option" type="button" disabled><b>練習場・尚未開放</b><small>第二階段加入，不消耗資源</small></button>
          <button class="mode-option" type="button" disabled><b>修羅・尚未開放</b><small>核心戰鬥驗證後再製作</small></button>
        </div>
      `
    });
    $$('[data-mode]').forEach(button => button.addEventListener("click", () => {
      $("#mode-label").textContent = button.dataset.mode;
      closeModal();
      showToast(`已切換為${button.dataset.mode}模式`);
    }));
  }

  function showSimplePanel(type) {
    const panels = {
      profile: ["守字人履歷", `目前印階 ${HOME_HUD_STATE.level.toLocaleString("zh-Hant")}；已收集 1／36 名武將。履歷與雲端存檔不列入第一版。`],
      coins: ["文幣", `持有 ${HOME_HUD_STATE.coins.toLocaleString("zh-Hant")}。用於提升完整武將的字魂等級，不用來抽單字。`],
      jade: ["墨玉", `持有 ${chestState?.jade ?? 300}。可依字匣剩餘時間等比例支付墨玉立即完成；本機原型會保存操作，正式版由伺服器校驗。`],
      settings: ["系統選單", "音效、震動、畫質與帳號綁定將在戰鬥原型穩定後接上。"],
      pass: ["天書字脈", "首頁保留免費進度入口。付費戰令不是第一版開發項目。"],
      record: [stages[stageIndex].name, stages[stageIndex].enemy]
    };
    const [title, copy] = panels[type] ?? ["功能說明", "此功能仍在規劃中。"];
    openModal({ title, html: `<p>${escapeHtml(copy)}</p>` });
  }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2300);
  }

  function createInitialChestState(now = Date.now()) {
    return {
      version: 1,
      jade: 300,
      slots: INITIAL_CHEST_TYPES.map((type, index) => ({
        type,
        status: index === 0 ? "unlocking" : "waiting",
        startedAt: index === 0 ? now : null,
        endsAt: index === 0 ? now + CHEST_TYPES[type].durationMs : null
      }))
    };
  }

  function normalizeChestState(value) {
    if (!value || value.version !== 1 || !Array.isArray(value.slots) || value.slots.length !== 4) return null;

    let hasUnlockingSlot = false;
    const slots = value.slots.map(slot => {
      if (!slot || slot.status === "empty" || !CHEST_TYPES[slot.type]) {
        return { type: null, status: "empty", startedAt: null, endsAt: null };
      }

      const status = ["waiting", "unlocking", "ready"].includes(slot.status) ? slot.status : "waiting";
      const startedAt = Number.isFinite(slot.startedAt) ? slot.startedAt : null;
      const endsAt = Number.isFinite(slot.endsAt) ? slot.endsAt : null;
      if (status === "unlocking" && !hasUnlockingSlot && startedAt !== null && endsAt !== null) {
        hasUnlockingSlot = true;
        return { type: slot.type, status, startedAt, endsAt };
      }
      return { type: slot.type, status: status === "ready" ? "ready" : "waiting", startedAt: null, endsAt: null };
    });

    return {
      version: 1,
      jade: Number.isFinite(value.jade) ? Math.max(0, Math.floor(value.jade)) : 300,
      slots
    };
  }

  function loadChestState() {
    try {
      const storedValue = window.localStorage.getItem(CHEST_STORAGE_KEY);
      if (!storedValue) return createInitialChestState();
      return normalizeChestState(JSON.parse(storedValue)) ?? createInitialChestState();
    } catch (error) {
      console.warn("字匣狀態讀取失敗，改用本次瀏覽狀態", error);
      return createInitialChestState();
    }
  }

  function saveChestState() {
    try {
      window.localStorage.setItem(CHEST_STORAGE_KEY, JSON.stringify(chestState));
    } catch (error) {
      console.warn("字匣狀態無法保存；關閉頁面後可能重置", error);
    }
  }

  function formatCountdown(milliseconds) {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds].map(value => String(value).padStart(2, "0")).join(":");
  }

  function formatCountdownForSpeech(milliseconds) {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours} 小時 ${minutes} 分 ${seconds} 秒`;
  }

  function getAccelerationCost(slot, now = Date.now()) {
    const definition = CHEST_TYPES[slot.type];
    const remaining = Math.max(0, slot.endsAt - now);
    if (!definition || remaining === 0) return 0;
    return Math.max(1, Math.min(definition.maxJade, Math.ceil(definition.maxJade * remaining / definition.durationMs)));
  }

  function renderChestSlot(button, slot, index, now) {
    button.className = `chest-slot ${slot.status}`;
    button.dataset.chestSlot = String(index);

    if (slot.status === "empty") {
      button.innerHTML = '<span class="empty-rune" aria-hidden="true">空</span><b>字匣位</b><small class="chest-state">等待戰後字匣</small>';
      button.setAttribute("aria-label", `第 ${index + 1} 個字匣位，目前空置`);
      return;
    }

    const definition = CHEST_TYPES[slot.type];
    const chestMarkup = `<span class="chest ${definition.chestClass}" aria-hidden="true"><i></i></span><b>${definition.name}</b>`;
    if (slot.status === "waiting") {
      button.innerHTML = `${chestMarkup}<small class="chest-state">等待解鎖</small><span class="chest-duration">${definition.durationLabel}</span>`;
      button.setAttribute("aria-label", `${definition.name}，等待解鎖，需 ${definition.durationLabel}，點擊開始`);
      return;
    }

    if (slot.status === "ready") {
      button.innerHTML = `${chestMarkup}<small class="chest-state">可領取</small><span class="chest-action">點擊領取</span>`;
      button.setAttribute("aria-label", `${definition.name}，解鎖完成，點擊領取`);
      return;
    }

    const remaining = Math.max(0, slot.endsAt - now);
    const elapsedRatio = Math.min(1, Math.max(0, 1 - remaining / definition.durationMs));
    const cost = getAccelerationCost(slot, now);
    button.innerHTML = `${chestMarkup}
      <small class="chest-state">解鎖中</small>
      <time class="chest-countdown" datetime="PT${Math.ceil(remaining / 1000)}S">${formatCountdown(remaining)}</time>
      <span class="chest-cost">◆ ${cost} 立即完成</span>
      <span class="chest-timer-track" aria-hidden="true"><i style="width:${(elapsedRatio * 100).toFixed(2)}%"></i></span>`;
    button.setAttribute("aria-label", `${definition.name}，解鎖中，剩餘 ${formatCountdownForSpeech(remaining)}，點擊可花費 ${cost} 墨玉立即完成`);
  }

  function renderChestQueue(now = Date.now()) {
    const buttons = $$('[data-chest-slot]');
    chestState.slots.forEach((slot, index) => renderChestSlot(buttons[index], slot, index, now));
    $("#jade-balance").textContent = chestState.jade.toLocaleString("zh-Hant");

    const occupiedCount = chestState.slots.filter(slot => slot.status !== "empty").length;
    const capacity = $("#chest-capacity");
    const capacityCopy = occupiedCount === 4
      ? "4／4 槽已滿・先解鎖或領取"
      : `${occupiedCount}／4 槽・同時解鎖 1 匣`;
    if (capacity.textContent !== capacityCopy) capacity.textContent = capacityCopy;
    $("#chest-grid").classList.toggle("is-full", occupiedCount === 4);
  }

  function completeExpiredChest({ announce = true } = {}) {
    const now = Date.now();
    const index = chestState.slots.findIndex(slot => slot.status === "unlocking" && slot.endsAt <= now);
    if (index < 0) return false;

    const slot = chestState.slots[index];
    slot.status = "ready";
    slot.startedAt = null;
    slot.endsAt = null;
    saveChestState();
    renderChestQueue(now);
    if (announce) showToast(`${CHEST_TYPES[slot.type].name}解鎖完成，可以領取`);
    return true;
  }

  function beginChestUnlock(index) {
    completeExpiredChest({ announce: false });
    const slot = chestState.slots[index];
    if (!slot || slot.status !== "waiting") return false;

    const activeSlot = chestState.slots.find(item => item.status === "unlocking");
    if (activeSlot) {
      showToast(`${CHEST_TYPES[activeSlot.type].name}仍在解鎖，同時只能進行 1 匣`);
      return false;
    }
    if (chestState.slots.some(item => item.status === "ready")) {
      showToast("請先領取已完成的字匣，再開始下一匣");
      return false;
    }

    const now = Date.now();
    slot.status = "unlocking";
    slot.startedAt = now;
    slot.endsAt = now + CHEST_TYPES[slot.type].durationMs;
    saveChestState();
    renderChestQueue(now);
    showToast(`${CHEST_TYPES[slot.type].name}開始解鎖`);
    return true;
  }

  function collectChest(index) {
    const slot = chestState.slots[index];
    if (!slot || slot.status !== "ready") return;

    const collectedName = CHEST_TYPES[slot.type].name;
    chestState.slots[index] = { type: null, status: "empty", startedAt: null, endsAt: null };
    saveChestState();
    renderChestQueue();
    const hasWaitingChest = chestState.slots.some(item => item.status === "waiting");
    showToast(hasWaitingChest
      ? `${collectedName}已領取；請選擇下一個字匣開始解鎖`
      : `${collectedName}已領取；獎勵由伺服器結算`);
  }

  function accelerateChest(index) {
    completeExpiredChest({ announce: false });
    const slot = chestState.slots[index];
    if (!slot || slot.status !== "unlocking") return;

    const cost = getAccelerationCost(slot);
    if (chestState.jade < cost) {
      showToast(`墨玉不足：需要 ${cost}，目前持有 ${chestState.jade}`);
      return;
    }

    chestState.jade -= cost;
    slot.status = "ready";
    slot.startedAt = null;
    slot.endsAt = null;
    saveChestState();
    renderChestQueue();
    showToast(`已消耗 ${cost} 墨玉；${CHEST_TYPES[slot.type].name}可領取`);
  }

  function showChestAcceleration(index) {
    completeExpiredChest({ announce: false });
    const slot = chestState.slots[index];
    if (!slot || slot.status !== "unlocking") return;

    const definition = CHEST_TYPES[slot.type];
    const remaining = Math.max(0, slot.endsAt - Date.now());
    const cost = getAccelerationCost(slot);
    openModal({
      kicker: "字匣加速",
      title: definition.name,
      html: `
        <div class="info-grid">
          <div class="info-card"><small>剩餘時間</small><b>${formatCountdown(remaining)}</b></div>
          <div class="info-card"><small>目前墨玉</small><b>${chestState.jade}</b></div>
        </div>
        <p>立即完成費用會依剩餘時間等比例遞減，本字匣最高收取 ${definition.maxJade} 墨玉。</p>
      `,
      primary: `花費 ${cost} 墨玉立即完成`,
      onPrimary: () => accelerateChest(index)
    });
  }

  function handleChestClick(index) {
    completeExpiredChest({ announce: false });
    const slot = chestState.slots[index];
    if (!slot) return;
    if (slot.status === "waiting") beginChestUnlock(index);
    else if (slot.status === "unlocking") showChestAcceleration(index);
    else if (slot.status === "ready") collectChest(index);
    else showToast(`第 ${index + 1} 個字匣位目前空置；戰鬥掉落由獎勵系統判定`);
  }

  function initializeChestQueue() {
    chestState = loadChestState();
    if (!completeExpiredChest({ announce: false })) {
      saveChestState();
      renderChestQueue();
    }
    window.clearInterval(chestTimer);
    chestTimer = window.setInterval(() => {
      if (!completeExpiredChest()) renderChestQueue();
    }, 1000);
  }

  function bindInteractions() {
    $("#stage-prev").addEventListener("click", () => shiftStage(-1));
    $("#stage-next").addEventListener("click", () => shiftStage(1));
    $("#stage-info").addEventListener("click", showStageInfo);
    $("#record-button").addEventListener("click", showStageInfo);
    $("#deploy-button").addEventListener("click", showDeploy);
    $("#modal-close").addEventListener("click", closeModal);
    modal.backdrop.addEventListener("click", event => { if (event.target === modal.backdrop) closeModal(); });
    document.addEventListener("keydown", event => { if (event.key === "Escape" && !modal.backdrop.hidden) closeModal(); });

    $$('[data-open]').forEach(button => button.addEventListener("click", () => {
      if (button.dataset.open === "deck") showDeck();
      else if (button.dataset.open === "mode") showMode();
      else if (button.dataset.open !== "record") showSimplePanel(button.dataset.open);
    }));

    $$('[data-chest-slot]').forEach(button => button.addEventListener("click", () => {
      handleChestClick(Number(button.dataset.chestSlot));
    }));

    $$('[data-tab]').forEach(button => button.addEventListener("click", () => {
      const labels = { shop: "商閣尚未開放", collection: "字庫將在戰鬥原型後接上", home: "目前已在出征首頁", clan: "軍盟不列入第一版", trial: "修羅需通關主線後開放" };
      if (button.dataset.tab === "home") {
        $$('[data-tab]').forEach(item => item.classList.toggle("active", item === button));
      }
      showToast(labels[button.dataset.tab]);
    }));

    let touchStartX = null;
    $("#stage-info").addEventListener("touchstart", event => { touchStartX = event.changedTouches[0].clientX; }, { passive: true });
    $("#stage-info").addEventListener("touchend", event => {
      if (touchStartX === null) return;
      const delta = event.changedTouches[0].clientX - touchStartX;
      touchStartX = null;
      if (Math.abs(delta) > 55) shiftStage(delta > 0 ? -1 : 1);
    }, { passive: true });
  }

  async function boot() {
    let loadError = null;
    try {
      stages = await loadStages();
    } catch (error) {
      loadError = error;
      stages = [FALLBACK_STAGE];
      console.error("無法載入正式章節資料", error);
    }

    generals = stages.map(stage => ({
      id: stage.generalId,
      name: stage.general,
      glyph: stage.heroGlyph,
      role: stage.role
    }));
    selectedGeneralIndex = Math.max(0, generals.findIndex(general => general.id === stages[0].generalId));
    renderHomeHud();
    initializeChestQueue();
    bindInteractions();
    renderStage();
    if (loadError) showToast("章節資料載入失敗，請以本機伺服器重新開啟");
  }

  boot();
})();
